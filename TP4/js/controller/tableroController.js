// MVC: Controller
// Responsabilidad: mediar entre Tablero (model) y TableroView (view).
// - Contiene la lógica de selección/movimiento (usar métodos del modelo).
// - No debe acceder directamente al DOM ni manejar eventos de canvas.
// - Exponer API simple: handleCellActivated(r,c), getLegalMovesFor(r,c), clearSelection(), destroy().

export default class TableroController {
  // tablero: modelo Tablero, view: TableroView
  constructor(tablero, view) {
    this.tablero = tablero;
    this.view = view;
    this.selected = null;    // {r,c} o null
    this.legalMoves = [];    // lista de Movimiento desde selected

    // Vincular controller en la view para que la view pueda leer selección / moves
    if (this.view) this.view.controller = this;

    // No se crean listeners aquí: la conversión de eventos -> celdas la hace InputController/main
    // Primer dibujo
    if (this.view) this.view.draw();
    // Si al iniciar no hay movimientos posibles, avisar (perdiste)
    if (this.tablero && typeof this.tablero.hayMovimientosPosibles === 'function') {
      if (!this.tablero.hayMovimientosPosibles()) {
        if (this.view && typeof this.view.showGameOver === 'function') {
          this.view.showGameOver('Perdiste');
        } else if (this.view) {
          this.view.gameOverMessage = 'Perdiste';
          this.view.draw();
        }
      }
    }
  }

  // Maneja activación de una celda (p. ej. click) usando coordenadas r,c de celda
  handleCellActivated(r, c) {
    const celdaModel = this.tablero.getCelda(r, c);
    // Si no hay selección y hay ficha -> seleccionar y calcular moves
    if (!this.selected) {
      if (celdaModel && celdaModel.ficha !== null) {
        this.selected = { r: r, c: c };
        this.legalMoves = this.tablero.movimientosLegalesDesde(r, c);
      }
    } else {
      // Si hay selección, ver si la activación corresponde a un destino legal
      const match = this.legalMoves.find(m => m.to.r === r && m.to.c === c);
      if (match) {
        this.tablero.aplicarMovimiento(match);
        // Tras aplicar movimiento, comprobar si quedan movimientos
        if (!this.tablero.hayMovimientosPosibles()) {
          if (this.view && typeof this.view.showGameOver === 'function') {
            this.view.showGameOver('Perdiste');
          } else if (this.view) {
            this.view.gameOverMessage = 'Perdiste';
          }
        }
      }
      // limpiar selección siempre (implementación simple)
      this.selected = null;
      this.legalMoves = [];
    }

    // Notificar a la view que debe redibujar
    if (this.view) this.view.draw();
  }

  // Alias más descriptivo
  selectCell(r, c) {
    return this.handleCellActivated(r, c);
  }

  // Obtener movimientos legales (útil para mostrar hints desde la UI)
  getLegalMovesFor(r, c) {
    return this.tablero.movimientosLegalesDesde(r, c);
  }

  // Limpiar selección y solicitar redraw
  clearSelection() {
    this.selected = null;
    this.legalMoves = [];
    if (this.view) this.view.draw();
  }

  // Liberar referencias (no había listeners)
  destroy() {
    if (this.view && this.view.controller === this) this.view.controller = null;
    this.tablero = null;
    this.view = null;
  }
}
