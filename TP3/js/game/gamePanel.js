'use strict';



// ========= Estado global y constantes =========
let iniciado = false;
const panel = { x: 0, y: 0, w: 800, h: 680 };
let estadoPuzzle = null;
let rafTimerBarra = null;
// NUEVO: icono de ayuda global
let iconoAyudita = null;

/** Constantes de UI y juego (reutilizables) */
const COLORS = {
  panelBg: 'rgba(25, 99, 195, 0.85)',
  btnPrimary: '#7C3AED',
  btnPrimaryStroke: '#4A1F85',
  successStroke: '#22C55E',
  overlayStroke: '#e81111ff',
  badgeBg: 'rgba(0,0,0,0.55)',
  text: '#fff'
};
const FONT = {
  bold18: '700 18px Poppins, sans-serif',
  bold24: '700 24px Poppins, sans-serif',
  semibold16: '600 16px Poppins, sans-serif'
};
const ICON = { pad: 12, gap: 8, size: 38 };
const GRID_GAP = 4;
const TIMER_LVL3_SECONDS = 6;

// ========= Utilidades básicas (texto, filtros, grilla, coords) =========

/** Normaliza texto a minúsculas y sin acentos. */
function normalizarTexto(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Devuelve el filtro de Canvas según el nivel actual (1=gris, 2=oscuro, 3=invertido). */
function obtenerFiltroPorNivel(nivel) {
  if (nivel === 1) return 'grayscale(100%)';
  if (nivel === 2) return 'brightness(30%)';
  if (nivel === 3) return 'invert(100%)';
  return 'none';
}

/** Determina columnas/filas de la grilla según dificultad (fácil/normal/difícil). */
function determinarDimensionesGrilla(dificultad) {
  const d = normalizarTexto(dificultad);
  if (d.startsWith('fac')) return { cols: 2, rows: 2 }; // 4 piezas
  if (d.startsWith('dif')) return { cols: 4, rows: 2 }; // 8 piezas
  return { cols: 3, rows: 2 }; // 6 piezas
}

/** Convierte coordenadas del mouse a coordenadas del canvas (corrige escala). */
function obtenerPosMouse(canvas, ev) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (ev.clientX - r.left) * (canvas.width / r.width),
    y: (ev.clientY - r.top) * (canvas.height / r.height)
  };
}

/** Verifica si un punto (x,y) está dentro de un rect {x,y,w,h}. */
function puntoEnRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// ========= Layout del panel =========

/** Centra el panel en el canvas. */
function centrarPanel(canvas) {
  panel.x = Math.round((canvas.width - panel.w) / 2);
  panel.y = Math.round((canvas.height - panel.h) / 2);
}

/** Dibuja el panel de fondo (semisólido) centrado. */
function dibujarPanel(ctx, canvas) {
  centrarPanel(canvas);
  ctx.fillStyle = COLORS.panelBg;
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
}

// ========= UI superior (texto + iconos) =========

/** Escribe "Nivel X - dificultad" en la esquina superior izquierda. */
function dibujarInfoSuperiorIzquierda(ctx, nivel, dificultad) {
  const padding = 24;
  ctx.save();
  ctx.fillStyle = COLORS.text;
  ctx.font = FONT.semibold16;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`Nivel ${nivel} - ${dificultad}`, panel.x + padding, panel.y + padding);
  ctx.restore();
}

/** Dibuja íconos Home/Reset en la esquina superior derecha y guarda rects clickeables. */
function dibujarIconosSuperiorDerecha(ctx, iconoHome, iconoReset, tam = ICON.size) {
  const pad = ICON.pad, gap = ICON.gap;
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
  if (estadoPuzzle) {
    estadoPuzzle.rectHome = { x: xHome, y, w: tam, h: tam };
    estadoPuzzle.rectReset = { x: xReset, y, w: tam, h: tam };
  }
}

/** Dibuja la barra superior unificada (texto izquierda + iconos derecha). */
function dibujarBarraSuperior(ctx, nivel, dificultad, iconoHome, iconoReset) {
  dibujarInfoSuperiorIzquierda(ctx, nivel, dificultad);
  dibujarIconosSuperiorDerecha(ctx, iconoHome, iconoReset);
}

// ========= Imagen y grilla =========

