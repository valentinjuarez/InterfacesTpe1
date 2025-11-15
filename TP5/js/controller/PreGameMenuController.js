import { PreGameMenuView } from "../view/PreGameMenuView.js";

export class PreGameMenuController {
  constructor({ canvas, imageSrc } = {}) {
    const targetCanvas = canvas || document.getElementById("myCanvas");

    this.view = new PreGameMenuView({
      canvas: targetCanvas,
      imageSrc
    });

    // Estado del menú
    this.state = {
      selectedDifficulty: 'normal',
      hoveredDifficulty: null,
      selectedMap: null,
      hoveredMap: null,
      playButtonHovered: false
    };
    this.view.setState(this.state);

    // Bind de handlers
    this._onMouseMove = (e) => this.handleMouseMove(e);
    this._onClick = (e) => this.handleClick(e);

    // Listeners
    targetCanvas.addEventListener("mousemove", this._onMouseMove);
    targetCanvas.addEventListener("click", this._onClick);

    // Primer render
    this.view.renderMenu();
  }

  // Método por si más adelante querés volver a dibujar el pre-game
  showPreGame() {
    this.view.renderBackground();
  }

  // Coord transform para canvas CSS vs resolución
  _eventToCanvasXY(e) {
    const rect = this.view.canvas.getBoundingClientRect();
    const scaleX = this.view.canvas.width / rect.width;
    const scaleY = this.view.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  handleMouseMove(e) {
    const { x, y } = this._eventToCanvasXY(e);
    const hover = this.view.detectHover(x, y);

    // Reset hovers
    this.state.hoveredDifficulty = null;
    this.state.hoveredMap = null;
    this.state.playButtonHovered = false;

    if (hover) {
      if (hover.type === "difficulty") this.state.hoveredDifficulty = hover.key;
      if (hover.type === "map") this.state.hoveredMap = hover.index;
      if (hover.type === "play") this.state.playButtonHovered = true;
    }

    this.view.setState(this.state);
    this.view.renderMenu();
  }

  handleClick(e) {
    const { x, y } = this._eventToCanvasXY(e);
    const hit = this.view.detectClick(x, y);

    if (!hit) return;

    if (hit.type === "difficulty") {
      this.state.selectedDifficulty = hit.key;
    } else if (hit.type === "map") {
      this.state.selectedMap = hit.index;
    } else if (hit.type === "play") {
      this.startGame();
    }

    this.view.setState(this.state);
    this.view.renderMenu();
  }

  // Stub: se invoca al presionar JUGAR
  startGame() {
    // Sin implementación de lógica de juego por ahora.
  }
}
