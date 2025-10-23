'use strict';

/**
 * normalizeText
 * Normaliza un string a minúsculas y sin acentos para comparaciones robustas.
 */
function normalizeText(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * piecesFromDifficulty
 * Devuelve la cantidad de piezas según la dificultad elegida.
 * Fácil=4, Normal=6, Difícil=8.
 */
function piecesFromDifficulty(diff) {
  const d = normalizeText(diff);
  if (d.startsWith('fac')) return 4;
  if (d.startsWith('dif')) return 8;
  return 6; // normal
}

/**
 * loadMenu
 * Punto de entrada del menú previo al juego.
 * - Renderiza panel con: título, selección de dificultad, grilla de imágenes y botón “JUGAR”.
 * - Maneja la ruleta cuando se elige “Random”.
 * - Lanza el gamePanel correspondiente con la configuración elegida.
 */
function loadMenu() {
  // Bootstrap canvas
  const canvas = document.getElementById('myCanvas');
  if (!canvas) return;
  canvas.style.background = 'center / cover no-repeat url("assets/fondoIngame2.png")';
  const ctx = canvas.getContext('2d');

  // Estado UI del menú: dificultad, lista de imágenes y selección actual
  const ui = {
    selectedDifficulty: 'Normal',
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

  // Panel base y helpers de centrado (faltaban)
  const panel = { x: 0, y: 0, w: 800, h: 680 };
  function centerPanel() {
    panel.x = Math.round((canvas.width - panel.w) / 2);
    panel.y = Math.round((canvas.height - panel.h) / 2);
  }
  function centerX(w) { return Math.round(panel.x + panel.w / 2 - w / 2); }

  // Variables de layout/inputs (faltaban)
  let diffButtons = [];
  let thumbsArea;              // se setea en recalcLayout
  let thumbTiles = [];
  let hoverIndex = -1;
  let btnJugar = { x: 0, y: 0, w: 200, h: 46, label: 'JUGAR' };
  let linkInstruccionesRect = null;

  // Evitar doble inicio del panel de juego
  let gamePanelLoaded = false;

  // ------------------------------------------------------
  // Ruleta de imágenes (agrupado) — mover arriba de los handlers
  // ------------------------------------------------------

  // Estado de ruleta y timers (controlan el ciclo/espera de la animación)
  let isRoulette = false;
  let rouletteTimer = null;
  let rouletteEndTimer = null;

  /**
   * playRandomRoulette
   * Anima una “ruleta” sobre las miniaturas excluyendo “Random”.
   * 1) Cicla visualmente por las opciones (120 ms) por ~1.4s.
   * 2) Detiene en una imagen al azar (no “Random”).
   * 3) Espera ~2.2s para suavizar la transición y ejecuta el callback con el índice final.
   */
  function playRandomRoulette(done) {
    if (isRoulette) return;
    isRoulette = true;
    const total = ui.imagesSrc.length;
    const pool = Array.from({ length: Math.max(0, total - 1) }, (_, i) => i); // 0..n-2
    if (pool.length === 0) { isRoulette = false; done?.(0); return; }

    let i = 0;
    rouletteTimer = setInterval(() => {
      ui.imageIndex = pool[i++ % pool.length];
      drawForm();
    }, 120);

    rouletteEndTimer = setTimeout(() => {
      clearInterval(rouletteTimer); rouletteTimer = null;
      const finalIdx = pool[Math.floor(Math.random() * pool.length)];
      ui.imageIndex = finalIdx;
      drawForm();
      setTimeout(() => {
        done?.(finalIdx); // loadGamePanel() limpiará isRoulette y timers
      }, 2200);
    }, 1400);
  }

  // ------------------------------------------------------
  // Lanzadores de paneles
  // ------------------------------------------------------

  /**
   * loadGamePanel
   * Limpia listeners/timers del menú y carga el script de juego, iniciándolo con config.
   */
  function loadGamePanel(config) {
    if (gamePanelLoaded) return;
    gamePanelLoaded = true;

    // NUEVO: limpiar ruleta si estaba corriendo
    if (rouletteTimer) { clearInterval(rouletteTimer); rouletteTimer = null; }
    if (rouletteEndTimer) { clearTimeout(rouletteEndTimer); rouletteEndTimer = null; }
    isRoulette = false;

    const canvas = document.getElementById('myCanvas');
    if (canvas) {
      canvas.removeEventListener('click', onCanvasClick);
      canvas.removeEventListener('mousemove', onCanvasMove);
      canvas.removeEventListener('mouseleave', onCanvasLeave);
    }

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

    window.__gameConfig = config;
    try { sessionStorage.setItem('gameConfig', JSON.stringify(config)); } catch {}

    const script = document.createElement('script');
    script.src = 'js/game/gamePanel.js';
    script.onload = () => {
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

  /**
   * loadInstructionsPanel
   * Limpia listeners del menú y muestra el panel de instrucciones.
   */
  function loadInstructionsPanel() {
    // quitar listeners del menú
    const canvas = document.getElementById('myCanvas');
    if (canvas) {
      canvas.removeEventListener('click', onCanvasClick);
      canvas.removeEventListener('mousemove', onCanvasMove);
      canvas.removeEventListener('mouseleave', onCanvasLeave);
    }
    const script = document.createElement('script');
    script.src = 'js/game/instructionsPanel.js';
    script.onload = () => {
      if (typeof window.startInstructionsPanel === 'function') {
        try {
          const ctx = canvas.getContext('2d');
          window.startInstructionsPanel(canvas, ctx);
        } catch (e) { console.error('Error al iniciar instrucciones:', e); }
      }
    };
    script.onerror = () => console.error('No se pudo cargar js/game/instructionsPanel.js');
    document.head.appendChild(script);
  }

  // ------------------------------------------------------
  // Layout del panel principal (posiciones y medidas)
  // ------------------------------------------------------

  /**
   * recalcLayout
   * Recalcula posiciones del panel y controles según el tamaño del canvas.
   */
  function recalcLayout() {
    const dW = 120, dH = 40, dGap = 30, dY = panel.y + 200;
    const dMidX = centerX(dW);
    diffButtons = [
      { x: dMidX - (dW + dGap), y: dY, w: dW, h: dH, label: 'Fácil',   value: 'Fácil',   group: 'diff' },
      { x: dMidX,               y: dY, w: dW, h: dH, label: 'Normal',  value: 'Normal',  group: 'diff' },
      { x: dMidX + (dW + dGap), y: dY, w: dW, h: dH, label: 'Difícil', value: 'Difícil', group: 'diff' },
    ];

    const marginX = 40;
    thumbsArea = { x: panel.x + marginX, y: panel.y + 320, w: panel.w - marginX * 2, h: 180 };

    btnJugar = { x: centerX(200), y: panel.y + 550, w: 200, h: 46, label: 'JUGAR' };
  }

  // ------------------------------------------------------
  // Carga asíncrona de imágenes (título y miniaturas)
  // ------------------------------------------------------

  // Contador de recursos cargados y callback al completar
  // checkImagesLoaded: cada imagen que carga avanza el contador; cuando todas están OK, inicia el menú.
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

  // ------------------------------------------------------
  // Arranque del menú
  // ------------------------------------------------------

  /**
   * iniciarMenu
   * Inicializa y dibuja el menú una vez que todo está cargado.
   * Si existe un “startMenu” externo, lo usa para permitir wrappers.
   */
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

  // ------------------------------------------------------
  // Dibujo principal del formulario y utilitarios
  // ------------------------------------------------------

  /**
   * drawForm
   * Redibuja el panel del menú completo: panel, título, subtítulos, botones, grilla y botón JUGAR.
   */
  function drawForm() {
    centerPanel();
    recalcLayout();

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(25, 99, 195, 0.85)';
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);

    drawTitleImage();

    const subtPad = 24;
    drawSubtitulo(diffButtons[0] ? diffButtons[0].y - subtPad : panel.y + 150, 'Dificultad');
    drawSubtitulo(thumbsArea.y - subtPad, 'Rompecabezas');

    diffButtons.forEach(b => drawButton(b, ui.selectedDifficulty === b.value));
    drawThumbnailsGrid();

    // Link "Instrucciones" sobre el botón JUGAR
    drawLinkInstrucciones();

    drawButtonJugar();

    ctx.restore();
  }

  /**
   * pointInRect
   * Utils de hit-testing para clicks/hover.
   */
  function pointInRect(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  // ------------------------------------------------------
  // Interacción (click/hover)
  // ------------------------------------------------------

  /**
   * onCanvasClick
   * Maneja clicks en dificultad, miniaturas, link de instrucciones y botón JUGAR.
   * Si está seleccionada la imagen random, ejecuta la ruleta antes de lanzar el juego.
   */
  function onCanvasClick(ev) {
    if (isRoulette) return; // bloquear clicks durante ruleta
    centerPanel();
    recalcLayout();

    const rect = canvas.getBoundingClientRect();
    const mx = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const my = (ev.clientY - rect.top) * (canvas.height / rect.height);

    for (const b of diffButtons) {
      if (pointInRect(mx, my, b)) {
        ui.selectedDifficulty = b.value;
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

    if (linkInstruccionesRect && pointInRect(mx, my, linkInstruccionesRect)) {
      loadInstructionsPanel();
      return;
    }

    if (pointInRect(mx, my, btnJugar)) {
      const isRandomSelected =
        ui.imageIndex === ui.imagesSrc.length - 1 ||
        (ui.imagesSrc[ui.imageIndex] || '').toLowerCase().includes('random');

      if (isRandomSelected) {
        // Ejecutar ruleta y luego iniciar juego con la imagen elegida
        playRandomRoulette((finalIdx) => {
          const config = {
            difficulty: ui.selectedDifficulty,
            pieces: piecesFromDifficulty(ui.selectedDifficulty),
            imageIndex: finalIdx,
            image: ui.imagesSrc[finalIdx]
          };
          loadGamePanel(config);
        });
        return;
      }

      // Flujo normal (no-random) simplificado
      const chosenImageIndex = ui.imageIndex;
      const config = {
        difficulty: ui.selectedDifficulty,
        pieces: piecesFromDifficulty(ui.selectedDifficulty),
        imageIndex: chosenImageIndex,
        image: ui.imagesSrc[chosenImageIndex]
      };
      loadGamePanel(config);
      return;
    }
  }

  /**
   * onCanvasMove
   * Maneja el hover sobre miniaturas (resalta) mientras no esté corriendo la ruleta.
   */
  function onCanvasMove(ev) {
    if (isRoulette) return; // bloquear hover durante ruleta
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

  /**
   * onCanvasLeave
   * Limpia el hover al salir del canvas.
   */
  function onCanvasLeave() {
    if (isRoulette) return;
    if (hoverIndex !== -1) {
      hoverIndex = -1;
      drawForm();
    }
  }

  // ------------------------------------------------------
  // Exponer/arrancar menú
  // ------------------------------------------------------

  /**
   * startMenu
   * Expone el dibujado y registra listeners del menú en el canvas recibido.
   */
  window.startMenu = function (ctxExtern, canvasExtern) {
    drawForm();
    canvasExtern.removeEventListener('click', onCanvasClick);
    canvasExtern.addEventListener('click', onCanvasClick);
    canvasExtern.removeEventListener('mousemove', onCanvasMove);
    canvasExtern.removeEventListener('mouseleave', onCanvasLeave);
    canvasExtern.addEventListener('mousemove', onCanvasMove);
    canvasExtern.addEventListener('mouseleave', onCanvasLeave);
  };

  // ------------------------------------------------------
  // Dibujo de elementos individuales (controles y grilla)
  // ------------------------------------------------------

  /**
   * drawSubtitulo
   * Dibuja un subtítulo centrado dentro del panel (ej: “Dificultad”, “Rompecabezas”).
   */
  function drawSubtitulo(y, text) {
    ctx.fillStyle = '#0e0e0e';
    ctx.font = '700 18px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, panel.x + panel.w / 2, y);
  }

  /**
   * drawRoundedRect
   * Construye el path de un rectángulo redondeado (se usa junto a fill/stroke/clip).
   */
  function drawRoundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /**
   * drawButton
   * Dibuja un botón de dificultad (estados: seleccionado / normal).
   */
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

  /**
   * drawButtonJugar
   * Dibuja el botón primario “JUGAR”.
   */
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

  /**
   * drawTitleImage
   * Dibuja el logo/título “Blocka” ajustado al ancho del panel.
   */
  function drawTitleImage() {
    if (!imgTitulo || !imgTitulo.naturalWidth) return;
    const paddingX = 40, topPad = 40, maxH = 100;
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

  /**
   * drawThumbnailsGrid
   * Dibuja la grilla de miniaturas de rompecabezas (incluye el marco de selección y hover).
   */
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
        ctx.fillRect(x, y, tileH, tileH);
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

  /**
   * drawLinkInstrucciones
   * Dibuja el link “¿Cómo jugar?” sobre el botón “JUGAR” y guarda su rect para clics.
   */
  function drawLinkInstrucciones() {
    const label = '¿Cómo jugar?';
    const y = btnJugar.y - 28;
    const cx = panel.x + panel.w / 2;

    ctx.save();
    ctx.font = '600 16px Poppins, sans-serif';
    const textW = Math.ceil(ctx.measureText(label).width);
    const padX = 8, padY = 6;
    const rect = { x: Math.round(cx - textW / 2) - padX, y: y - padY, w: textW + padX * 2, h: 22 + padY * 2 };

    // texto
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, cx, y);

    // subrayado sutil
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - textW / 2, y + 18);
    ctx.lineTo(cx + textW / 2, y + 18);
    ctx.stroke();

    ctx.restore();
    linkInstruccionesRect = rect;
  }
}

// ------------------------------------------------------
// Export y bootstrap del menú
// ------------------------------------------------------

/**
 * loadMenu
 * Se expone globalmente para ser llamado desde otros paneles (volver al menú).
 */
window.loadMenu = loadMenu;

/**
 * DOMContentLoaded
 * Inicializa el menú cuando el DOM está listo.
 */
document.addEventListener('DOMContentLoaded', () => {
  loadMenu();
});

