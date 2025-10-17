'use strict';

// Carga assets del main y arranca el menú
function loadMain() {
  const canvas = document.getElementById('myCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // =========================
  // 1) CARGA DE IMÁGENES (PRIMERO)
  // =========================
  let imagesLoaded = 0;
  const ui = {
    selectedTime: 120,              // 2 min por defecto
    selectedDifficulty: 'normal',   // normal por defecto
    selectedPieces: 6,              // normal => 6 piezas
    imagesSrc: [
      'assets/rompecabezasDesierto.png',
      'assets/rompecabezasJungla.png',
      'assets/rompecabezasCiudad.png',
      'assets/rompecabezasNieve.png',
      'assets/rompecabezasMontaña.png',
      'assets/rompecabezasPlaya.png'
    ],
    images: [],
    imageIndex: 0
  };

  // Fondo principal
  const imgFondo = new Image();
  // Carrusel (preload)
  const totalToLoad = 1 + ui.imagesSrc.length; // 1 fondo + N imágenes del carrusel
  const checkImagesLoaded = () => {
    imagesLoaded++;
    if (imagesLoaded === totalToLoad) {
      iniciarMenu();
    }
  };
  imgFondo.addEventListener('load', checkImagesLoaded);
  imgFondo.addEventListener('error', (e) => { console.error('No se pudo cargar la imagen de fondo', e); checkImagesLoaded(); });
  imgFondo.src = 'assets/fondoIngame2.png';

  ui.images = ui.imagesSrc.map(src => {
    const im = new Image();
    im.addEventListener('load', checkImagesLoaded);
    im.addEventListener('error', (e) => { console.error('No se pudo cargar imagen del carrusel', src, e); checkImagesLoaded(); });
    im.src = src;
    return im;
  });

  // =========================
  // 2) iniciarMenu
  // =========================
  function iniciarMenu() {
    ctx.save();
    
    ctx.drawImage(imgFondo, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    if (typeof window.startMenu === 'function') {
      window.startMenu(ctx, canvas);
    } else {
      // Fallback visual simple
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

  // =========================
  // 3) drawForm (usa layout fijo actual)
  // =========================
  const panel = { x: 655, y: 112, w: 468, h: 580 };
  const timeButtons = [
    { x: panel.x + 35,  y: panel.y + 70,  w: 120, h: 40, label: '2 min', value: 120, group: 'time' },
    { x: panel.x + 175, y: panel.y + 70,  w: 120, h: 40, label: '3 min', value: 180, group: 'time' },
    { x: panel.x + 315, y: panel.y + 70,  w: 120, h: 40, label: '5 min', value: 300, group: 'time' },
  ];
  const diffButtons = [
    { x: panel.x + 35,  y: panel.y + 190, w: 120, h: 40, label: 'Fácil',   value: 'facil',   group: 'diff' },
    { x: panel.x + 175, y: panel.y + 190, w: 120, h: 40, label: 'Normal',  value: 'normal',  group: 'diff' },
    { x: panel.x + 315, y: panel.y + 190, w: 120, h: 40, label: 'Difícil', value: 'dificil', group: 'diff' },
  ];
  const carousel = {
    frame: { x: panel.x + 94, y: panel.y + 310, w: 280, h: 180 },
    prev:  { x: panel.x + 35, y: panel.y + 380, w: 40,  h: 40,  role: 'prev' },
    next:  { x: panel.x + 395, y: panel.y + 380, w: 40,  h: 40, role: 'next' },
  };
  const btnJugar = { x: panel.x + 134, y: panel.y + 510, w: 200, h: 46, label: 'JUGAR' };

  function drawForm() {
    ctx.save();

    // Restituir fondo en el área del panel para que la transparencia muestre el fondo del juego
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.beginPath();
    ctx.rect(panel.x, panel.y, panel.w, panel.h);
    ctx.clip();
    ctx.drawImage(imgFondo, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Panel semitransparente
    ctx.fillStyle = 'rgba(25, 99, 195, 0.85)';
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);

    let posy = panel.y + 45;
    drawSubtitulo(posy, 'Tiempo de partida');
    drawSubtitulo(posy += 120, 'Dificultad');
    drawSubtitulo(posy += 120, 'Rompecabezas');

    timeButtons.forEach(b => drawButton(b, ui.selectedTime === b.value));
    diffButtons.forEach(b => drawButton(b, ui.selectedDifficulty === b.value));
    drawCarousel();
    drawButtonJugar();

    ctx.restore();
  }

  // =========================
  // 4) PRIMITIVAS Y ESTILOS DE DIBUJO
  // =========================
  function drawSubtitulo(y, text) {
    ctx.fillStyle = '#0e0e0e';
    ctx.font = '700 18px Poppins, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(text, panel.x + 40, y);
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
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '700 18px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btnJugar.label, btnJugar.x + btnJugar.w / 2, btnJugar.y + btnJugar.h / 2);
    ctx.restore();
  }

  // =========================
  // 5) RESTO (carrusel, utilidades, eventos)
  // =========================
  function drawCarousel() {
    ctx.save();

    const { frame, prev, next } = carousel;
    const marcoX = frame.x, marcoY = frame.y, marcoAncho = frame.w, marcoAlto = frame.h;

    // Clip redondeado
    drawRoundedRect(marcoX, marcoY, marcoAncho, marcoAlto, 12);
    ctx.clip();

    // Imagen en modo cover
    const imagenActual = ui.images[ui.imageIndex];
    if (imagenActual && imagenActual.complete && imagenActual.naturalWidth) {
      const iw = imagenActual.naturalWidth;
      const ih = imagenActual.naturalHeight;
      const fw = marcoAncho, fh = marcoAlto;

      const scale = Math.max(fw / iw, fh / ih);
      const sw = Math.round(fw / scale);
      const sh = Math.round(fh / scale);
      const sx = Math.round((iw - sw) / 2);
      const sy = Math.round((ih - sh) / 2);

      ctx.drawImage(imagenActual, sx, sy, sw, sh, marcoX, marcoY, fw, fh);
    } else {
      ctx.fillStyle = '#ccc';
      ctx.fillRect(marcoX, marcoY, marcoAncho, marcoAlto);
    }

    // Borde del marco
    ctx.restore();
    drawRoundedRect(marcoX, marcoY, marcoAncho, marcoAlto, 12);
    ctx.strokeStyle = '#C5C2C2';
    ctx.stroke();

    // Flechas (rectangulares redondeadas actuales)
    drawRoundedRect(prev.x, prev.y, prev.w, prev.h, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#C5C2C2';
    ctx.stroke();
    ctx.fillStyle = '#1F1D1D';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('<', prev.x + prev.w / 2, prev.y + prev.h / 2);

    drawRoundedRect(next.x, next.y, next.w, next.h, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#C5C2C2';
    ctx.stroke();
    ctx.fillStyle = '#1F1D1D';
    ctx.fillText('>', next.x + next.w / 2, next.y + next.h / 2);
  }

  function piecesFromDifficulty(d) {
    if (d === 'facil') return 4;
    if (d === 'dificil') return 8;
    return 6; // normal
  }

  function pointInRect(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  function onCanvasClick(ev) {
    const rect = canvas.getBoundingClientRect();
    const mx = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const my = (ev.clientY - rect.top) * (canvas.height / rect.height);

    for (const b of timeButtons) {
      if (pointInRect(mx, my, b)) { ui.selectedTime = b.value; drawForm(); return; }
    }
    for (const b of diffButtons) {
      if (pointInRect(mx, my, b)) { ui.selectedDifficulty = b.value; ui.selectedPieces = piecesFromDifficulty(b.value); drawForm(); return; }
    }
    if (pointInRect(mx, my, carousel.prev)) { ui.imageIndex = (ui.imageIndex - 1 + ui.imagesSrc.length) % ui.imagesSrc.length; drawForm(); return; }
    if (pointInRect(mx, my, carousel.next)) { ui.imageIndex = (ui.imageIndex + 1) % ui.imagesSrc.length; drawForm(); return; }

    if (pointInRect(mx, my, btnJugar)) {
      console.log('Iniciar juego con:', {
        time: ui.selectedTime,
        difficulty: ui.selectedDifficulty,
        pieces: ui.selectedPieces,
        image: ui.imagesSrc[ui.imageIndex],
      });
      // TODO: beginGame(ui)
      return;
    }
  }

  // Exponer startMenu y montar interacción
  window.startMenu = function (ctxExtern, canvasExtern) {
    drawForm();
    canvasExtern.removeEventListener('click', onCanvasClick);
    canvasExtern.addEventListener('click', onCanvasClick);
  };
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', loadMain);
