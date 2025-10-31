// js/model/ficha.js
export default class Ficha {
  constructor(id, tipo = 1) {
    this.id = id;       // número único
    this.tipo = tipo;   // tipo o skin (puede usarse para sprites distintos)
  }
}
