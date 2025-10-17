'use strict';

let started = false;

window.startGamePanel = function (canvas, ctx, config) {
  if (started) return;
  if (!canvas || !ctx) return; // no buscamos el canvas aquí
  started = true;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 28px Poppins, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 6;
  const cx = canvas.width / 2, cy = canvas.height / 2;

  // Sombra con stroke para mejor contraste
  ctx.strokeText('Juego iniciado', cx, cy - 10);
  ctx.fillText('Juego iniciado', cx, cy - 10);

  ctx.font = '500 16px Poppins, sans-serif';
  const info = `Dificultad: ${config?.difficulty || '-'} | Piezas: ${config?.pieces || '-'} | Imagen: ${config?.image || '-'}`;
  ctx.strokeText(info, cx, cy + 20);
  ctx.fillText(info, cx, cy + 20);
  ctx.restore();
};