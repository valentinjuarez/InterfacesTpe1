'use strict';

// Estado global y constantes
let iniciado = false;
const panel = { x: 0, y: 0, w: 800, h: 680 };
let estadoPuzzle = null;

// Utilidades generales
function normalizarTexto(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function obtenerFiltroPorNivel(nivel) {
  if (nivel === 1) return 'grayscale(100%)';
  if (nivel === 2) return 'brightness(30%)';
  if (nivel === 3) return 'invert(100%)';
  return 'none';
}
function determinarDimensionesGrilla(dificultad) {
  const d = normalizarTexto(dificultad);
  if (d.startsWith('fac')) return { cols: 2, rows: 2 }; // 4 piezas
  if (d.startsWith('dif')) return { cols: 4, rows: 2 }; // 8 piezas
  return { cols: 3, rows: 2 }; // 6 piezas
}
function obtenerPosMouse(canvas, ev) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (ev.clientX - r.left) * (canvas.width / r.width),
    y: (ev.clientY - r.top) * (canvas.height / r.height)
  };
}
function puntoEnRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// Layout base del panel
function centrarPanel(canvas) {
  panel.x = Math.round((canvas.width - panel.w) / 2);
  panel.y = Math.round((canvas.height - panel.h) / 2);
}
function dibujarPanel(ctx, canvas) {
  centrarPanel(canvas);
  ctx.fillStyle = 'rgba(25, 99, 195, 0.85)';
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
}
function dibujarInfoSuperiorIzquierda(ctx, nivel, dificultad) {
  const pad = 24;
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.font = '600 16px Poppins, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`Nivel ${nivel} - ${dificultad}`, panel.x + pad, panel.y + pad);
  ctx.restore();
}
function dibujarIconosSuperiorDerecha(ctx, iconoHome, iconoReset, tam = 38) {
  const pad = 12, gap = 8;
  const y = panel.y + pad;
  const xHome = panel.x + panel.w - pad - tam;
  const xReset = xHome - gap - tam;
  const dibujar = () => {
    if (iconoHome?.complete && iconoHome.naturalWidth) ctx.drawImage(iconoHome, xHome, y, tam, tam);
    if (iconoReset?.complete && iconoReset.naturalWidth) ctx.drawImage(iconoReset, xReset, y, tam, tam);
  };
  if (!(iconoHome?.complete && iconoHome.naturalWidth)) iconoHome.onload = dibujar;
  if (!(iconoReset?.complete && iconoReset.naturalWidth)) iconoReset.onload = dibujar;
  dibujar();
}
function calcularPosicionImagen(imagen) {
  const iw = imagen.naturalWidth, ih = imagen.naturalHeight;
  const maxW = panel.w * 0.5, maxH = panel.h * 0.5;
  const s = Math.min(maxW / iw, maxH / ih);
  const w = Math.round(iw * s), h = Math.round(ih * s);
  const dx = Math.round(panel.x + (panel.w - w) / 2);
  const dy = Math.round(panel.y + (panel.h - h) / 2);
  return { dx, dy, w, h };
}
function dibujarImagenConBorde(ctx, imagen, pos, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(imagen, pos.dx, pos.dy, pos.w, pos.h);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#4A1F85';
  ctx.strokeRect(pos.dx, pos.dy, pos.w, pos.h);
  ctx.restore();
}

// Dibujo de grilla (con filtro por nivel y piezas rotadas)
function dibujarImagenEnGrilla(ctx, imagen, pos, cols, rows, rotaciones, nivel) {
  const separacion = 4;
  const iw = imagen.naturalWidth, ih = imagen.naturalHeight;
  const anchoCelda = (pos.w - (cols - 1) * separacion) / cols;
  const altoCelda = (pos.h - (rows - 1) * separacion) / rows;

  ctx.save();
  ctx.filter = obtenerFiltroPorNivel(nivel);
  ctx.beginPath();
  ctx.rect(Math.round(pos.dx), Math.round(pos.dy), Math.round(pos.w), Math.round(pos.h));
  ctx.clip();

  let idx = 0;
  for (let fila = 0; fila < rows; fila++) {
    for (let col = 0; col < cols; col++, idx++) {
      const sx0 = Math.floor(col * iw / cols);
      const sx1 = Math.floor((col + 1) * iw / cols);
      const sy0 = Math.floor(fila * ih / rows);
      const sy1 = Math.floor((fila + 1) * ih / rows);
      const sw = sx1 - sx0, sh = sy1 - sy0;

      const dx = pos.dx + col * (anchoCelda + separacion);
      const dy = pos.dy + fila * (altoCelda + separacion);
      const cx = Math.round(dx + anchoCelda / 2);
      const cy = Math.round(dy + altoCelda / 2);

      const k = rotaciones ? (rotaciones[idx] % 4 + 4) % 4 : Math.floor(Math.random() * 4);
      const ang = k * Math.PI / 2;
      const destW = Math.round((k % 2) ? altoCelda : anchoCelda);
      const destH = Math.round((k % 2) ? anchoCelda : altoCelda);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang);
      ctx.drawImage(imagen, sx0, sy0, sw, sh, Math.round(-destW / 2), Math.round(-destH / 2), destW, destH);
      ctx.restore();
    }
  }
  ctx.restore();
}

