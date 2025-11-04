// MVC: Input adapter (no parte estricta del modelo MVC, pero complementa)
// Responsabilidad: convertir eventos DOM a coordenadas sobre el canvas y delegar a JuegoController.
// - Mantener aquí listeners y el cálculo de escala CSS->canvas.
// - No implementar reglas de juego aquí; no conocer views; delegar a juegoController.

export default class InputController {
  constructor(canvas, juegoController) {
    // Referencias esenciales
    this.canvas = canvas;
    this.juegoController = juegoController;

    // Helper: convertir coords de evento -> coords canvas (corrige escala CSS)
    const toCanvasXY = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    // Pointer events para soportar mouse/touch/pen de forma unificada
    this._onPointerDown = (e) => {
      const { x, y } = toCanvasXY(e);
      try { this.canvas.setPointerCapture?.(e.pointerId); } catch {}
      if (this.juegoController?.onPointerDown) this.juegoController.onPointerDown(x, y);
    };
    this._onPointerMove = (e) => {
      const { x, y } = toCanvasXY(e);
      if (this.juegoController?.onPointerMove) this.juegoController.onPointerMove(x, y);
    };
    this._onPointerUp = (e) => {
      const { x, y } = toCanvasXY(e);
      if (this.juegoController?.onPointerUp) this.juegoController.onPointerUp(x, y);
      try { this.canvas.releasePointerCapture?.(e.pointerId); } catch {}
    };

    // Registrar listeners (dejamos de usar click/mouse* para mover fichas)
    this.canvas.addEventListener('pointerdown', this._onPointerDown);
    this.canvas.addEventListener('pointermove', this._onPointerMove);
    this.canvas.addEventListener('pointerup', this._onPointerUp);
  }

  // Permite actualizar el juegoController si es necesario
  setJuegoController(juegoController) {
    this.juegoController = juegoController;
  }

  // Quitar listeners para evitar fugas de memoria
  dispose() {
    this.canvas.removeEventListener('pointerdown', this._onPointerDown);
    this.canvas.removeEventListener('pointermove', this._onPointerMove);
    this.canvas.removeEventListener('pointerup', this._onPointerUp);
  }
}
