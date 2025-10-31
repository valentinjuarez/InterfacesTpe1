export default class PreGameMenu {
  constructor(ctx, onStart) {
    this.ctx = ctx;
    this.onStart = onStart;

    this.w = ctx.canvas.width;
    this.h = ctx.canvas.height;

    // botón centrado
    this.btn = { x: this.w / 2 - 110, y: this.h / 2 + 30, w: 220, h: 60 };
    this.hover = false;
  }

  onMouseMove(mouseX, mouseY) {
    const b = this.btn;
    const dentroX = mouseX >= b.x && mouseX <= b.x + b.w;
    const dentroY = mouseY >= b.y && mouseY <= b.y + b.h;
    this.hover = (dentroX && dentroY);
  }

  onClick(mouseX, mouseY) {
    const b = this.btn;
    const dentroX = mouseX >= b.x && mouseX <= b.x + b.w;
    const dentroY = mouseY >= b.y && mouseY <= b.y + b.h;
    const clicEnBoton = (dentroX && dentroY);
    if (clicEnBoton) {
      this.onStart();
    }
  }

  draw(timestamp) {
    const ctx = this.ctx;

    // Título
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 56px Arial';
    ctx.fillText('Peg Solitaire', this.w / 2, this.h / 2 - 60);

    // Botón “JUGAR” (con leve pulso en hover)
    const b = this.btn;
    let escala = 1.0;
    if (this.hover) {
      const t = Math.sin((timestamp || 0) / 200.0);
      escala = 1.0 + 0.02 * (0.5 + 0.5 * t);
    }

    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const w = b.w * escala;
    const h = b.h * escala;
    const x = cx - w / 2;
    const y = cy - h / 2;

    // botón
    this._roundRect(ctx, x, y, w, h, 12);
    ctx.fillStyle = this.hover ? '#ffd60a' : '#ffb703';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    // texto del botón
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 26px Arial';
    ctx.fillText('JUGAR', cx, cy);
  }

  _roundRect(ctx, x, y, w, h, r) {
    let rr = r;
    if (w < 2 * rr) { rr = w / 2; }
    if (h < 2 * rr) { rr = h / 2; }

    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y,     x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x,     y + h, rr);
    ctx.arcTo(x,     y + h, x,     y,     rr);
    ctx.arcTo(x,     y,     x + w, y,     rr);
    ctx.closePath();
  }
}