/** Calcula posición y tamaño de la imagen dentro del panel respetando aspect ratio. */
function calcularPosicionImagen(imagen) {
  const iw = imagen.naturalWidth, ih = imagen.naturalHeight;
  const maxW = panel.w * 0.8, maxH = panel.h * 0.8;
  const s = Math.min(maxW / iw, maxH / ih);
  const w = Math.round(iw * s), h = Math.round(ih * s);
  const dx = Math.round(panel.x + (panel.w - w) / 2);
  const dy = Math.round(panel.y + (panel.h - h) / 2);
  return { dx, dy, w, h };
}

/** Dibuja la imagen con borde y alpha (para transición). */
function dibujarImagenConBorde(ctx, imagen, pos, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(imagen, pos.dx, pos.dy, pos.w, pos.h);
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.btnPrimaryStroke;
  ctx.strokeRect(pos.dx, pos.dy, pos.w, pos.h);
  ctx.restore();
}

/** Dibuja la imagen en una grilla con separaciones, rotaciones y filtro por nivel. */
function dibujarImagenEnGrilla(ctx, imagen, pos, cols, rows, rotaciones, nivel) {
  const separacion = GRID_GAP;
  const iw = imagen.naturalWidth, ih = imagen.naturalHeight;
  const anchoCelda = (pos.w - (cols - 1) * separacion) / cols;
  const altoCelda = (pos.h - (rows - 1) * separacion) / rows;

  ctx.save();
  ctx.filter = obtenerFiltroPorNivel(nivel);
  ctx.beginPath();
  ctx.rect(Math.round(pos.dx), Math.round(pos.dy), Math.round(pos.w), Math.round(pos.h));//rectángulo de recorte
  ctx.clip();

  let idx = 0;
  for (let fila = 0; fila < rows; fila++) {
    for (let col = 0; col < cols; col++, idx++) {
      //parte de la imagen recortar
      const sx0 = Math.floor(col * iw / cols);
      const sx1 = Math.floor((col + 1) * iw / cols);
      const sy0 = Math.floor(fila * ih / rows);
      const sy1 = Math.floor((fila + 1) * ih / rows);
      const sw = sx1 - sx0, sh = sy1 - sy0;
      //posición destino en el canvas
      const dx = pos.dx + col * (anchoCelda + separacion);
      const dy = pos.dy + fila * (altoCelda + separacion);
      const cx = Math.round(dx + anchoCelda / 2);
      const cy = Math.round(dy + altoCelda / 2);

      const k = rotaciones ? (rotaciones[idx] % 4 + 4) % 4 : Math.floor(Math.random() * 4);
      const ang = k * Math.PI / 2;//convierte el numero a radiales
      const destW = Math.round((k % 2) ? altoCelda : anchoCelda);
      const destH = Math.round((k % 2) ? anchoCelda : altoCelda);

      ctx.save();
      if (estadoPuzzle?.piezasBloqueadas?.has(idx)) ctx.filter = 'none';
      ctx.translate(cx, cy);
      ctx.rotate(ang);
      ctx.drawImage(imagen, sx0, sy0, sw, sh, Math.round(-destW / 2), Math.round(-destH / 2), destW, destH);
      ctx.restore();
    }
  }
  ctx.restore();
}

// ========= Timers y badges =========

/** Inicia el temporizador de nivel 3 (cuenta regresiva + overlay al llegar a 0). */
function iniciarTimerNivel3() {
  if (!estadoPuzzle || estadoPuzzle.nivel !== 3 || estadoPuzzle.timerId) return;
  estadoPuzzle.tiempoRestante = TIMER_LVL3_SECONDS;
  estadoPuzzle.timerId = setInterval(() => {
    if (!estadoPuzzle || estadoPuzzle.completado) {
      clearInterval(estadoPuzzle?.timerId);
      if (estadoPuzzle) estadoPuzzle.timerId = null;
      return;
    }
    estadoPuzzle.tiempoRestante = Math.max(0, (estadoPuzzle.tiempoRestante || 0) - 1);
    if (estadoPuzzle.tiempoRestante === 0) {
      clearInterval(estadoPuzzle.timerId);
      estadoPuzzle.timerId = null;
      estadoPuzzle.timeUp = true;
      // Dibuja el overlay de tiempo agotado
      mostrarTiempoAgotado();
      return;
    }
    redibujarPuzzle();
  }, 1000);
}

