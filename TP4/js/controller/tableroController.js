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
      if (this._esVictoria()) {
        this._notificarVictoria('Ganaste');
      } else if (typeof this.tablero.hayMovimientosPosibles === 'function') {
        if (!this.tablero.hayMovimientosPosibles()) {
          this._notificarFinJuego('Sin movimientos posibles. Perdiste');
        }
      }
    }
  }

  _notificarFinJuego(msg) {
    if (typeof this.onGameOver === 'function') {
      this.onGameOver(msg, this);
    }
  }

  _notificarVictoria(msg) {
    if (typeof this.onGameWin === 'function') {
      this.onGameWin(msg, this);
    }
  }

  // Intenta inferir victoria de forma robusta según el modelo disponible
  _esVictoria() {
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
  // Obtener movimientos legales (útil para mostrar hints desde la UI)
  obtenerMovimientosLegalesPara(r, c) {
    return this.tablero.movimientosLegalesDesde(r, c);
  }

  // Limpiar selección y solicitar redraw
  limpiarSeleccion() {
    this.selected = null;
    this.legalMoves = [];
    if (this.view) this.view.draw();
  }

  // Liberar referencias (no había listeners)
  destruir() {
    if (this.view && this.view.controller === this) this.view.controller = null;
    this.tablero = null;
    this.view = null;
  }

  // Drag & drop API: seleccionar, arrastrar (opcional) y soltar.
  // - startDragAt: si hay ficha en (r,c), selecciona y calcula movimientos y marca origen de drag.
  iniciarArrastreEn(r, c) {
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
  
  // - dropAt: si (r,c) es destino legal, aplica movimiento y verifica estado del juego.
  soltarEn(r, c) {
    if (this.selected && Array.isArray(this.legalMoves)) {
      const match = this.legalMoves.find(m => m.to.r === r && m.to.c === c);
      if (match) {
        this.tablero.aplicarMovimiento(match);
        if (this._esVictoria()) {
          this._notificarVictoria('Ganaste');
        } else if (this.tablero?.hayMovimientosPosibles && !this.tablero.hayMovimientosPosibles()) {
          this._notificarFinJuego('Sin movimientos posibles. Perdiste');
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
  _celdaEnXY(x, y) {
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
  iniciarArrastreEnXY(x, y) {
    const cell = this._celdaEnXY(x, y);
    if (!cell) { this.limpiarSeleccion(); this.dragging = null; return; }
    this.iniciarArrastreEn(cell.r, cell.c);
    if (this.dragging) this.dragging.pos = { x, y };
    this.view?.draw?.();
  }

  arrastreSobreXY(x, y) {
    if (!this.dragging) return;
    this.dragging.pos = { x, y };
    this.view?.draw?.();
  }

  soltarEnXY(x, y) {
    const cell = this._celdaEnXY(x, y);
    if (!cell) {
      this.limpiarSeleccion();
      this.dragging = null;
      this.view?.draw?.();
      return;
    }
    this.soltarEn(cell.r, cell.c);
  }
}
