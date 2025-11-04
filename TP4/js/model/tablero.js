// MVC: Model
// Responsabilidad: almacenar estado del tablero y aplicar reglas del juego.
// - No debe dibujar ni manejar eventos DOM.
// - Proveer API pura (getCelda, movimientosLegalesDesde, aplicarMovimiento, dimensiones, etc.)

import Celda from './celda.js';
import Ficha from './ficha.js';
import { Movimiento } from './movimiento.js';

const CELL_INVALID = -1;
const CELL_EMPTY = 0;

// Direcciones ortogonales (der, izq, abajo, arriba)
const DIRS = [
  { dr: 0, dc: 1 },
  { dr: 0, dc: -1 },
  { dr: 1, dc: 0 },
  { dr: -1, dc: 0 },
];

export default class Tablero {
  constructor(layoutInicial) {
    this.grid = [];
    this.rows = 0;
    this.cols = 0;
    this._idSeq = 1; // para asignar ids de ficha
    // Layout base recordado (último usado en reiniciar)
    this._layoutBase = null;
    const base = Array.isArray(layoutInicial) ? layoutInicial : Tablero.layoutClasico7x7();
    this.reiniciar(base);
  }

  // ---------- Inicialización ----------
  reiniciar(layoutMatriz) {
    // Recordar el layout base para futuros reinicios
    this._layoutBase = layoutMatriz;

    this.rows = layoutMatriz.length;
    this.cols = this.rows > 0 ? layoutMatriz[0].length : 0;
    this.grid = [];
    this._idSeq = 1;

    let r = 0;
    while (r < this.rows) {
      const fila = [];
      let c = 0;
      while (c < this.cols) {
        const val = layoutMatriz[r][c];
        let celda = null;

        if (val === CELL_INVALID) {
          celda = new Celda(r, c, 'invalida');
        } else {
          celda = new Celda(r, c, 'vacia');
          if (val > CELL_EMPTY) {
            const ficha = new Ficha(this._idSeq, val); // val puede representar el tipo/skin
            this._idSeq = this._idSeq + 1;
            celda.ficha = ficha;
            celda.estado = 'ocupada';
          }
        }

        fila.push(celda);
        c = c + 1;
      }
      this.grid.push(fila);
      r = r + 1;
    }
  }
   // ---------- Preset clásico 7x7 ----------
  static layoutClasico7x7() {
    // -1 inválida, 0 vacía, 1 con ficha (centro vacío)
    return [
      [-1, -1, 1, 1, 1, -1, -1],
      [-1, -1, 1, 1, 1, -1, -1],
      [ 1,  1, 1, 1, 1,  1,  1],
      [ 1,  1, 1, 0, 1,  1,  1],
      [ 1,  1, 1, 1, 1,  1,  1],
      [-1, -1, 1, 1, 1, -1, -1],
      [-1, -1, 1, 1, 1, -1, -1],
    ];
  }

  // Nuevo preset: tablero casi resuelto (una jugada para ganar)
  static layoutCasiResuelto7x7() {
    // Movimiento ganador: (3,1) salta sobre (3,2) hacia (3,3)
    return [
      [-1, -1, 0, 0, 0, -1, -1],
      [-1, -1, 0, 0, 0, -1, -1],
      [ 0,  0, 0, 0, 0,  0,  0],
      [ 0,  1, 1, 0, 0,  0,  0],
      [ 0,  0, 0, 0, 0,  0,  0],
      [-1, -1, 0, 0, 0, -1, -1],
      [-1, -1, 0, 0, 0, -1, -1],
    ];
  }

  // Permite reiniciar al último layout base usado (clásico o "casi resuelto")
  reiniciarAlLayoutBase() {
    if (this._layoutBase) {
      this.reiniciar(this._layoutBase);
    }
  }

  // ---------- Utilidades ----------
  esCoordDentro(r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  }

