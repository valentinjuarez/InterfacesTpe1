import TableroController from './tableroController.js';
import Juego from '../model/game.js';

export default class JuegoController {
  // deps: { canvas?, inputController?, menuView?, boardView?, tablero? }
  constructor(deps = {}) {
    this.canvas = deps.canvas || null;
    this.menuView = deps.menuView || null;  // vista de menú (debe exponer onMouseMove/onClick/draw)
    this.boardView = deps.boardView || null; // TableroView (onMouseMove/onClick/draw, showGameOver?)
    this.tablero = deps.tablero || null;    // modelo Tablero
    this.tableroController = null;

    this.state = 'menu';
    // Flag: tras volver al menú, el próximo start debe resetear el tablero
    this._resetOnStart = false;
    // Dificultad seleccionada (por defecto normal: 5 min)
    this.difficulty = { key: 'normal', minutes: 5 };

    // Timer (usa el modelo Juego para gestionar tiempo)
    this.juego = deps.juego || new Juego();
    this._timerId = null;

    // Vincular input -> juego
    this.inputController = deps.inputController || null;
    if (this.inputController && typeof this.inputController.establecerControladorJuego === 'function') {
      this.inputController.establecerControladorJuego(this);
    }

    // Si ya tenemos tablero+vista, crear controller del tablero
    if (this.tablero && this.boardView) {
      this._createTableroController(this.tablero, this.boardView);
    }
  }

  // Estado
  getEstado() {
    return this.state;
  }
  setEstado(estado) {
    this.state = estado;
  }

  // Ruteo de input desde InputController
  onMouseMove(x, y) {
    if (this.state === 'menu') {
      if (this.menuView?.hitButton && this.menuView?.setHover) {
        const isHover = this.menuView.hitButton(x, y);
        this.menuView.setHover(isHover);
      }
      if (this.menuView?.hitDifficulty && this.menuView?.setDifficultyHover) {
        const k = this.menuView.hitDifficulty(x, y);
        this.menuView.setDifficultyHover(k);
      }
      if (this.menuView?.draw) this.menuView.draw();
    } else if (this.state === 'jugando' && this.boardView?.onMouseMove) {
      this.boardView.onMouseMove(x, y);
    }
  }

  onClick(x, y) {
    if (this.state === 'menu') {
      // Click en dificultad
      if (this.menuView?.hitDifficulty) {
        const key = this.menuView.hitDifficulty(x, y);
        if (key) {
          this.menuView?.setSelectedDifficulty?.(key);
          // guardar minutos según selección
          this.difficulty = {
            key,
            minutes: key === 'facil' ? 10 : key === 'dificil' ? 3 : 5
          };
          this.menuView?.draw?.();
          return;
        }
      }
      // Click en "JUGAR"
      if (this.menuView?.hitButton && this.menuView.hitButton(x, y)) {
        if (typeof this.menuView.onStart === 'function') {
          this.menuView.onStart();
        }
      }
    } else if (this.state === 'jugando' && this.boardView) {
      // Solo UI en click (no mueve fichas)
      const v = this.boardView;
      // Overlays
      if (v.gameWinMessage && v.menuButtonRect) {
        const r = v.menuButtonRect;
        if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { v.onHome?.(); return; }
      }
      if (v.gameOverMessage && v.retryButtonRect) {
        const r = v.retryButtonRect;
        if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { v.onReset?.(); return; }
      }
      // Iconos
      const h = v._iconHotspots;
      if (h?.home && x >= h.home.x && x <= h.home.x + h.home.w && y >= h.home.y && y <= h.home.y + h.home.h) { v.onHome?.(); return; }
      if (h?.reset && x >= h.reset.x && x <= h.reset.x + h.reset.w && y >= h.reset.y && y <= h.reset.y + h.reset.h) { v.onReset?.(); return; }
      // No hay acción en tablero por click
    }
  }

  // Arrancar juego (puede reusar tablero/boardView o crear nuevos)
  startJuego(tablero, boardView) {
    if (tablero) this.tablero = tablero;
    if (boardView) this.boardView = boardView;

    // Si se volvió al menú, resetear el tablero al layout base antes de jugar
    if (this._resetOnStart && this.tablero?.reiniciarAlLayoutBase) {
      this.tablero.reiniciarAlLayoutBase();
      this._resetOnStart = false;
    }

    this._destroyTableroController();
    // Reiniciar e iniciar timer según dificultad elegida
    this._stopTimer();
    if (typeof this.juego.setTiempoDesdeMinutos === 'function') {
      this.juego.setTiempoDesdeMinutos(this.difficulty.minutes);
    } else {
      // Fallback defensivo
      this.juego.tiempoRestante = (this.difficulty.minutes || 0) * 60;
      this.juego.estado = 'jugando';
    }
    this._syncTimerToView();
    this._startTimer();

    this._createTableroController(this.tablero, this.boardView);
    this.state = 'jugando';
    if (this.boardView?.draw) this.boardView.draw();
  }

  // Volver al menú
  irAlMenu() {
    this.state = 'menu';
    // Marcar que hay que resetear al próximo "Jugar"
    this._resetOnStart = true;
    // Detener timer
    this._stopTimer();
    if (this.menuView?.draw) this.menuView.draw();
  }

  // Limpieza
  destroy() {
    this._destroyTableroController();
    this._stopTimer();
    if (this.inputController && typeof this.inputController.establecerControladorJuego === 'function') {
      this.inputController.establecerControladorJuego(null);
    }
    this.inputController = null;
    this.menuView = null;
    this.boardView = null;
    this.tablero = null;
  }