// Temporizador (nivel 3)
function iniciarTimerNivel3() {
  if (!estadoPuzzle || estadoPuzzle.nivel !== 3 || estadoPuzzle.timerId) return;
  estadoPuzzle.tiempoRestante = 120;
  estadoPuzzle.timerId = setInterval(() => {
    if (!estadoPuzzle || estadoPuzzle.completado) {
      clearInterval(estadoPuzzle?.timerId);
      if (estadoPuzzle) estadoPuzzle.timerId = null;
      return;
    }
    estadoPuzzle.tiempoRestante = Math.max(0, (estadoPuzzle.tiempoRestante || 0) - 1);
    redibujarPuzzle();
  }, 1000);
}
function dibujarTimerSuperior(ctx) {
  if (!estadoPuzzle || estadoPuzzle.nivel !== 3) return;
  const s = Math.max(0, estadoPuzzle.tiempoRestante ?? 120);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.font = '700 20px Poppins, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`${mm}:${ss}`, panel.x + panel.w / 2, panel.y + 12);
  ctx.restore();
}

// Interacción y render del puzzle
function redibujarPuzzle() {
  const { ctx, canvas, nivel, dificultad, imagen, pos, cols, rows, rotaciones, iconoHome, iconoReset } = estadoPuzzle;
  ctx.clearRect(panel.x, panel.y, panel.w, panel.h);
  dibujarPanel(ctx, canvas);
  dibujarInfoSuperiorIzquierda(ctx, nivel, dificultad);
  dibujarImagenEnGrilla(ctx, imagen, pos, cols, rows, rotaciones, nivel);
  dibujarIconosSuperiorDerecha(ctx, iconoHome, iconoReset);
  if (nivel === 3) {
    dibujarTimerSuperior(ctx);
    iniciarTimerNivel3();
  }
}
function girarPieza(x, y, dir) {
  if (!estadoPuzzle || estadoPuzzle.completado) return;
  const { pos, cols, rows, rotaciones } = estadoPuzzle;
  const sep = 4;
  const tw = (pos.w - (cols - 1) * sep) / cols;
  const th = (pos.h - (rows - 1) * sep) / rows;

  if (x < pos.dx || y < pos.dy || x > pos.dx + pos.w || y > pos.dy + pos.h) return;
  const lx = x - pos.dx, ly = y - pos.dy;
  const c = Math.floor(lx / (tw + sep));
  const f = Math.floor(ly / (th + sep));
  if (c < 0 || c >= cols || f < 0 || f >= rows) return;
  const offx = lx - c * (tw + sep), offy = ly - f * (th + sep);
  if (offx > tw || offy > th) return;

  const idx = f * cols + c;
  rotaciones[idx] = ((rotaciones[idx] + dir) % 4 + 4) % 4;
  redibujarPuzzle();
  verificarPuzzleCorrecto();
}

