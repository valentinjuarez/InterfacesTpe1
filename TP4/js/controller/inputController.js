// MVC: Input adapter (no parte estricta del modelo MVC, pero complementa)
// Responsabilidad: convertir eventos DOM a coordenadas sobre el canvas y delegar a la view correspondiente.
// - Mantener aquí listeners y el cálculo de escala CSS->canvas.
// - No implementar reglas de juego aquí; solo delegar a view/controller.

export default class InputController {
  constructor(canvas, menuView, boardView, getEstado) {
    // Referencias esenciales
    this.canvas = canvas;
    this.menuView = menuView;
    this.boardView = boardView;
    // getEstado debe ser una función que devuelve 'menu' o 'jugando'
    this.getEstado = typeof getEstado === 'function' ? getEstado : () => 'menu';

    // Handlers enlazados para poder removerlos luego
    this._onMouseMove = (e) => {
      // Convierte coordenadas del evento a coordenadas del canvas (escala CSS -> canvas)
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      // Redirige al view correspondiente según el estado
      const estado = this.getEstado();
      if (estado === 'menu' && this.menuView && this.menuView.onMouseMove) {
        this.menuView.onMouseMove(x, y);
      } else if (estado === 'jugando' && this.boardView && this.boardView.onMouseMove) {
        this.boardView.onMouseMove(x, y);
      }
    };

    this._onMouseUp = (e) => {
      // Igual conversión de coordenadas para clicks (escala incluida)
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      // Redirige al view correspondiente según el estado
      const estado = this.getEstado();
      if (estado === 'menu' && this.menuView && this.menuView.onClick) {
        this.menuView.onClick(x, y);
      } else if (estado === 'jugando' && this.boardView && this.boardView.onClick) {
        this.boardView.onClick(x, y);
      }
    };

    // Registrar listeners en el canvas
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('mouseup', this._onMouseUp);
  }

  // Permite actualizar las vistas si es necesario
  setViews(menuView, boardView) {
    if (menuView) this.menuView = menuView;
    if (boardView) this.boardView = boardView;
  }

  // Quitar listeners para evitar fugas de memoria
  dispose() {
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('mouseup', this._onMouseUp);
  }
}