  esCoordValida(r, c) {
        let valida = false;
        if (this.esCoordDentro(r, c)) {
        const celda = this.getCelda(r, c);
        valida = celda.estado !== 'invalida';
        }
        return valida;
  }
    getCelda(r, c) {
        let celda = null;
        if (this.esCoordDentro(r, c)) {
        celda = this.grid[r][c];
        }
        return celda;
  }
   
  
    setFichaEn(r, c, ficha) {
    const celda = this.getCelda(r, c);

    // Solo actúa si la celda existe, es válida y ficha no es null
    if (celda !== null && celda.estado !== 'invalida') {
      if (ficha !== null) {
        celda.ficha = ficha;
        celda.estado = 'ocupada';
      }
    }
  }

  quitarFichaEn(r, c) {
    const celda = this.getCelda(r, c);

    // Solo actúa si la celda existe, es válida y tiene una ficha
    if (celda !== null && celda.estado !== 'invalida') {
      if (celda.ficha !== null) {
        celda.ficha = null;
        celda.estado = 'vacia';
      }
    }
  }



  // ---------- Reglas ----------
  movimientosLegalesDesde(r, c) {
    const lista = [];
    const origen = this.getCelda(r, c);

    let puedeCalcular = false;
    if (origen !== null) {
      if (origen.estado !== 'invalida') {
        if (origen.ficha !== null) {
          puedeCalcular = true;
        }
      }
    }

    if (puedeCalcular) {
      let i = 0;
      while (i < DIRS.length) {
        const d = DIRS[i];
        const overR = r + d.dr;
        const overC = c + d.dc;
        const toR = r + 2 * d.dr;
        const toC = c + 2 * d.dc;

        const valOver = this.esCoordValida(overR, overC);
        const valTo = this.esCoordValida(toR, toC);

        if (valOver && valTo) {
          const over = this.getCelda(overR, overC);
          const dest = this.getCelda(toR, toC);

          let condOver = false;
          let condDest = false;

          if (over !== null) {
            if (over.estado !== 'invalida') {
              if (over.ficha !== null) {
                condOver = true;
              }
            }
          }
          if (dest !== null) {
            if (dest.estado !== 'invalida') {
              if (dest.ficha === null) {
                condDest = true;
              }
            }
          }

          if (condOver && condDest) {
            const mov = new Movimiento(
              { r: r, c: c },
              { r: overR, c: overC },
              { r: toR, c: toC }
            );
            lista.push(mov);
          }
        }
        i = i + 1;
      }
    }

    return lista;
    // (no se usan returns dentro de bucles)
  }

  aplicarMovimiento(mov) {
    const from = this.getCelda(mov.from.r, mov.from.c);
    const over = this.getCelda(mov.over.r, mov.over.c);
    const to = this.getCelda(mov.to.r, mov.to.c);

    let pieza = null;
    if (from !== null) {
      pieza = from.ficha;
    }

    if (to !== null && to.estado !== 'invalida') {
      to.ficha = pieza;
      to.estado = pieza === null ? 'vacia' : 'ocupada';
    }

    if (from !== null && from.estado !== 'invalida') {
      from.ficha = null;
      from.estado = 'vacia';
    }

    if (over !== null && over.estado !== 'invalida') {
      over.ficha = null;
      over.estado = 'vacia';
    }
  }

  hayMovimientosPosibles() {
    let hay = false;
    let r = 0;
    while (r < this.rows) {
      let c = 0;
      while (c < this.cols) {
        const celda = this.grid[r][c];
        let candidata = false;

        if (celda.estado !== 'invalida') {
          if (celda.ficha !== null) {
            candidata = true;
          }
        }

        if (candidata) {
          const moves = this.movimientosLegalesDesde(r, c);
          if (moves.length > 0) {
            hay = true;
          }
        }

        c = c + 1;
      }
      r = r + 1;
    }
    return hay;
  }

  contarFichas() {
    let cnt = 0;
    let r = 0;
    while (r < this.rows) {
      let c = 0;
      while (c < this.cols) {
        const celda = this.grid[r][c];
        if (celda.estado !== 'invalida') {
          if (celda.ficha !== null) {
            cnt = cnt + 1;
          }
        }
        c = c + 1;
      }
      r = r + 1;
    }
    return cnt;
  }

  dimensiones() {
    return { rows: this.rows, cols: this.cols };
  }

  
}

