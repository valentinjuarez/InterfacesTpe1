// js/model/movimiento.js
export class Movimiento {
  constructor(from, over, to) {
    this.from = from; // { r, c } → celda de origen
    this.over = over; // { r, c } → celda saltada
    this.to = to;     // { r, c } → celda destino
  }
}
