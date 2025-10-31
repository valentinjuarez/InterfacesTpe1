// js/main.js
import AppView from './view/appView.js';
import PreGameMenu from './view/preGameMenu.js';
import TableroView from './view/tableroView.js';
import InputController from './controller/inputController.js';
// Estado inicial
let estado = 'menu'; // 'menu' | 'jugando'

// Obtenemos el canvas que ya está en tu HTML
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// Función llamada cuando se hace clic en "JUGAR"
function iniciarJuego() {
  estado = 'jugando';
}

// Creamos las vistas
const menuView = new PreGameMenu(ctx, iniciarJuego);

// TableroView contiene la responsabilidad visual del tablero (estilos aquí, no en main)
const boardView = new TableroView(ctx);

// Composición de la App (AppView orquesta sub-views)
const appView = new AppView(ctx, menuView, boardView, '#5b2def'); // color de fondo queda en AppView param

// InputController se encarga de los eventos del canvas y delega a las views/controllers
// Le pasamos menuView, boardView y un getter del estado para que delegue según pantalla activa
const inputController = new InputController(canvas, menuView, boardView, () => estado);

// Bucle principal
function loop(ts) {
  appView.render(estado, ts || 0);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
