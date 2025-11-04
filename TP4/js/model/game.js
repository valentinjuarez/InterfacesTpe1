import Tablero from './tablero.js';

export default class Juego {
  constructor() {
    this.tablero = new Tablero();     // Modelo de tablero 7x7
    this.estado = 'jugando';          // "jugando", "ganado", "sinMovidas", "tiempoAgotado"
    this.seleccion = null;            // {r, c} cuando el jugador selecciona una ficha
    this.tiempoRestante = 180;        // Segundos de partida
  }

  // Reinicia el juego
  reiniciar() {
    this.tablero.reiniciar(Tablero.layoutClasico7x7());
    this.estado = 'jugando';
    this.seleccion = null;
    this.tiempoRestante = 180;
  }

  // Selecciona una ficha (por click o drag)
  seleccionar(r, c) {
    const celda = this.tablero.getCelda(r, c);
    const puedeSeleccionar = (
      celda !== null &&
      celda.estado !== 'invalida' &&
      celda.ficha !== null
    );

    if (puedeSeleccionar) {
      this.seleccion = { r, c };
    }
  }

  // Helpers de tiempo
  setTiempoRestante(segundos) {
    // Setea el tiempo restante y vuelve a estado "jugando"
    const s = Math.max(0, Math.floor(Number(segundos) || 0));
    this.tiempoRestante = s;
    this.estado = 'jugando';
  }

  setTiempoDesdeMinutos(minutos) {
    const m = Math.max(0, Math.floor(Number(minutos) || 0));
    this.setTiempoRestante(m * 60);
  }

  getTiempoRestante() {
    return this.tiempoRestante;
  }

  isTiempoAgotado() {
    return this.estado === 'tiempoAgotado';
  }

  // Intenta soltar la ficha seleccionada en una nueva posición
  intentarSoltar(rDestino, cDestino) {
    const haySeleccion = this.seleccion !== null;
    if (haySeleccion) {
      const rOrigen = this.seleccion.r;
      const cOrigen = this.seleccion.c;

      const movimientos = this.tablero.movimientosLegalesDesde(rOrigen, cOrigen);
      let i = 0;
      let movimientoValido = null;

      while (i < movimientos.length) {
        const mov = movimientos[i];
        const coincideDestino = mov.to.r === rDestino && mov.to.c === cDestino;
        if (coincideDestino) {
          movimientoValido = mov;
        }
        i = i + 1;
      }

      if (movimientoValido !== null) {
        this.tablero.aplicarMovimiento(movimientoValido);
        this._verificarEstadoDelJuego();
      }

      // Limpia la selección siempre (valido o no)
      this.seleccion = null;
    }
  }

  // Verifica si el juego terminó (por victoria o bloqueo)
  _verificarEstadoDelJuego() {
    if (this.ganoElJuego()) {
      this.estado = 'ganado';
    } else {
      const hayMovimientos = this.tablero.hayMovimientosPosibles();
      if (hayMovimientos === false) {
        this.estado = 'sinMovidas';
      }
    }
  }

  // Condición de victoria (una ficha en el centro)
  ganoElJuego() {
    const fichasRestantes = this.tablero.contarFichas();
    const celdaCentral = this.tablero.getCelda(3, 3);
    const unaFichaEnCentro = celdaCentral !== null && celdaCentral.ficha !== null;
    const gano = fichasRestantes === 1 && unaFichaEnCentro;
    return gano;
  }

  // Actualiza el tiempo restante (si implementás un timer en la vista)
  tickTimer() {
    const sigueJugando = this.estado === 'jugando';
    if (sigueJugando) {
      this.tiempoRestante = Math.max(0, this.tiempoRestante - 1);
      if (this.tiempoRestante <= 0) {
        this.estado = 'tiempoAgotado';
      }
    }
  }

  // Retorna true si la partida ya finalizó
  estaTerminado() {
    const terminado = this.estado !== 'jugando';
    return terminado;
  }
}
