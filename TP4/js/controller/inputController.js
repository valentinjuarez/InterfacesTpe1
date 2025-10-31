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
      // Convierte coordenadas del evento a coordenadas del canvas
      const r = this.canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;

      // Redirige al view correspondiente según el estado
      const estado = this.getEstado();
      if (estado === 'menu' && this.menuView && this.menuView.onMouseMove) {
        this.menuView.onMouseMove(x, y);
      } else if (estado === 'jugando' && this.boardView && this.boardView.onMouseMove) {
        this.boardView.onMouseMove(x, y);
      }
    };

    this._onMouseUp = (e) => {
      // Igual conversión de coordenadas para clicks
      const r = this.canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;

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
