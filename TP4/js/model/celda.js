// js/model/celda.js
export default class Celda {
  constructor(fila, columna, estado = 'vacia') {
    this.fila = fila;
    this.columna = columna;
    this.estado = estado; // "vacia", "ocupada" o "invalida"
    this.ficha = null;    // instancia de Ficha o null
  }

  estaVacia() {
    return this.ficha === null;
  }

  esValida() {
    return this.estado !== 'invalida';
  }

  tieneFicha() {
    return this.ficha !== null;
  }
}