/** Dibuja un badge unificado (posición/estilo) para cualquier timer. */
function dibujarTimerBadge(ctx, txt) {
  const cx = panel.x + panel.w / 2;
  const y = panel.y + 16;
  ctx.save();
  ctx.font = FONT.bold18;
  const w = Math.max(64, Math.ceil(ctx.measureText(txt).width) + 16);
  const h = 28;
  drawRoundedRect(ctx, Math.round(cx - w / 2), y, w, h, 8);
  ctx.fillStyle = COLORS.badgeBg;
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, cx, y + h / 2);
  ctx.restore();
}

/** Dibuja el icono de ayuda centrado debajo de la imagen y guarda su rect. */
function dibujarIconoAyudita(ctx, pos, tam = 60) {
  if (!iconoAyudita) return;
  const x = Math.round(panel.x + (panel.w - tam) / 2);
  const y = Math.round(pos.dy + pos.h + 10);
  if (iconoAyudita.complete && iconoAyudita.naturalWidth) {
    ctx.drawImage(iconoAyudita, x, y, tam, tam);
    // Guarda rect clickeable para el handler
    if (estadoPuzzle) estadoPuzzle.rectAyudita = { x, y, w: tam, h: tam };
  }
}

/** Dibuja el timer superior (nivel 3): muestra tiempo restante. */
function dibujarTimerSuperior(ctx) {
  if (!estadoPuzzle || estadoPuzzle.nivel !== 3) return;
  const s = Math.max(0, estadoPuzzle.tiempoRestante ?? TIMER_LVL3_SECONDS);
  const ms = s * 1000;
  dibujarTimerBadge(ctx, formatearTiempo(ms));
}

/** Dibuja contador inicial (5s) y luego cronómetro con penalización acumululada. */
function dibujarTimerInicioBarra(ctx, ms) {
  const t0 = performance.now();
  function paso(t) {
    if (estadoPuzzle?.completado) {
      if (rafTimerBarra) cancelAnimationFrame(rafTimerBarra);
      rafTimerBarra = null;
      return;
    }
    const dt = t - t0;
    const restante = Math.max(0, ms - dt);
    // Penalización (suma) solo en fase ascendente
    const extra = (restante > 0) ? 0 : (estadoPuzzle?.penalizacionMs || 0);
    const msToDraw = restante > 0 ? restante : (dt - ms + extra);
    dibujarTimerBadge(ctx, formatearTiempo(msToDraw));
    rafTimerBarra = requestAnimationFrame(paso);
  }
  rafTimerBarra = requestAnimationFrame(paso);
}

// ========= Renderizado principal =========

/**
 * Redibuja toda la escena (panel, grilla, barra, iconos, ayudita, timers).
 * Punto central del ciclo de dibujo.
 */
function redibujarPuzzle() {
  const { ctx, canvas, nivel, dificultad, imagen, pos, cols, rows, rotaciones, iconoHome, iconoReset } = estadoPuzzle;
  ctx.clearRect(panel.x, panel.y, panel.w, panel.h);
  dibujarPanel(ctx, canvas);
  // Dibujo contenido y luego barra superior para que quede por encima
  dibujarImagenEnGrilla(ctx, imagen, pos, cols, rows, rotaciones, nivel);
  dibujarBarraSuperior(ctx, nivel, dificultad, iconoHome, iconoReset);
  // NUEVO: icono ayudita centrado abajo
  dibujarIconoAyudita(ctx, pos);
  if (nivel === 3) {
    if (rafTimerBarra) { cancelAnimationFrame(rafTimerBarra); rafTimerBarra = null; }
    dibujarTimerSuperior(ctx);
    iniciarTimerNivel3();
    if (estadoPuzzle.timeUp) mostrarTiempoAgotado();
  }
}

// ========= Interacciones y ayuda =========

/**
 * Aplica "ayudita": corrige una pieza aleatoria, la bloquea y penaliza el tiempo.
 * - Nivel 3: resta 5s del tiempo restante.
 * - Niveles 1-2: suma 5s de penalización al cronómetro ascendente.
 */