// Verificación y botones
function esPuzzleCorrecto(rotaciones) {
  return rotaciones.every(v => (((v % 4) + 4) % 4) === 0);
}
function drawRoundedRect(ctx, x, y, w, h, r = 12) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function dibujarBotonSiguiente(ctx, rect) {
  drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fillStyle = '#7C3AED';
  ctx.fill();
  ctx.strokeStyle = '#4A1F85';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = '700 18px Poppins, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Siguiente nivel', rect.x + rect.w / 2, rect.y + rect.h / 2);
}
function mostrarPuzzleCorrecto() {
  const { ctx, canvas, nivel, dificultad, imagen, pos, iconoHome, iconoReset } = estadoPuzzle;
  if (estadoPuzzle.timerId) { clearInterval(estadoPuzzle.timerId); estadoPuzzle.timerId = null; }
  ctx.clearRect(panel.x, panel.y, panel.w, panel.h);
  dibujarPanel(ctx, canvas);
  dibujarInfoSuperiorIzquierda(ctx, nivel, dificultad);
  ctx.filter = 'none';
  ctx.drawImage(imagen, pos.dx, pos.dy, pos.w, pos.h);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#22C55E';
  ctx.strokeRect(pos.dx, pos.dy, pos.w, pos.h);
  dibujarIconosSuperiorDerecha(ctx, iconoHome, iconoReset);

  if (nivel < 3) {
    const bw = 200, bh = 46;
    const bx = Math.round(panel.x + (panel.w - bw) / 2);
    const by = Math.min(Math.round(pos.dy + pos.h + 20), panel.y + panel.h - bh - 12);
    estadoPuzzle.botonSiguiente = { x: bx, y: by, w: bw, h: bh };
    dibujarBotonSiguiente(ctx, estadoPuzzle.botonSiguiente);
  } else {
    estadoPuzzle.botonSiguiente = null;
  }
  estadoPuzzle.completado = true;
}
function verificarPuzzleCorrecto() {
  if (!estadoPuzzle || estadoPuzzle.completado) return;
  if (esPuzzleCorrecto(estadoPuzzle.rotaciones)) {
    mostrarPuzzleCorrecto();
  }
}
function avanzarNivel() {
  const { cols, rows } = estadoPuzzle;
  if (estadoPuzzle.timerId) { clearInterval(estadoPuzzle.timerId); estadoPuzzle.timerId = null; }
  estadoPuzzle.nivel = Math.min(3, (estadoPuzzle.nivel || 1) + 1);
  estadoPuzzle.rotaciones = Array.from({ length: cols * rows }, () => Math.floor(Math.random() * 4));
  estadoPuzzle.completado = false;
  estadoPuzzle.botonSiguiente = null;
  redibujarPuzzle();
}

// Transición desde imagen completa a la grilla (tras 5s)
function desvanecerImagen(ctx, canvas, imagen, pos, duracion, iconoHome, iconoReset, nivel, dificultad, cols, rows) {
  // No se usa fade animado: una vez que pasan 5s, entra directamente al estado del puzzle
  const rotaciones = Array.from({ length: cols * rows }, () => Math.floor(Math.random() * 4));
  estadoPuzzle = {
    ctx, canvas, imagen, pos,
    cols, rows, rotaciones,
    nivel, dificultad,
    iconoHome, iconoReset,
    completado: false,
    botonSiguiente: null,
    timerId: null,
    tiempoRestante: undefined
  };
  redibujarPuzzle();

  // Listeners de interacción (una sola vez)
  if (!canvas.__rotHandlers) {
    canvas.addEventListener('click', (ev) => {
      const { x, y } = obtenerPosMouse(canvas, ev);
      if (estadoPuzzle?.completado && estadoPuzzle.botonSiguiente && puntoEnRect(x, y, estadoPuzzle.botonSiguiente)) {
        avanzarNivel();
        return;
      }
      girarPieza(x, y, -1);
    });
    canvas.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      const { x, y } = obtenerPosMouse(canvas, ev);
      girarPieza(x, y, +1);
    });
    canvas.__rotHandlers = true;
  }
}

// Arranque público
window.startGamePanel = function (canvas, ctx, config) {
  if (iniciado || !canvas || !ctx) return;
  iniciado = true;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dibujarPanel(ctx, canvas);

  const nivel = Number(config?.level) || 1;
  const dificultad = config?.difficulty || 'normal';
  const { cols, rows } = determinarDimensionesGrilla(dificultad);
  dibujarInfoSuperiorIzquierda(ctx, nivel, dificultad);

  const iconoHome = new Image(); iconoHome.src = 'assets/iconoHomeJuego.png';
  const iconoReset = new Image(); iconoReset.src = 'assets/iconoResetJuego.png';

  const ruta = config?.image;
  if (!ruta) return;
  const imagen = new Image();
  imagen.onload = () => {
    ctx.clearRect(panel.x, panel.y, panel.w, panel.h);
    dibujarPanel(ctx, canvas);
    dibujarInfoSuperiorIzquierda(ctx, nivel, dificultad);
    const pos = calcularPosicionImagen(imagen);
    dibujarImagenConBorde(ctx, imagen, pos, 1);
    setTimeout(() => desvanecerImagen(ctx, canvas, imagen, pos, 700, iconoHome, iconoReset, nivel, dificultad, cols, rows), 5000);
  };
  imagen.src = ruta;
};