'use strict';

function loadMenu() {
  // Bootstrap canvas
  const canvas = document.getElementById('myCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Estado UI básico
  const ui = {
    selectedTime: 120, // mantiene valor por compatibilidad (sin selector)
    selectedDifficulty: 'normal',
    selectedPieces: 6,
    imagesSrc: [
      'assets/rompecabezasDesierto.png',
      'assets/rompecabezasJungla.png',
      'assets/rompecabezasCiudad.png',
      'assets/rompecabezasNieve.png',
      'assets/rompecabezasMontaña.png',
      'assets/rompecabezasPlaya.png',
      'assets/rompecabezasRandom.png'
    ],
    images: [],
    imageIndex: 0
  };

  // Layout del panel
  const panel = { x: 0, y: 0, w: 800, h: 680 };
  function centerPanel() {
    panel.x = Math.round((canvas.width - panel.w) / 2);
    panel.y = Math.round((canvas.height - panel.h) / 2);
  }
  function centerX(w) {
    return Math.round(panel.x + panel.w / 2 - w / 2);
  }

  // Variables de layout/inputs
  let diffButtons = [];
  let thumbsArea = { x: 0, y: 0, w: panel.w, h: 180 };
  let thumbTiles = [];
  let hoverIndex = -1;
  let btnJugar = { x: 0, y: 0, w: 200, h: 46, label: 'JUGAR' };

  // Agregar flag de carga para evitar doble inicio
  let gamePanelLoaded = false;

  // Helper: resolver índice de imagen (maneja "Random")
  function resolveSelectedImageIndex() {
    const isRandomIndex = ui.imageIndex === ui.imagesSrc.length - 1;
    const isRandomName = (ui.imagesSrc[ui.imageIndex] || '').toLowerCase().includes('random');
    if (isRandomIndex || isRandomName) {
      const maxIndex = Math.max(0, ui.imagesSrc.length - 1);
      if (maxIndex === 0) return 0;
      return Math.floor(Math.random() * maxIndex); // 0..(n-2), excluye "Random"
    }
    return ui.imageIndex;
  }

  // Cargar gamePanel.js y arrancar con la configuración
  function loadGamePanel(config) {
    if (gamePanelLoaded) return;
    gamePanelLoaded = true;

    // Detener listeners del menú
    const canvas = document.getElementById('myCanvas');
    if (canvas) {
      canvas.removeEventListener('click', onCanvasClick);
      canvas.removeEventListener('mousemove', onCanvasMove);
      canvas.removeEventListener('mouseleave', onCanvasLeave);
    }

    // Mostrar un breve estado de carga
    try {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '600 18px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Cargando juego...', canvas.width / 2, canvas.height / 2);
    } catch {}

    // Exponer config para gamePanel.js
    window.__gameConfig = config;
    try { sessionStorage.setItem('gameConfig', JSON.stringify(config)); } catch {}

    // Inyectar el script del panel de juego
    const script = document.createElement('script');
    // Ruta relativa al HTML (misma carpeta que preGameMenu.js)
    script.src = 'js/game/gamePanel.js';
    script.onload = () => {
      // Si gamePanel.js expone una función de arranque, llamarla
      if (typeof window.startGamePanel === 'function') {
        try {
          const ctx = canvas.getContext('2d');
          window.startGamePanel(canvas, ctx, config);
        } catch (e) {
          console.error('Error al iniciar el panel de juego:', e);
        }
      }
    };
    script.onerror = () => console.error('No se pudo cargar js/game/gamePanel.js');
    document.head.appendChild(script);
  }

  function recalcLayout() {
    // Dificultad (3 botones centrados)
    const dW = 120, dH = 40, dGap = 30, dY = panel.y + 200;
    const dMidX = centerX(dW);
    diffButtons = [
      { x: dMidX - (dW + dGap), y: dY, w: dW, h: dH, label: 'Fácil',   value: 'facil',   group: 'diff' },
      { x: dMidX,               y: dY, w: dW, h: dH, label: 'Normal',  value: 'normal',  group: 'diff' },
      { x: dMidX + (dW + dGap), y: dY, w: dW, h: dH, label: 'Difícil', value: 'dificil', group: 'diff' },
    ];

    // Thumbnails centrados con margen lateral
    const marginX = 40;
    thumbsArea = { x: panel.x + marginX, y: panel.y + 320, w: panel.w - marginX * 2, h: 180 };

    // Botón JUGAR centrado
    btnJugar = { x: centerX(200), y: panel.y + 550, w: 200, h: 46, label: 'JUGAR' };
  }

  // Carga de imágenes (primero)
  let imagesLoaded = 0;
  const imgTitulo = new Image();
  const totalToLoad = 1 + ui.imagesSrc.length;
  function checkImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalToLoad) iniciarMenu();
  }
  imgTitulo.addEventListener('load', checkImagesLoaded);
  imgTitulo.addEventListener('error', (e) => { console.error('No se pudo cargar la imagen del título', e); checkImagesLoaded(); });
  imgTitulo.src = 'assets/tituloBlocka.png';

  ui.images = ui.imagesSrc.map(src => {
    const im = new Image();
    im.addEventListener('load', checkImagesLoaded);
    im.addEventListener('error', (e) => { console.error('No se pudo cargar imagen del carrusel', src, e); checkImagesLoaded(); });
    im.src = src;
    return im;
  });

  // Funciones principales
  function iniciarMenu() {
    centerPanel();
    recalcLayout();

    if (typeof window.startMenu === 'function') {
      window.startMenu(ctx, canvas);
    } else {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 32px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Menú inicial', canvas.width / 2, canvas.height / 2);
      ctx.restore();
    }
  }

  function drawForm() {
    centerPanel();
    recalcLayout();

    ctx.save();
    // Limpiar para que se vea el fondo desde CSS
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Panel semitransparente
    ctx.fillStyle = 'rgba(25, 99, 195, 0.85)';
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);

    // Título (imagen) arriba
    drawTitleImage();

    // Subtítulos cerca de sus controles
    const subtPad = 24;
    drawSubtitulo(diffButtons[0] ? diffButtons[0].y - subtPad : panel.y + 150, 'Dificultad');
    drawSubtitulo(thumbsArea.y - subtPad, 'Rompecabezas');

    // Controles
    diffButtons.forEach(b => drawButton(b, ui.selectedDifficulty === b.value));
    drawThumbnailsGrid();
    drawButtonJugar();

    ctx.restore();
  }

  // Interacción
  function pointInRect(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  function onCanvasClick(ev) {
    centerPanel();
    recalcLayout();

    const rect = canvas.getBoundingClientRect();
    const mx = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const my = (ev.clientY - rect.top) * (canvas.height / rect.height);

    for (const b of diffButtons) {
      if (pointInRect(mx, my, b)) {
        ui.selectedDifficulty = b.value;
        ui.selectedPieces = (b.value === 'facil') ? 4 : (b.value === 'dificil') ? 8 : 6;
        drawForm();
        return;
      }
    }

    for (const t of thumbTiles) {
      if (pointInRect(mx, my, t.rect)) {
        ui.imageIndex = t.index;
        drawForm();
        return;
      }
    }

    if (pointInRect(mx, my, btnJugar)) {
      const chosenImageIndex = resolveSelectedImageIndex();
      const config = {
        difficulty: ui.selectedDifficulty,
        pieces: ui.selectedPieces,
        imageIndex: chosenImageIndex,
        image: ui.imagesSrc[chosenImageIndex]
      };
      loadGamePanel(config);
      return;
    }
  }

  function onCanvasMove(ev) {
    centerPanel();
    recalcLayout();

    const rect = canvas.getBoundingClientRect();
    const mx = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const my = (ev.clientY - rect.top) * (canvas.height / rect.height);
    let newHover = -1;
    for (let i = 0; i < thumbTiles.length; i++) {
      if (pointInRect(mx, my, thumbTiles[i].rect)) { newHover = i; break; }
    }
    if (newHover !== hoverIndex) {
      hoverIndex = newHover;
      drawForm();
    }
  }

  function onCanvasLeave() {
    if (hoverIndex !== -1) {
      hoverIndex = -1;
      drawForm();
    }
  }

  // Exponer/arrancar menú
  window.startMenu = function (ctxExtern, canvasExtern) {
    drawForm();
    canvasExtern.removeEventListener('click', onCanvasClick);
    canvasExtern.addEventListener('click', onCanvasClick);
    canvasExtern.removeEventListener('mousemove', onCanvasMove);
    canvasExtern.removeEventListener('mouseleave', onCanvasLeave);
    canvasExtern.addEventListener('mousemove', onCanvasMove);
    canvasExtern.addEventListener('mouseleave', onCanvasLeave);
  };

  // Dibujo de shapes/controles
  function drawSubtitulo(y, text) {
    ctx.fillStyle = '#0e0e0e';
    ctx.font = '700 18px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, panel.x + panel.w / 2, y);
  }

  function drawRoundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawButton(b, selected) {
    ctx.save();
    drawRoundedRect(b.x, b.y, b.w, b.h, 10);
    ctx.fillStyle = selected ? '#7C3AED' : '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = selected ? '#4A1F85' : '#C5C2C2';
    ctx.stroke();
    ctx.fillStyle = selected ? '#fff' : '#1F1D1D';
    ctx.font = '600 16px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2);
    ctx.restore();
  }

  function drawButtonJugar() {
    ctx.save();
    drawRoundedRect(btnJugar.x, btnJugar.y, btnJugar.w, btnJugar.h, 12);
    ctx.fillStyle = '#7C3AED';
    ctx.fill();
    ctx.strokeStyle = '#4A1F85';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '700 18px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btnJugar.label, btnJugar.x + btnJugar.w / 2, btnJugar.y + btnJugar.h / 2);
    ctx.restore();
  }

  function drawTitleImage() {
    if (!imgTitulo || !imgTitulo.naturalWidth) return;
    const paddingX = 40;
    const topPad = 40;
    const maxH = 100;
    const availW = panel.w - paddingX * 2;
    const scale = Math.min(availW / imgTitulo.width, maxH / imgTitulo.height);
    const destW = Math.round(imgTitulo.width * scale);
    const destH = Math.round(imgTitulo.height * scale);
    const dx = centerX(destW);
    const dy = Math.round(panel.y + topPad);
    ctx.save();
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(imgTitulo, dx, dy, destW, destH);
    ctx.imageSmoothingEnabled = prev;
    ctx.restore();
  }

  function drawThumbnailsGrid() {
    const n = ui.images.length;
    const cols = Math.min(4, Math.max(2, n));
    const rows = Math.ceil(n / cols);
    const gap = 12;
    const tileW = Math.floor((thumbsArea.w - gap * (cols + 1)) / cols);
    const tileH = Math.floor((thumbsArea.h - gap * (rows + 1)) / rows);

    thumbTiles = [];
    for (let i = 0; i < n; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = Math.round(thumbsArea.x + gap + col * (tileW + gap));
      const y = Math.round(thumbsArea.y + gap + row * (tileH + gap));

      ctx.save();
      drawRoundedRect(x, y, tileW, tileH, 8);
      ctx.clip();
      const img = ui.images[i];
      if (img && img.complete && img.naturalWidth) {
        const iw = img.naturalWidth, ih = img.naturalHeight;
        const scale = Math.max(tileW / iw, tileH / ih);
        const sw = Math.round(tileW / scale);
        const sh = Math.round(tileH / scale);
        const sx = Math.round((iw - sw) / 2);
        const sy = Math.round((ih - sh) / 2);
        ctx.drawImage(img, sx, sy, sw, sh, x, y, tileW, tileH);
      } else {
        ctx.fillStyle = '#ccc';
        ctx.fillRect(x, y, tileW, tileH);
      }
      ctx.restore();

      drawRoundedRect(x, y, tileW, tileH, 8);
      ctx.strokeStyle = '#C5C2C2';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (i === ui.imageIndex) {
        ctx.save();
        drawRoundedRect(x - 2, y - 2, tileW + 4, tileH + 4, 10);
        ctx.strokeStyle = '#4A1F85';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }

      if (i === hoverIndex) {
        ctx.save();
        drawRoundedRect(x, y, tileW, tileH, 8);
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#7C3AED';
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#7C3AED';
        ctx.stroke();
        ctx.restore();
      }

      thumbTiles.push({ index: i, rect: { x, y, w: tileW, h: tileH } });
    }
  }
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  loadMenu();
});

