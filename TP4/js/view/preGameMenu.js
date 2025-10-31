export default class PreGameMenu {
  // Clase que representa el menú previo al inicio del juego (pantalla con título y botón "JUGAR")
  constructor(ctx, onStart) {
    this.ctx = ctx;           // contexto 2D del canvas donde se dibuja el menú
    this.onStart = onStart;   // callback que se ejecuta cuando se pulsa el botón de iniciar

    this.w = ctx.canvas.width;  // ancho del canvas
    this.h = ctx.canvas.height; // alto del canvas

    // botón centrado y estado hover mínimo
    // btn guarda la posición y tamaño del rectángulo clicable del botón
    this.btn = { x: this.w / 2 - 110, y: this.h / 2 + 30, w: 220, h: 60 };
    this.hover = false; // indica si el cursor está sobre el botón
  }

  // Actualiza el estado hover en función de la posición del ratón
  onMouseMove(mouseX, mouseY) {
    const b = this.btn;
    this.hover = mouseX >= b.x && mouseX <= b.x + b.w &&
                 mouseY >= b.y && mouseY <= b.y + b.h;
  }

  // Maneja el evento de click: si se hizo click dentro del botón, ejecuta el callback onStart
  onClick(mouseX, mouseY) {
    const b = this.btn;
    if (mouseX >= b.x && mouseX <= b.x + b.w &&
        mouseY >= b.y && mouseY <= b.y + b.h) {
      this.onStart();
    }
  }

  // Dibuja el menú en el canvas: título, botón y texto del botón
  draw() {
    const ctx = this.ctx;

    // Título
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 56px Arial';
    // Texto grande centrado en la mitad superior de la pantalla
    ctx.fillText('Peg Solitaire', this.w / 2, this.h / 2 - 60);

    // Botón simple
    const b = this.btn;
    // Color del botón cambia si está en estado hover
    ctx.fillStyle = this.hover ? '#ffd60a' : '#ffb703';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(b.x, b.y, b.w, b.h);

    // Texto del botón
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 26px Arial';
    // Texto centrado dentro del rectángulo del botón
    ctx.fillText('JUGAR', b.x + b.w / 2, b.y + b.h / 2);
  }
}
