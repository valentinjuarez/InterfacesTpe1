'use strict';

let started = false;
// Panel celestito igual al del preGameMenu
const panel = { x: 0, y: 0, w: 800, h: 680 };
function centerPanel(canvas) {
  panel.x = Math.round((canvas.width - panel.w) / 2);
  panel.y = Math.round((canvas.height - panel.h) / 2);
}

// Dibuja el panel semitransparente centrado
function drawPanel(ctx, canvas) {
  centerPanel(canvas);
  ctx.fillStyle = 'rgba(25, 99, 195, 0.85)';
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
}

// Calcula posición y tamaño "mediano" de la imagen dentro del panel
function computePlacement(img) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const maxW = panel.w * 0.5, maxH = panel.h * 0.5;
  const s = Math.min(maxW / iw, maxH / ih);
  const w = Math.round(iw * s), h = Math.round(ih * s);
  const dx = Math.round(panel.x + (panel.w - w) / 2);
  const dy = Math.round(panel.y + (panel.h - h) / 2);
  return { dx, dy, w, h };
}

// Dibuja la imagen con borde y alpha opcional
function drawImageWithBorder(ctx, img, place, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, place.dx, place.dy, place.w, place.h);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#4A1F85';
  ctx.strokeRect(place.dx, place.dy, place.w, place.h);
  ctx.restore();
}

// NUEVO: texto arriba-izquierda con nivel y dificultad
function drawTopLeftInfo(ctx, level, difficulty) {
  const pad = 24;
  const text = `Nivel ${level} - ${difficulty}`;
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.font = '600 16px Poppins, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(text, panel.x + pad, panel.y + pad);
  ctx.restore();
}

// NUEVO: dibuja iconos arriba derecha (mismo tamaño)
function drawTopRightIcons(ctx, canvas, homeImg, resetImg, size = 38) {
  const pad = 12, gap = 8;
  const y = panel.y + pad;
  const xHome = panel.x + panel.w - pad - size;
  const xReset = xHome - gap - size;
  const draw = () => {
    if (homeImg?.complete && homeImg.naturalWidth) ctx.drawImage(homeImg, xHome, y, size, size);
    if (resetImg?.complete && resetImg.naturalWidth) ctx.drawImage(resetImg, xReset, y, size, size);
  };
  if (!(homeImg?.complete && homeImg.naturalWidth)) homeImg.onload = draw;
  if (!(resetImg?.complete && resetImg.naturalWidth)) resetImg.onload = draw;
  draw();
}

// Fade-out suave de la imagen, dejando el panel
function fadeOutImage(ctx, canvas, img, place, duration = 700, homeImg, resetImg, level, difficulty) {
  const start = performance.now();
  function step(now) {
    const p = Math.min(1, (now - start) / duration);
    ctx.clearRect(panel.x, panel.y, panel.w, panel.h);
    drawPanel(ctx, canvas);
    drawTopLeftInfo(ctx, level, difficulty);
    if (p < 1) {
      drawImageWithBorder(ctx, img, place, 1 - p);
      requestAnimationFrame(step);
    } else {
      ctx.clearRect(panel.x, panel.y, panel.w, panel.h);
      drawPanel(ctx, canvas);
      drawTopLeftInfo(ctx, level, difficulty);
      drawTopRightIcons(ctx, canvas, homeImg, resetImg);
    }
  }
  requestAnimationFrame(step);
}

window.startGamePanel = function (canvas, ctx, config) {
  if (started) return;
  if (!canvas || !ctx) return; // no buscamos el canvas aquí
  started = true;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPanel(ctx, canvas);

  // NUEVO: nivel y dificultad
  const level = Number(config?.level) || 1;
  const difficulty = config?.difficulty || 'normal';
  drawTopLeftInfo(ctx, level, difficulty);

  // Precargar iconos
  const homeIcon = new Image(); homeIcon.src = 'assets/iconoHomeJuego.png';
  const resetIcon = new Image(); resetIcon.src = 'assets/iconoResetJuego.png';

  // Cargar y mostrar la imagen elegida ~mediana por 5s
  const src = config && config.image;
  if (!src) return;
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(panel.x, panel.y, panel.w, panel.h);
    drawPanel(ctx, canvas);
    drawTopLeftInfo(ctx, level, difficulty);
    const place = computePlacement(img);
    drawImageWithBorder(ctx, img, place, 1);
    setTimeout(() => fadeOutImage(ctx, canvas, img, place, 700, homeIcon, resetIcon, level, difficulty), 5000);
  };
  img.src = src;
};