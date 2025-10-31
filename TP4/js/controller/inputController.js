export default class InputController {
  constructor(canvas, menuView, boardView, getEstado) {
    this.canvas = canvas;
    this.menuView = menuView;
    this.boardView = boardView;
    this.getEstado = typeof getEstado === 'function' ? getEstado : () => 'menu';

    this._move = (e) => {
      const r = this.canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const s = this.getEstado();
      if (s === 'menu' && this.menuView && this.menuView.onMouseMove) this.menuView.onMouseMove(x, y);
      if (s === 'jugando' && this.boardView && this.boardView.onMouseMove) this.boardView.onMouseMove(x, y);
    };

    this._up = (e) => {
      const r = this.canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const s = this.getEstado();
      if (s === 'menu' && this.menuView && this.menuView.onClick) this.menuView.onClick(x, y);
      if (s === 'jugando' && this.boardView && this.boardView.onClick) this.boardView.onClick(x, y);
    };

    this.canvas.addEventListener('mousemove', this._move);
    this.canvas.addEventListener('mouseup', this._up);
  }

  setViews(menuView, boardView) {
    if (menuView) this.menuView = menuView;
    if (boardView) this.boardView = boardView;
  }

  dispose() {
    this.canvas.removeEventListener('mousemove', this._move);
    this.canvas.removeEventListener('mouseup', this._up);
  }
}