  // Internos
  _createTableroController(tablero, view) {
    if (!tablero || !view) return;
    this.tableroController = new TableroController(tablero, view, {
      onGameOver: (msg) => this._manejarFinJuego(msg),
      onGameWin:  (msg)  => this._manejarVictoria(msg),
    });
    // Enlazar acciones de la vista (reset/menu) al orquestador
    view.onReset = () => this._resetJuegoYTimer();
    view.onHome = () => this.irAlMenu();
  }

  _destroyTableroController() {
    if (this.tableroController) {
      this.tableroController.destruir();
      this.tableroController = null;
    }
  }

  // Timer: iniciar, detener y tickear
  _startTimer() {
    if (this._timerId) clearInterval(this._timerId);
    this._timerId = setInterval(() => this._tickTimer(), 1000);
  }

  _stopTimer() {
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
  }

  _tickTimer() {
    if (!this.juego || this.state !== 'jugando') return;
    this.juego.tickTimer();
    this._syncTimerToView();
    if (this.juego.estado === 'tiempoAgotado') {
      this._stopTimer();
      this._manejarFinJuego('Tiempo agotado');
    }
  }

  _syncTimerToView() {
    if (!this.boardView) return;
    const secs = this.juego?.tiempoRestante;
    if (typeof this.boardView.setTiempoRestante === 'function') {
      this.boardView.setTiempoRestante(secs);
    } else if (typeof this.boardView.setTimerSeconds === 'function') {
      this.boardView.setTimerSeconds(secs);
    } else {
      this.boardView.tiempoRestante = secs;
    }
    if (this.boardView.draw) this.boardView.draw();
  }

  _manejarFinJuego(msg) {
    // Detener timer en fin de juego
    this._stopTimer();
    // Mostrar mensaje en la vista del tablero
    if (this.boardView) {
      if (typeof this.boardView.showGameOver === 'function') {
        this.boardView.showGameOver(msg);
      } else {
        this.boardView.gameOverMessage = msg;
        if (this.boardView.draw) this.boardView.draw();
      }
    }
  }

  _manejarVictoria(msg) {
    // Detener timer si se gana
    this._stopTimer();
    if (this.boardView) {
      if (typeof this.boardView.showGameWin === 'function') {
        this.boardView.showGameWin(msg || 'Ganaste');
      } else {
        this.boardView.gameWinMessage = msg || 'Ganaste';
        if (this.boardView.draw) this.boardView.draw();
      }
    }
  }

  // Reinicia tablero y timer según la dificultad actual
  _resetJuegoYTimer() {
    this._stopTimer();
    this.juego.setTiempoDesdeMinutos(this.difficulty.minutes);
    this._syncTimerToView();
    if (this.tablero?.reiniciarAlLayoutBase) this.tablero.reiniciarAlLayoutBase();
    if (this.boardView?.clearGameOver) this.boardView.clearGameOver();
    this._startTimer();
    if (this.boardView?.draw) this.boardView.draw();
  }

  /**
   * Reset público invocable desde el InputController (teclado).
   * Respeta el patrón MVC: el Controller decide cuándo y cómo resetear.
   * Solo actúa si se está jugando, para no alterar el estado de menú.
   */
  resetJuego() {
    if (this.state === 'jugando') {
      this._resetJuegoYTimer();
    }
  }

  // Pointer routing desde InputController (estado -> controller)
  onPointerMover(x, y) {
    if (this.state === 'menu') {
      // Hover de botón/dificultad en el menú
      if (this.menuView?.hitButton && this.menuView?.setHover) {
        const isHover = this.menuView.hitButton(x, y);
        this.menuView.setHover(isHover);
      }
      if (this.menuView?.hitDifficulty && this.menuView?.setDifficultyHover) {
        const k = this.menuView.hitDifficulty(x, y);
        this.menuView.setDifficultyHover(k);
      }
      this.menuView?.draw?.();
    } else if (this.state === 'jugando') {
      // Actualizar posición del drag para que la vista dibuje la ficha siguiendo el puntero
      this.tableroController?.arrastreSobreXY?.(x, y);
    }
  }

  onPointerPresionar(x, y) {
    if (this.state === 'menu') {
      // Selección de dificultad
      if (this.menuView?.hitDifficulty) {
        const key = this.menuView.hitDifficulty(x, y);
        if (key) {
          this.menuView?.setSelectedDifficulty?.(key);
          this.difficulty = { key, minutes: key === 'facil' ? 10 : key === 'dificil' ? 3 : 5 };
          this.menuView?.draw?.();
          return;
        }
      }
      // Botón JUGAR
      if (this.menuView?.hitButton?.(x, y)) {
        this.menuView?.onStart?.();
      }
    } else if (this.state === 'jugando' && this.boardView) {
      const v = this.boardView;
      // 1) UI primero (overlays e iconos)
      if (v.gameWinMessage && v.menuButtonRect) {
        const r = v.menuButtonRect;
        if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { v.onHome?.(); return; }
      }
      if (v.gameOverMessage && v.retryButtonRect) {
        const r = v.retryButtonRect;
        if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { v.onReset?.(); return; }
      }
      const h = v._iconHotspots;
      if (h?.home && x >= h.home.x && x <= h.home.x + h.home.w && y >= h.home.y && y <= h.home.y + h.home.h) { v.onHome?.(); return; }
      if (h?.reset && x >= h.reset.x && x <= h.reset.x + h.reset.w && y >= h.reset.y && y <= h.reset.y + h.reset.h) { v.onReset?.(); return; }
      // 2) No fue UI -> iniciar drag en tablero (controlador del tablero)
      this.tableroController?.iniciarArrastreEnXY?.(x, y);
    }
  }

  onPointerSoltar(x, y) {
    if (this.state === 'jugando') {
      this.tableroController?.soltarEnXY?.(x, y);
    }
  }
}
