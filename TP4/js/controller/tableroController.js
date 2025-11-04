// MVC: Controller
// Responsabilidad: mediar entre Tablero (model) y TableroView (view).
// - Contiene la lógica de selección/movimiento (usar métodos del modelo).
// - No debe acceder directamente al DOM ni manejar eventos de canvas.
// - Exponer API simple: handleCellActivated(r,c), getLegalMovesFor(r,c), clearSelection(), destroy().

export default class TableroController {
  // tablero: modelo Tablero, view: TableroView
  constructor(tablero, view, opts = {}) {
    this.tablero = tablero;
    this.view = view;
    this.selected = null;    // {r,c} o null
    this.legalMoves = [];    // lista de Movimiento desde selected
    this.onGameOver = opts.onGameOver; // delegado (JuegoController)
    this.onGameWin = opts.onGameWin;   // delegado (JuegoController)
    this.dragging = null; // { from:{r,c}, pos:{x,y}, ficha:any } mientras se arrastra

    // Vincular controller en la view para que la view pueda leer selección / moves
    if (this.view) this.view.controller = this;

    // No se crean listeners aquí: la conversión de eventos -> celdas la hace InputController/main
    // Primer dibujo
    if (this.view) this.view.draw();

    // Si al iniciar hay victoria o no hay movimientos, avisar (delegado)
    if (this.tablero) {
      if (this._isWin()) {
        this._notifyGameWin('Ganaste');
      } else if (typeof this.tablero.hayMovimientosPosibles === 'function') {
        if (!this.tablero.hayMovimientosPosibles()) {
          this._notifyGameOver('Sin movimientos posibles. Perdiste');
        }
      }
    }
  }

  _notifyGameOver(msg) {
    if (typeof this.onGameOver === 'function') {
      this.onGameOver(msg, this);
    }
  }

  _notifyGameWin(msg) {
    if (typeof this.onGameWin === 'function') {
      this.onGameWin(msg, this);
    }
  }

  // Intenta inferir victoria de forma robusta según el modelo disponible
  _isWin() {
    const t = this.tablero;
    if (!t) return false;
    // Métodos comunes
    if (typeof t.esVictoria === 'function') return !!t.esVictoria();
    if (typeof t.esGanado === 'function') return !!t.esGanado();
    if (typeof t.estaResuelto === 'function') return !!t.estaResuelto();
    // Heurística: 1 ficha restante
    if (typeof t.fichasRestantes === 'function') return t.fichasRestantes() === 1;
    if (typeof t.cantidadFichas === 'function') return t.cantidadFichas() === 1;
    if (typeof t.contarFichas === 'function') return t.contarFichas() === 1;
    return false;
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
        // Tras aplicar movimiento: primero victoria, luego derrota si no quedan movimientos
        if (this._isWin()) {
          this._notifyGameWin('Ganaste');
        } else if (!this.tablero.hayMovimientosPosibles()) {
          this._notifyGameOver('Sin movimientos posibles. Perdiste');
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

  // Drag & drop API: seleccionar, arrastrar (opcional) y soltar.
  // - startDragAt: si hay ficha en (r,c), selecciona y calcula movimientos y marca origen de drag.
  startDragAt(r, c) {
    const celda = this.tablero?.getCelda(r, c);
    if (celda && celda.ficha !== null) {
      this.selected = { r, c };
      this.legalMoves = this.tablero.movimientosLegalesDesde(r, c) || [];
      this.dragging = { from: { r, c }, pos: null, ficha: celda.ficha };
    } else {
      this.selected = null;
      this.legalMoves = [];
      this.dragging = null;
    }
    this.view?.draw?.();
  }

  // - dragOver: aquí podríamos actualizar feedback adicional. Mantener simple.
  dragOver(r, c) {
    // Sin cambios de estado por celda en esta versión mínima.
  }

  // - dropAt: si (r,c) es destino legal, aplica movimiento y verifica estado del juego.
  dropAt(r, c) {
    if (this.selected && Array.isArray(this.legalMoves)) {
      const match = this.legalMoves.find(m => m.to.r === r && m.to.c === c);
      if (match) {
        this.tablero.aplicarMovimiento(match);
        if (this._isWin()) {
          this._notifyGameWin('Ganaste');
        } else if (this.tablero?.hayMovimientosPosibles && !this.tablero.hayMovimientosPosibles()) {
          this._notifyGameOver('Sin movimientos posibles. Perdiste');
        }
      }
    }
    // Limpiar selección y drag después de soltar (válido o no)
    this.selected = null;
    this.legalMoves = [];
    this.dragging = null;
    this.view?.draw?.();
  }

  // Helper: mapear coordenadas canvas -> celda usando las métricas de la vista
  _cellAtXY(x, y) {
    // Preferir utilidades de la vista si existen
    if (this.view?.cellAt) return this.view.cellAt(x, y);
    if (!this.view?.tablero || !this.view?._metrics) return null;
    const m = this.view._metrics();
    const c = Math.floor((x - m.ox) / m.cellW);
    const r = Math.floor((y - m.oy) / m.cellH);
    if (c >= 0 && c < m.cols && r >= 0 && r < m.rows) return { r, c };
    return null;
  }

  // Drag basado en coordenadas canvas -------------------------------
  startDragAtXY(x, y) {
    const cell = this._cellAtXY(x, y);
    if (!cell) { this.clearSelection(); this.dragging = null; return; }
    this.startDragAt(cell.r, cell.c);
    if (this.dragging) this.dragging.pos = { x, y };
    this.view?.draw?.();
  }

  dragOverXY(x, y) {
    if (!this.dragging) return;
    this.dragging.pos = { x, y };
    this.view?.draw?.();
  }

  dropAtXY(x, y) {
    const cell = this._cellAtXY(x, y);
    if (!cell) {
      this.clearSelection();
      this.dragging = null;
      this.view?.draw?.();
      return;
    }
    this.dropAt(cell.r, cell.c);
  }
}