function aplicarAyuda() {
  if (!estadoPuzzle || estadoPuzzle.completado || estadoPuzzle.timeUp) return;
  const { rotaciones, nivel } = estadoPuzzle;
  const incorrectos = [];
  for (let i = 0; i < rotaciones.length; i++) {
    if ((((rotaciones[i] % 4) + 4) % 4) !== 0) incorrectos.push(i);
  }
  if (incorrectos.length === 0) return;
  const idx = incorrectos[Math.floor(Math.random() * incorrectos.length)];
  rotaciones[idx] = 0;
  if (!estadoPuzzle.piezasBloqueadas) estadoPuzzle.piezasBloqueadas = new Set();
  estadoPuzzle.piezasBloqueadas.add(idx);
  if (nivel === 3) {
    estadoPuzzle.tiempoRestante = Math.max(0, (estadoPuzzle.tiempoRestante || 0) - 5);
  } else {
    estadoPuzzle.penalizacionMs = (estadoPuzzle.penalizacionMs || 0) + 5000;
  }
  redibujarPuzzle();
  verificarPuzzleCorrecto();
}

/**
 * Rota una pieza (dir: -1 izq / +1 der) si no está bloqueada, y verifica el puzzle.
 * Calcula celda por coordenada de click y respeta separaciones de la grilla.
 */
function girarPieza(x, y, dir) {
  if (!estadoPuzzle || estadoPuzzle.completado || estadoPuzzle.timeUp) return;
  const { pos, cols, rows, rotaciones } = estadoPuzzle;
  const sep = GRID_GAP;
  const tw = (pos.w - (cols - 1) * sep) / cols;
  const th = (pos.h - (rows - 1) * sep) / rows;

  if (x < pos.dx || y < pos.dy || x > pos.dx + pos.w || y > pos.dy + pos.h) return;
  const lx = x - pos.dx, ly = y - pos.dy;
  const c = Math.floor(lx / (tw + sep));
  const f = Math.floor(ly / (th + sep));
  if (c < 0 || c >= cols || f < 0 || f >= rows) return;//valida que la celda exista
  const offx = lx - c * (tw + sep), offy = ly - f * (th + sep);
  if (offx > tw || offy > th) return;

  const idx = f * cols + c;
  if (estadoPuzzle.piezasBloqueadas && estadoPuzzle.piezasBloqueadas.has(idx)) return;
  rotaciones[idx] = ((rotaciones[idx] + dir) % 4 + 4) % 4;
  redibujarPuzzle();
  verificarPuzzleCorrecto();
}

/** Retorna true si todas las rotaciones son 0 (orientación correcta). */
function esPuzzleCorrecto(rotaciones) {
  return rotaciones.every(v => (((v % 4) + 4) % 4) === 0);
}

// ========= Primitivas de UI =========

/** Dibuja un rectángulo redondeado (path para fill/stroke). */
function drawRoundedRect(ctx, x, y, w, h, r = 12) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Botón violeta reutilizable con label centrado. */
function dibujarBotonVioleta(ctx, rect, label) {
  drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fillStyle = COLORS.btnPrimary;
  ctx.fill();
  ctx.strokeStyle = COLORS.btnPrimaryStroke;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = FONT.bold18;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2);
}

/** Botón específico “Siguiente nivel”. */
function dibujarBotonSiguiente(ctx, rect) {
  dibujarBotonVioleta(ctx, rect, 'Siguiente nivel');
}

// ========= Mensajes y overlays =========

