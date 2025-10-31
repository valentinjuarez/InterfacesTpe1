// js/view/tableroView.js
// MVC: View
// Responsabilidad: renderizar el tablero y elementos visuales, y mapear coordenadas (x,y) -> (r,c).
// - No debe contener reglas del juego (solo puede pedir al controller acciones y leer estado del modelo).
// - Puede mantener pequeños estados visuales (hover, animaciones) pero no lógica de negocio.

export default class TableroView {
  // Recibe el contexto y opcionalmente el modelo (tablero) y controller
  constructor(ctx, tablero = null, controller = null) {
    this.ctx = ctx;
    this.tablero = tablero;       // modelo Tablero
    this.controller = controller; // controller (opcional) para selección/targets
    this.hoverCell = null;       // celda bajo el cursor (r,c) o null
  }

  // Dibuja el tablero según el modelo; si no hay modelo dibuja un placeholder
  draw(timestamp) {
    const ctx = this.ctx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Si no hay modelo, mantener el placeholder simple
    if (!this.tablero) {
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect((w - 360) / 2, (h - 360) / 2, 360, 360);
      ctx.fillStyle = '#fff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Aquí irá el tablero', w / 2, h / 2);
      return;
    }

    // Configuración de dibujo del tablero (centrado y margen)
    ctx.clearRect(0, 0, w, h);
    const dims = this.tablero.dimensiones();
    const rows = dims.rows;
    const cols = dims.cols;
    const boardSize = Math.min(w, h) * 0.8;
    const cellW = boardSize / cols;
    const cellH = boardSize / rows;
    const ox = (w - boardSize) / 2;
    const oy = (h - boardSize) / 2;

    // Fondo del tablero
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(ox - 8, oy - 8, boardSize + 16, boardSize + 16);

    // Iterar celdas desde el modelo
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const celda = this.tablero.getCelda(r, c);
        const x = ox + c * cellW;
        const y = oy + r * cellH;

        // Celdas inválidas: no dibujar ficha, solo sombreado
        if (!celda || celda.estado === 'invalida') {
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x, y, cellW, cellH);
          continue;
        }

        // Dibujar casilla base
        ctx.fillStyle = '#cfcfcf';
        ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);

        // Si hay ficha, dibujar un círculo
        if (celda.ficha !== null) {
          ctx.beginPath();
          const cx = x + cellW / 2;
          const cy = y + cellH / 2;
          const radius = Math.min(cellW, cellH) * 0.34;
          ctx.fillStyle = '#004e89'; // color ficha
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.closePath();
        }
      }
    }

    // Resaltar selección y movimientos legales si el controller está presente
    if (this.controller) {
      const sel = this.controller.selected;
      const moves = this.controller.legalMoves || [];

      // Resaltar selección
      if (sel) {
        ctx.strokeStyle = '#ffd60a';
        ctx.lineWidth = 4;
        const x = ox + sel.c * cellW;
        const y = oy + sel.r * cellH;
        ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);
      }

      // Resaltar destinos legales (to)
      ctx.fillStyle = 'rgba(255,214,10,0.45)';
      for (let i = 0; i < moves.length; i++) {
        const m = moves[i];
        const tr = m.to.r, tc = m.to.c;
        const x = ox + tc * cellW;
        const y = oy + tr * cellH;
        ctx.fillRect(x + 4, y + 4, cellW - 8, cellH - 8);
      }
    }
 }

  // Calcula métricas del tablero (misma lógica usada en draw)
  _metrics() {
    const ctx = this.ctx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const dims = this.tablero ? this.tablero.dimensiones() : { rows: 7, cols: 7 };
    const rows = dims.rows;
    const cols = dims.cols;
    const boardSize = Math.min(w, h) * 0.8;
    const cellW = boardSize / cols;
    const cellH = boardSize / rows;
    const ox = (w - boardSize) / 2;
    const oy = (h - boardSize) / 2;
    return { ox, oy, cellW, cellH, rows, cols };
  }

  // Convierte coordenadas del canvas (x,y) a índices de celda {r,c} o null
  cellAt(x, y) {
    if (!this.tablero) return null;
    const m = this._metrics();
    const cx = Math.floor((x - m.ox) / m.cellW);
    const cr = Math.floor((y - m.oy) / m.cellH);
    if (cx >= 0 && cx < m.cols && cr >= 0 && cr < m.rows) {
      return { r: cr, c: cx };
    }
    return null;
  }

  // Handler llamado por InputController con coordenadas ya escaladas al canvas
  onClick(x, y) {
    const cell = this.cellAt(x, y);
    if (!cell) return;
    // Delegar acción al controller (éste maneja lógica de selección/movimiento)
    if (this.controller && typeof this.controller.handleCellActivated === 'function') {
      this.controller.handleCellActivated(cell.r, cell.c);
    }
  }

  // Mostrar hover para feedback visual
  onMouseMove(x, y) {
    const cell = this.cellAt(x, y);
    const changed = JSON.stringify(cell) !== JSON.stringify(this.hoverCell);
    if (changed) {
      this.hoverCell = cell;
      // opcional: la vista ya redibuja selección/destinos; usamos draw para actualizar hover
      this.draw();
    }
  }
}
