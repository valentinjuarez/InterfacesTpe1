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
      if (this.juegoController?.onPointerPresionar) this.juegoController.onPointerPresionar(x, y);
    };
    this._onPointerMove = (e) => {
      const { x, y } = toCanvasXY(e);
      if (this.juegoController?.onPointerMover) this.juegoController.onPointerMover(x, y);
    };
    this._onPointerUp = (e) => {
      const { x, y } = toCanvasXY(e);
      if (this.juegoController?.onPointerSoltar) this.juegoController.onPointerSoltar(x, y);
      try { this.canvas.releasePointerCapture?.(e.pointerId); } catch {}
    };

    // Registrar listeners (dejamos de usar click/mouse* para mover fichas)
    this.canvas.addEventListener('pointerdown', this._onPointerDown);
    this.canvas.addEventListener('pointermove', this._onPointerMove);
    this.canvas.addEventListener('pointerup', this._onPointerUp);

    /**
     * Teclado: mapea atajos globales y delega al Controller.
     * - R: resetear juego (si se está jugando).
     * - M: ir al menú.
     */
    this._onKeyDown = (e) => {
      const k = e.key?.toLowerCase();
      if (k === 'r') {
        this.juegoController?.resetJuego?.();
      } else if (k === 'm') {
        this.juegoController?.irAlMenu?.();
      }
    };
    window.addEventListener('keydown', this._onKeyDown);
  }

  // Permite actualizar el juegoController si es necesario
  establecerControladorJuego(juegoController) {
    this.juegoController = juegoController;
  }

  /**
   * Libera todos los listeners del adapter (incluye teclado).
   */
  dispose() {
    this.canvas.removeEventListener('pointerdown', this._onPointerDown);
    this.canvas.removeEventListener('pointermove', this._onPointerMove);
    this.canvas.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('keydown', this._onKeyDown);
  }
}