/** Formatea milisegundos a "mm:ss". */
function formatearTiempo(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Muestra tiempo de completado y botón debajo; devuelve rect del botón. */
function dibujarTiempoCompletadoYBoton(ctx, pos, elapsedMs) {
  const texto = `Nivel completado en: ${formatearTiempo(elapsedMs)}`;
  const bw = 200, bh = 46;
  const lineH = 22, marginTop = 16, gap = 10;

  // Posición centrada del texto: debajo de la imagen y garantizando espacio para el botón
  let textY = pos.dy + pos.h + marginTop;
  const maxBy = panel.y + panel.h - bh - 12; // botón dentro del panel
  textY = Math.min(textY, maxBy - (lineH + gap)); // asegura que el botón no se salga

  const cx = panel.x + panel.w / 2;
  ctx.save();
  ctx.fillStyle = COLORS.text;
  ctx.font = FONT.bold18;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(texto, cx, textY);
  ctx.restore();

  // Botón debajo del texto
  const bx = Math.round(panel.x + (panel.w - bw) / 2);
  const by = Math.round(textY + lineH + gap);
  const rect = { x: bx, y: by, w: bw, h: bh };
  dibujarBotonSiguiente(ctx, rect);
  return rect;
}

/** Mensaje final y botón “Volver al menú”; devuelve rect del botón. */
function dibujarFelicitacionesYBotonVolver(ctx, pos) {
  const texto = '¡Felicitaciones! Completaste el juego';
  const bw = 200, bh = 46;
  const lineH = 22, marginTop = 16, gap = 10;

  let textY = pos.dy + pos.h + marginTop;
  const maxBy = panel.y + panel.h - bh - 12;
  textY = Math.min(textY, maxBy - (lineH + gap));

  const cx = panel.x + panel.w / 2;
  ctx.save();
  ctx.fillStyle = COLORS.text;
  ctx.font = FONT.bold18;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(texto, cx, textY);
  ctx.restore();

  const bx = Math.round(panel.x + (panel.w - bw) / 2);
  const by = Math.round(textY + lineH + gap);
  const rect = { x: bx, y: by, w: bw, h: bh };
  dibujarBotonVioleta(ctx, rect, 'Volver al menú');
  return rect;
}

/** Overlay de “Se terminó el tiempo” + botón “Reintentar”. Guarda rect. */
function mostrarTiempoAgotado() {
  if (!estadoPuzzle) return;
  const { ctx } = estadoPuzzle;
  const cx = Math.round(panel.x + panel.w / 2);
  const cy = Math.round(panel.y + panel.h / 2);
  const label = 'Se terminó el tiempo';

  // Medidas y overlay
  const bw = 200, bh = 46, gap = 8, padX = 24, padY = 24, lineH = 28;
  ctx.save();
  ctx.font = FONT.bold24;
  const textW = Math.ceil(ctx.measureText(label).width);
  const overlayW = Math.max(textW + padX * 2, bw + padX * 2);
  const textBottom = cy - 4;              // misma posición de texto
  const textTop = textBottom - lineH;
  const buttonY = cy + gap;                // misma posición del botón
  const overlayH = lineH + gap + bh + padY * 2;
  const overlayX = Math.round(cx - overlayW / 2);
  const overlayY = Math.round(textTop - padY);

  // Fondo del overlay
  drawRoundedRect(ctx, overlayX, overlayY, overlayW, overlayH, 12);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fill();
  ctx.strokeStyle = COLORS.overlayStroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Texto centrado
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, cx, textBottom);
  ctx.restore();

  // Botón “Reintentar” debajo del texto
  const rect = { x: Math.round(cx - bw / 2), y: buttonY, w: bw, h: bh };
  dibujarBotonVioleta(ctx, rect, 'Reintentar');
  estadoPuzzle.botonReintentar = rect;
}

// ========= Gestión de estado, navegación y éxito =========

/** Reinicia el nivel actual (estado, timers y penalizaciones). */
function reiniciarNivelActual() {
  if (!estadoPuzzle) return;
  const { cols, rows } = estadoPuzzle;
  if (estadoPuzzle.timerId) { clearInterval(estadoPuzzle.timerId); estadoPuzzle.timerId = null; }
  if (rafTimerBarra) { cancelAnimationFrame(rafTimerBarra); rafTimerBarra = null; }
  estadoPuzzle.rotaciones = Array.from({ length: cols * rows }, () => Math.floor(Math.random() * 4));
  estadoPuzzle.completado = false;
  estadoPuzzle.timeUp = false;
  estadoPuzzle.botonReintentar = null;
  estadoPuzzle.botonSiguiente = null;
  estadoPuzzle.botonVolver = null;
  estadoPuzzle.tiempoRestante = TIMER_LVL3_SECONDS;
  estadoPuzzle.penalizacionMs = 0;
  estadoPuzzle.piezasBloqueadas = new Set();
  estadoPuzzle.inicioPuzzleMs = performance.now();
  redibujarPuzzle();
  if (estadoPuzzle.nivel < 3) dibujarTimerInicioBarra(estadoPuzzle.ctx, 0);
}

