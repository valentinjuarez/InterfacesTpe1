// js/view/AppView.js
export default class AppView {
  constructor(ctx, menuView, boardView, colorFondo) {
    this.ctx = ctx;
    this.menuView = menuView;
    this.boardView = boardView;
    this.colorFondo = colorFondo || '#5b2def'; // violeta

    // Imagen de fondo (fondoPeg). Se intenta cargar por defecto desde assets/
    this.bgImage = null;
    this._bgSrc = null;
    this.setBackground('assets/fondoPeg.png');
  }

  // Permite cambiar la imagen de fondo en tiempo de ejecución
  setBackground(src) {
    if (!src) {
      this.bgImage = null;
      this._bgSrc = null;
      return;
    }
    // normaliza ruta tipo Windows -> assets/...
    let s = src;
    const m = String(s).match(/assets[\\/].+$/i);
    if (m) s = m[0].replace(/\\/g, '/');
    // evitar recargar si es la misma fuente
    if (this._bgSrc === s) return;
    this._bgSrc = s;
    const img = new Image();
    img.onload = () => {
      this.bgImage = img;
      // forzar redraw si es posible
      try { this.render && this.render(); } catch (e) {}
    };
    img.onerror = () => { this.bgImage = null; };
    img.src = s;
  }

  render(estado, timestamp) {
    const ctx = this.ctx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Dibujar imagen de fondo si está disponible; si no, usar colorFondo
    if (this.bgImage && this.bgImage.complete && this.bgImage.naturalWidth > 0) {
      // Estirar para cubrir todo el canvas (simple, evita cálculo de aspect)
      try {
        ctx.drawImage(this.bgImage, 0, 0, w, h);
      } catch (e) {
        // fallback a color si algo falla
        ctx.fillStyle = this.colorFondo;
        ctx.fillRect(0, 0, w, h);
      }
    } else {
      // Panel/fondo único (responsabilidad de la View)
      ctx.fillStyle = this.colorFondo;
      ctx.fillRect(0, 0, w, h);
    }

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
