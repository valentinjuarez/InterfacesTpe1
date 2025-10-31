// js/view/tableroView.js
export default class TableroView {
  constructor(ctx) {
    this.ctx = ctx;
  }

  draw(timestamp) {
    const ctx = this.ctx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Placeholder visual del tablero (responsabilidad de la View)
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect((w - 360) / 2, (h - 360) / 2, 360, 360);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Aquí irá el tablero', w / 2, h / 2);
  }
}