/** Muestra imagen correcta y UI de fin de nivel; gestiona botones. */
function mostrarPuzzleCorrecto() {
  const { ctx, canvas, nivel, dificultad, imagen, pos, iconoHome, iconoReset } = estadoPuzzle;
  if (estadoPuzzle.timerId) { clearInterval(estadoPuzzle.timerId); estadoPuzzle.timerId = null; }
  if (rafTimerBarra) { cancelAnimationFrame(rafTimerBarra); rafTimerBarra = null; }
  ctx.clearRect(panel.x, panel.y, panel.w, panel.h);
  dibujarPanel(ctx, canvas);
  ctx.filter = 'none';
  ctx.drawImage(imagen, pos.dx, pos.dy, pos.w, pos.h);
  ctx.lineWidth = 4;
  ctx.strokeStyle = COLORS.successStroke;
  ctx.strokeRect(pos.dx, pos.dy, pos.w, pos.h);
  dibujarBarraSuperior(ctx, nivel, dificultad, iconoHome, iconoReset);
  if (nivel < 3) {
    const ahora = performance.now();
    const base = Math.max(0, estadoPuzzle.inicioPuzzleMs ? (ahora - estadoPuzzle.inicioPuzzleMs) : 0);
    const extra = Number(estadoPuzzle.penalizacionMs || 0);
    const elapsedMs = base + extra;
    estadoPuzzle.botonSiguiente = dibujarTiempoCompletadoYBoton(ctx, pos, elapsedMs);
    estadoPuzzle.botonVolver = null;
  } else {
    estadoPuzzle.botonSiguiente = null;
    estadoPuzzle.botonVolver = dibujarFelicitacionesYBotonVolver(ctx, pos);
  }
  estadoPuzzle.completado = true;
}

/** Si el puzzle está correcto, muestra la pantalla de éxito. */
function verificarPuzzleCorrecto() {
  if (!estadoPuzzle || estadoPuzzle.completado) return;
  if (esPuzzleCorrecto(estadoPuzzle.rotaciones)) {
    mostrarPuzzleCorrecto();
  }
}

/** Avanza al siguiente nivel y reinicia estado/timers. */
function avanzarNivel() {
  const { cols, rows } = estadoPuzzle;
  if (estadoPuzzle.timerId) { clearInterval(estadoPuzzle.timerId); estadoPuzzle.timerId = null; }
  if (rafTimerBarra) { cancelAnimationFrame(rafTimerBarra); rafTimerBarra = null; }
  estadoPuzzle.nivel = Math.min(3, (estadoPuzzle.nivel || 1) + 1);
  estadoPuzzle.rotaciones = Array.from({ length: cols * rows }, () => Math.floor(Math.random() * 4));
  estadoPuzzle.completado = false;
  estadoPuzzle.timeUp = false;
  estadoPuzzle.botonSiguiente = null;
  estadoPuzzle.botonVolver = null;
  estadoPuzzle.botonReintentar = null;
  estadoPuzzle.penalizacionMs = 0;
  estadoPuzzle.piezasBloqueadas = new Set();
  estadoPuzzle.inicioPuzzleMs = performance.now();
  redibujarPuzzle();
  if (estadoPuzzle.nivel < 3) dibujarTimerInicioBarra(estadoPuzzle.ctx, 0);
}

/** Vuelve al menú (libera timers/rAF y llama a window.loadMenu si existe). */
function volverAlMenu() {
  try {
    if (estadoPuzzle?.timerId) { clearInterval(estadoPuzzle.timerId); }
    if (rafTimerBarra) { cancelAnimationFrame(rafTimerBarra); }
  } catch {}
  rafTimerBarra = null;
  iniciado = false;
  if (typeof window.loadMenu === 'function') {
    try {
      const { ctx, canvas } = estadoPuzzle || {};
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
      window.loadMenu();
      return;
    } catch {}
  }
  window.location.reload();
}

// ========= Transición a grilla y listeners =========

/**
 * Transición: hace fade-out, crea estadoPuzzle, redibuja y registra listeners.
 * Listeners:
 *  - click: reset/home/ayudita/siguiente/volver/reintentar o girar pieza.
 *  - contextmenu: prevenir menú y girar a la derecha.
 */
