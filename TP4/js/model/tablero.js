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
    const base = Array.isArray(layoutInicial) ? layoutInicial : Tablero.layoutClasico7x7();
    this.reiniciar(base);
  }

  // ---------- Inicialización ----------
  reiniciar(layoutMatriz) {
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
    if (celda !== null && celda.estado !== 'invalida') {
      celda.ficha = ficha;
      celda.estado = ficha === null ? 'vacia' : 'ocupada';
    }
  }
    quitarFichaEn(r, c) {
    const celda = this.getCelda(r, c);
    if (celda !== null && celda.estado !== 'invalida') {
      celda.ficha = null;
      celda.estado = 'vacia';
        }
    }
}