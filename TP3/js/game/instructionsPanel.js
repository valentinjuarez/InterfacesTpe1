'use strict';

// Dibuja rect redondeado
function drawRoundedRect(ctx, x, y, w, h, r = 12) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Dibuja panel azul centrado
function drawPanel(ctx, canvas, panel) {
  panel.x = Math.round((canvas.width - panel.w) / 2);
  panel.y = Math.round((canvas.height - panel.h) / 2);
  ctx.fillStyle = 'rgba(25, 99, 195, 0.85)';
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
}

// Botón violeta reutilizable
function drawVioletButton(ctx, rect, label) {
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
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2);
}

// Helper: dibuja una sección (card) con título y líneas de texto (compacto)
function drawSection(ctx, x, y, w, title, lines) {
  const pad = 12, lineH = 18, titleH = 20, gap = 4;
  const h = pad + titleH + gap + lines.length * lineH + pad;
  drawRoundedRect(ctx, x, y, w, h, 12);
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = '700 15px Poppins, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(title, x + pad, y + pad);

  ctx.font = '500 13px Poppins, sans-serif';
  let ly = y + pad + titleH + gap;
  lines.forEach(txt => { ctx.fillText(txt, x + pad, ly); ly += lineH; });
  ctx.restore();
  return { x, y, w, h };
}

window.startInstructionsPanel = function (canvas, ctx) {
  const panel = { x: 0, y: 0, w: 800, h: 680 };
  let btnVolver = null;

  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPanel(ctx, canvas, panel);

    // Título (más compacto)
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = '700 24px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Instrucciones', panel.x + panel.w / 2, panel.y + 24);
    ctx.restore();

    // Layout base compacto
    const contentPadX = 24;
    let curY = panel.y + 64;
    const cardW = panel.w - contentPadX * 2;
    const x = panel.x + contentPadX;
    const vGap = 8;

    // Sección 1: Qué es BLOCKA
    const s1 = [
      'Blocka es un rompecabezas con imágenes dividido en partes.',
      'Tu misión es girar cada parte hasta formar la imagen correcta.',
      '¡Fácil de entender y divertido para todas las edades!'
    ];
    const r1 = drawSection(ctx, x, curY, cardW, '¿Qué es BLOCKA?', s1);
    curY = r1.y + r1.h + vGap;

    // Sección 2: Cómo jugar (pasos cortos)
    const s2 = [
      '1) Toca la parte que quieras girar.',
      '2) Gira hasta que encaje con las otras partes.',
      '3) Repite hasta completar la imagen.'
    ];
    const r2 = drawSection(ctx, x, curY, cardW, 'Cómo jugar', s2);
    curY = r2.y + r2.h + vGap;

    // Sección 3: Controles (sin chips)
    const s3 = [
      'Click izquierdo: gira hacia la izquierda (↺).',
      'Click derecho: gira hacia la derecha (↻).'
    ];
    const r3 = drawSection(ctx, x, curY, cardW, 'Controles', s3);
    curY = r3.y + r3.h + vGap;

    // Sección 4: Niveles y filtros
    const s4 = [
      'Cada nivel trae una imagen nueva y un filtro distinto.',
      'Al completar, los filtros desaparecen y ves la imagen a color.',
      'Algunas piezas pueden tener filtros diferentes para más desafío.'
    ];
    const r4 = drawSection(ctx, x, curY, cardW, 'Niveles y filtros', s4);
    curY = r4.y + r4.h + vGap;

    // Sección 5: Consejos
    const s5 = [
      'Si te trabas, usa la ayudita: coloca una pieza y la bloquea.',
      'El tiempo se ajusta cuando usas ayudas según el nivel.',
      'Al terminar, continúa al siguiente nivel o vuelve al menú.'
    ];
    const r5 = drawSection(ctx, x, curY, cardW, 'Consejos', s5);
    curY = r5.y + r5.h + 12;

    // Botón Volver al menú (más abajo y clamped al fondo)
    const bw = 220, bh = 46;
    const bx = Math.round(panel.x + (panel.w - bw) / 2);
    const bottomPad = 12;     // antes 24
    const extraOffsetY = 10;  // baja un poco el botón
    const by = Math.min(panel.y + panel.h - bh - bottomPad, curY + extraOffsetY);
    btnVolver = { x: bx, y: by, w: bw, h: bh };
    drawVioletButton(ctx, btnVolver, 'Volver al menú');
  }

  function getMouse(canvas, ev) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (ev.clientX - r.left) * (canvas.width / r.width),
      y: (ev.clientY - r.top) * (canvas.height / r.height)
    };
  }
  function inRect(p, r) { return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }

  if (!canvas.__instrHandlers) {
    canvas.addEventListener('click', (ev) => {
      const p = getMouse(canvas, ev);
      if (btnVolver && inRect(p, btnVolver)) {
        if (typeof window.loadMenu === 'function') {
          // limpiar y volver al menú
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          window.loadMenu();
        } else {
          window.location.reload();
        }
      }
    });
    canvas.__instrHandlers = true;
  }

  redraw();
};
