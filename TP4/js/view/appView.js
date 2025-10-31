// js/view/AppView.js
export default class AppView {
  constructor(ctx, menuView, boardView, colorFondo) {
    this.ctx = ctx;
    this.menuView = menuView;
    this.boardView = boardView;
    this.colorFondo = colorFondo || '#5b2def'; // violeta
  }

  render(estado, timestamp) {
    const ctx = this.ctx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Panel/fondo único (responsabilidad de la View)
    ctx.fillStyle = this.colorFondo;
    ctx.fillRect(0, 0, w, h);

    // Sub-escena
    if (estado === 'menu') {
      this.menuView.draw(timestamp);
    } else if (estado === 'jugando') {
      this.boardView.draw(timestamp);
    } else {
      // por ahora, reutilizamos el menú
      this.menuView.draw(timestamp);
    }
  }
}

// MVC: View (orquestador de sub-views)
// Responsabilidad: dibujar fondo/estructura y delegar a menuView o boardView para sus contenidos.
// - Evitar que main manipule estilos del canvas; AppView puede aplicar estilos visuales en render().