function desvanecerImagen(ctx, canvas, imagen, pos, duracion, iconoHome, iconoReset, nivel, dificultad, cols, rows) {
  const t0 = performance.now();
  const d = duracion ;//Duracion de la transición  de desvanecimiento
  (function paso(t) {
    const p = Math.min(1, (t - t0) / d);
    ctx.clearRect(panel.x, panel.y, panel.w, panel.h);
    dibujarPanel(ctx, canvas);
    dibujarBarraSuperior(ctx, nivel, dificultad, iconoHome, iconoReset);
    dibujarImagenConBorde(ctx, imagen, pos, 1 - p);
    if (p < 1) return requestAnimationFrame(paso);//requestAnimationFrame para la animación
    
    const rotaciones = Array.from({ length: cols * rows }, () => Math.floor(Math.random() * 4));// Rotaciones iniciales aleatorias
    estadoPuzzle = {
      ctx, canvas, imagen, pos,
      cols, rows, rotaciones,
      nivel, dificultad,
      iconoHome, iconoReset,
      completado: false,
      botonSiguiente: null,
      botonVolver: null,
      botonReintentar: null,
      timeUp: false,
      timerId: null,
      tiempoRestante: undefined,
      penalizacionMs: 0,
      piezasBloqueadas: new Set(),
      inicioPuzzleMs: performance.now()
    };
    redibujarPuzzle();

    if (!canvas.__rotHandlers) {
      canvas.addEventListener('click', (ev) => {
        const { x, y } = obtenerPosMouse(canvas, ev);

        // Click en íconos de barra superior
        if (estadoPuzzle?.rectReset && puntoEnRect(x, y, estadoPuzzle.rectReset)) {
          reiniciarNivelActual();
          return;
        }
        if (estadoPuzzle?.rectHome && puntoEnRect(x, y, estadoPuzzle.rectHome)) {
          volverAlMenu();
          return;
        }

        // NUEVO: click en icono de ayuda
        if (estadoPuzzle?.rectAyudita && puntoEnRect(x, y, estadoPuzzle.rectAyudita)) {
          aplicarAyuda();
          return;
        }

        // Click en "Volver al menú" (nivel 3 final)
        if (estadoPuzzle?.completado && estadoPuzzle.botonVolver && puntoEnRect(x, y, estadoPuzzle.botonVolver)) {
          volverAlMenu();
          return;
        }
        // Click en "Siguiente nivel"
        if (estadoPuzzle?.completado && estadoPuzzle.botonSiguiente && puntoEnRect(x, y, estadoPuzzle.botonSiguiente)) {
          avanzarNivel();
          return;
        }
        // Click en "Reintentar" (tiempo agotado nivel 3)
        if (estadoPuzzle?.timeUp && estadoPuzzle.botonReintentar && puntoEnRect(x, y, estadoPuzzle.botonReintentar)) {
          reiniciarNivelActual();
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
  })(performance.now());
}

// ========= Arranque / Bootstrap =========

/**
 * Punto de entrada del panel de juego.
 * - Lee nivel/dificultad de config.
 * - Carga íconos e imagen.
 * - Dibuja presentación y timer inicial (5s), luego inicia transición a grilla.
 */
window.startGamePanel = function (canvas, ctx, config) {
  if (iniciado || !canvas || !ctx) return;
  iniciado = true;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dibujarPanel(ctx, canvas);

  const nivel = Number(config?.level) || 1;
  const dificultad = config?.difficulty || 'normal';
  const { cols, rows } = determinarDimensionesGrilla(dificultad);
  const iconoHome = new Image(); iconoHome.src = 'assets/iconoHomeJuego.png';
  const iconoReset = new Image(); iconoReset.src = 'assets/iconoResetJuego.png';
  // NUEVO: cargar icono de ayuda
  iconoAyudita = new Image(); iconoAyudita.src = 'assets/iconoAyudita.png';
  dibujarBarraSuperior(ctx, nivel, dificultad, iconoHome, iconoReset);

  const ruta = config?.image;
  if (!ruta) return;
  const imagen = new Image();
  imagen.onload = () => {
    ctx.clearRect(panel.x, panel.y, panel.w, panel.h);
    dibujarPanel(ctx, canvas);
    dibujarBarraSuperior(ctx, nivel, dificultad, iconoHome, iconoReset);
    const pos = calcularPosicionImagen(imagen);
    dibujarImagenConBorde(ctx, imagen, pos, 1);
    // NUEVO: mostrar icono de ayuda en la pantalla de presentación
    dibujarIconoAyudita(ctx, pos);
    // Contador simple en la barra superior por 5s (luego sigue como cronómetro)
    dibujarTimerInicioBarra(ctx, 5000);
    setTimeout(() => desvanecerImagen(ctx, canvas, imagen, pos, 700, iconoHome, iconoReset, nivel, dificultad, cols, rows), 5000);
  };
  imagen.src = ruta;
};