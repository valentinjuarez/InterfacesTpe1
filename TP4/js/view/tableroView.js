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

    // Imágenes de fichas: A (primera) y B (segunda)
    this.pieceImages = [null, null];
    this.setPieceImages(
      'assets/fichaB.png', // ficha A
      'assets/fichaS.png'  // ficha B
    );

    // Asignación estable A/B por identidad de ficha
    this._objIds = new WeakMap();        // ficha(obj) -> id estable
    this._assignCacheObj = new WeakMap(); // ficha(obj) -> 0/1
    this._assignCachePrim = new Map();    // key(string) -> 0/1
    this._nextObjId = 1;
    // Mensaje de fin de juego (null = no mostrar)
    this.gameOverMessage = null;
    // Mensaje de victoria (null = no mostrar)
    this.gameWinMessage = null;
    // Iconos UI (se pueden configurar desde main): rutas relativas dentro de assets/
    this.iconHomeImg = this._mkIcon('assets/iconoHomeJuego.png');
    this.iconResetImg = this._mkIcon('assets/iconoResetJuego.png');
    // Hotspots calculados en draw: {home:{x,y,w,h}, reset:{...}}
    this._iconHotspots = { home: null, reset: null };
    // Callbacks que puede asignar el orquestador (main.js)
    this.onHome = null;   // function() -> volver al menú
    this.onReset = null;  // function() -> reiniciar partida

    // Fondo "jugando"
    this.backgroundImg = null;
    this.setBackgroundImage('assets/fondoPeg.png');

    // Fondo específico del tablero
    this.boardBackgroundImg = null;
    this.setBoardBackgroundImage('assets/tablero.png');

    // Escala del grid (ligeramente menor para que entre en el tablero)
    this.gridScale = 0.86;

    // Relación de padding para fichas/celdas (unificado para base, clip e indicadores)
    this.piecePadRatio = 0.12;

    // Hotspot del botón "Reintentar" en overlay de fin de juego
    this.retryButtonRect = null;
    // Hotspot del botón "Menu principal" en overlay de victoria
    this.menuButtonRect = null;
    // Estado del timer (en segundos). Si es null/undefined, no se dibuja.
    this.tiempoRestante = null;
  }

  // Cargar dos imágenes (URL o Image). Normaliza rutas Windows -> assets/...
  setPieceImages(srcA, srcB) {
    const mk = (src) => {
      if (!src) return null;
      if (src instanceof Image) {
        if (!src.onload) src.onload = () => this.draw();
        return src;
      }
      let s = src;
      if (typeof s === 'string') {
        const m = s.match(/assets[\\/].+$/i);
        if (m) s = m[0].replace(/\\/g, '/');
      }
      const img = new Image();
      img.onload = () => this.draw();
      img.onerror = () => { if (s !== src) { img.onerror = null; img.src = src; } };
      img.src = s;
      return img;
    };
    this.pieceImages[0] = mk(srcA); // A
    this.pieceImages[1] = mk(srcB); // B
  }

  // Cargar iconos UI (home/reset)
  _mkIcon(src) {
    if (!src) return null;
    if (src instanceof Image) return src;
    let s = src;
    const m = s.match(/assets[\\/].+$/i);
    if (m) s = m[0].replace(/\\/g, '/');
    const img = new Image();
    img.src = s;
    return img;
  }

  // Cargar imagen de fondo del canvas (se redibuja al cargar)
  setBackgroundImage(src) {
    if (!src) { this.backgroundImg = null; return; }
    if (src instanceof Image) {
      if (!src.onload) src.onload = () => this.draw();
      this.backgroundImg = src;
      return;
    }
    let s = src;
    if (typeof s === 'string') {
      const m = s.match(/assets[\\/].+$/i);
      if (m) s = m[0].replace(/\\/g, '/');
    }
    const img = new Image();
    img.onload = () => this.draw();
    img.onerror = () => { if (s !== src) { img.onerror = null; img.src = src; } };
    img.src = s;
    this.backgroundImg = img;
  }

  // Cargar imagen de fondo del tablero (se redibuja al cargar)
  setBoardBackgroundImage(src) {
    if (!src) { this.boardBackgroundImg = null; return; }
    if (src instanceof Image) {
      if (!src.onload) src.onload = () => this.draw();
      this.boardBackgroundImg = src;
      return;
    }
    let s = src;
    if (typeof s === 'string') {
      const m = s.match(/assets[\\/].+$/i);
      if (m) s = m[0].replace(/\\/g, '/');
    }
    const img = new Image();
    img.onload = () => this.draw();
    img.onerror = () => { if (s !== src) { img.onerror = null; img.src = src; } };
    img.src = s;
    this.boardBackgroundImg = img;
  }

  // Hash simple para claves primitivas (estable)
  _hashKey(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return h >>> 0;
  }

  // Devuelve 0 (A) o 1 (B) de forma estable por ficha
  _getAssignedImageIndex(ficha) {
    const imgsCount = this.pieceImages.filter(Boolean).length;
    if (imgsCount < 2) return 0;

    if (ficha && typeof ficha === 'object') {
      if (this._assignCacheObj.has(ficha)) return this._assignCacheObj.get(ficha);
      let id = this._objIds.get(ficha);
      if (!id) { id = this._nextObjId++; this._objIds.set(ficha, id); }
      const idx = id % 2; // reparte 50/50 aprox y es estable
      this._assignCacheObj.set(ficha, idx);
      return idx;
    } else {
      const key = String(ficha);
      if (this._assignCachePrim.has(key)) return this._assignCachePrim.get(key);
      const idx = this._hashKey(key) & 1; // 0/1 estable por valor
      this._assignCachePrim.set(key, idx);
      return idx;
    }
  }

  // Helper: padding (en px) a partir del tamaño de celda y la razón configurada
  _pad(cellW, cellH) {
    return Math.min(cellW, cellH) * (this.piecePadRatio ?? 0.12);
  }

  // Helper: parámetros del círculo de celda centrado y ajustado al padding
  _cellCircleParams(x, y, cellW, cellH) {
    const pad = this._pad(cellW, cellH);
    const iw = cellW - pad * 2;
    const ih = cellH - pad * 2;
    const cx = x + cellW / 2;
    const cy = y + cellH / 2;
    const radius = Math.min(iw, ih) / 2;
    return { cx, cy, radius };
  }

  // Helper: calcula métricas de tablero y grid (coinciden con _metrics para input)
  _computeBoardAndGrid(w, h) {
    const boardSize = Math.min(w, h) * 0.8;
    const oxBoard = (w - boardSize) / 2;
    const oyBoard = (h - boardSize) / 2;

    const gridScale = Math.max(0.85, Math.min(1.0, this.gridScale || 0.94));
    const gridSize = boardSize * gridScale;
    const ox = oxBoard + (boardSize - gridSize) / 2;
    const oy = oyBoard + (boardSize - gridSize) / 2;

    return { boardSize, oxBoard, oyBoard, gridSize, ox, oy };
  }

  // Helper: dibuja el fondo del tablero (imagen)
  _drawBoardBackground(ctx, oxBoard, oyBoard, boardSize) {
    const bx = oxBoard - 8, by = oyBoard - 0, bw = boardSize + 20, bh = boardSize + 20;
    if (this.boardBackgroundImg && this.boardBackgroundImg.complete && this.boardBackgroundImg.naturalWidth > 0) {
      try { ctx.drawImage(this.boardBackgroundImg, bx, by, bw, bh); } catch (e) {}
    } else {
      ctx.fillStyle = '#2b2b2b';
      ctx.fillRect(bx, by, bw, bh);
    }
  }

  // Dibujar imagen recortada en círculo (usa el mismo padding que las celdas)
  _drawPieceImage(ctx, x, y, cellW, cellH, img) {
    const pad = this._pad(cellW, cellH);
    const iw = cellW - pad * 2;
    const ih = cellH - pad * 2;
    const cx = x + cellW / 2;
    const cy = y + cellH / 2;
    const radius = Math.min(iw, ih) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, cx - iw / 2, cy - ih / 2, iw, ih);
    ctx.restore();
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

    // Configuración de dibujo del tablero (centrado y fondo)
    ctx.clearRect(0, 0, w, h);
    if (this.backgroundImg && this.backgroundImg.complete && this.backgroundImg.naturalWidth > 0) {
      try { ctx.drawImage(this.backgroundImg, 0, 0, w, h); } catch (e) {}
    }

    const dims = this.tablero.dimensiones();
    const rows = dims.rows;
    const cols = dims.cols;

    // Métricas de tablero y grid
    const { boardSize, oxBoard, oyBoard, gridSize, ox, oy } = this._computeBoardAndGrid(w, h);
    const cellW = gridSize / cols;
    const cellH = gridSize / rows;

    this._drawBoardBackground(ctx, oxBoard, oyBoard, boardSize);

    // Cache de drag para el frame actual
    const dragging = this.controller?.dragging || null;
    const dragFrom = dragging?.from;

    // Iterar celdas desde el modelo
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const celda = this.tablero.getCelda(r, c);
        const x = ox + c * cellW;
        const y = oy + r * cellH;
        if (!celda || celda.estado === 'invalida') continue;

        // Base
        const { cx, cy, radius } = this._cellCircleParams(x, y, cellW, cellH);
        ctx.fillStyle = '#201b1bff';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Ficha (omitir dibujo en la celda origen mientras se arrastra)
        if (celda.ficha !== null && !(dragFrom && dragFrom.r === r && dragFrom.c === c)) {
          const imgs = this.pieceImages.filter(Boolean);
          const idx = this._getAssignedImageIndex(celda.ficha);
          const pick = imgs[Math.min(idx, imgs.length - 1)];
          if (pick && pick.complete && pick.naturalWidth > 0) {
            this._drawPieceImage(ctx, x, y, cellW, cellH, pick);
          } else {
            ctx.beginPath();
            ctx.fillStyle = '#777';
            ctx.arc(cx, cy, Math.min(radius, Math.max(2, radius * 0.9)), 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
          }
        }
      }
    }

    // Resaltados (selección y movimientos) delegados por el controller
    if (this.controller) {
      const sel = this.controller.selected;
      const moves = this.controller.legalMoves || [];
      if (sel) {
        const sx = ox + sel.c * cellW;
        const sy = oy + sel.r * cellH;
        const { cx, cy, radius } = this._cellCircleParams(sx, sy, cellW, cellH);
        ctx.strokeStyle = '#ffd60a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,214,10,0.45)';
      for (let i = 0; i < moves.length; i++) {
        const m = moves[i];
        const mx = ox + m.to.c * cellW;
        const my = oy + m.to.r * cellH;
        const { cx, cy, radius } = this._cellCircleParams(mx, my, cellW, cellH);
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(2, radius - 2), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Dibujo de la ficha arrastrada siguiendo el puntero (sobre todo lo demás)
    if (dragging && dragging.pos) {
      const ficha = dragging.ficha ?? (dragFrom ? this.tablero.getCelda(dragFrom.r, dragFrom.c)?.ficha : null);
      if (ficha != null) {
        const imgs = this.pieceImages.filter(Boolean);
        const idx = this._getAssignedImageIndex(ficha);
        const pick = imgs[Math.min(idx, imgs.length - 1)];
        if (pick && pick.complete && pick.naturalWidth > 0) {
          const topLeftX = dragging.pos.x - cellW / 2;
          const topLeftY = dragging.pos.y - cellH / 2;
          ctx.save();
          ctx.globalAlpha = 0.98;
          ctx.shadowColor = 'rgba(0,0,0,0.35)';
          ctx.shadowBlur = Math.max(4, Math.min(cellW, cellH) * 0.12);
          this._drawPieceImage(ctx, topLeftX, topLeftY, cellW, cellH, pick);
          ctx.restore();
        }
      }
    }

    // Dibujar badge de timer arriba-izquierda si hay tiempo disponible
    if (this.tiempoRestante != null && isFinite(this.tiempoRestante)) {
      const label = this._formatMMSS(Math.max(0, Math.floor(this.tiempoRestante)));
      const pad = Math.max(8, Math.min(w, h) * 0.015);
      const bx = pad, by = pad;
      ctx.save();
      ctx.font = 'bold 22px Arial';
      const tw = ctx.measureText(label).width;
      const bw = Math.max(86, tw + 24);
      const bh = 34;

      // Fondo del badge
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      this._roundedRect(ctx, bx, by, bw, bh, bh / 2, true, false);
      // Borde sutil
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      this._roundedRect(ctx, bx, by, bw, bh, bh / 2, false, true);

      // Texto mm:ss
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, bx + bw / 2, by + bh / 2);
      ctx.restore();
    }

    // Overlay de victoria (verde)
    if (this.gameWinMessage) {
      this.menuButtonRect = null; // reset
      const w = ctx.canvas.width, h = ctx.canvas.height;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, w, h);

      const panelW = Math.min(460, w * 0.7);
      const panelH = 180;
      const px = Math.round((w - panelW) / 2);
      const py = Math.round((h - panelH) / 2);

      ctx.fillStyle = '#1f2a1f';
      ctx.strokeStyle = '#9cff9c';
      ctx.lineWidth = 2;
      ctx.fillRect(px, py, panelW, panelH);
      ctx.strokeRect(px, py, panelW, panelH);

      // Título verde
      ctx.fillStyle = '#2ecc71';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('Fin del juego', Math.round(w / 2), py + 16);

      // Subtítulo "Ganaste"
      ctx.fillStyle = '#e8ffe8';
      ctx.font = '16px Arial';
      ctx.textBaseline = 'top';
      ctx.fillText(String(this.gameWinMessage || 'Ganaste'), Math.round(w / 2), py + 54);

      // Botón “Menu principal”
      const bw = 220, bh = 44;
      const bx = Math.round(w / 2 - bw / 2);
      const by = py + panelH - bh - 16;
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = '#2ecc71';
      ctx.font = 'bold 18px Arial';
      ctx.textBaseline = 'middle';
      ctx.fillText('Menu principal', Math.round(w / 2), by + bh / 2);

      this.menuButtonRect = { x: bx, y: by, w: bw, h: bh };
      ctx.restore();

      // No dibujar overlay de derrota si hay victoria
      this.retryButtonRect = null;
      return;
    }

    // Si hay mensaje de fin de juego (derrota), dibujar overlay rojo
    if (this.gameOverMessage) {
      this.retryButtonRect = null; // reset
      ctx.save();
      // Fondo semitransparente
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, w, h);

      // Panel central
      const panelW = Math.min(460, w * 0.7);
      const panelH = 180;
      const px = Math.round((w - panelW) / 2);
      const py = Math.round((h - panelH) / 2);
      ctx.fillStyle = '#222';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.fillRect(px, py, panelW, panelH);
      ctx.strokeRect(px, py, panelW, panelH);

      // Título (rojo)
      ctx.fillStyle = '#ff3b3b';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('Fin del juego', Math.round(w / 2), py + 16);

      // Subtítulo (causa)
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textBaseline = 'top';
      ctx.fillText(String(this.gameOverMessage), Math.round(w / 2), py + 54);

      // Botón “Reintentar” (detalles rojos)
      const bw = 180, bh = 44;
      const bx = Math.round(w / 2 - bw / 2);
      const by = py + panelH - bh - 16;
      ctx.strokeStyle = '#ff3b3b';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = '#ff3b3b';
      ctx.font = 'bold 18px Arial';
      ctx.textBaseline = 'middle';
      ctx.fillText('Reintentar', Math.round(w / 2), by + bh / 2);

      // Guardar hotspot del botón
      this.retryButtonRect = { x: bx, y: by, w: bw, h: bh };

      ctx.restore();
    } else {
      this.retryButtonRect = null;
      this.menuButtonRect = null;
    }

    // Dibujar iconos UI en la esquina superior derecha (si existen)
    try {
      const padding = Math.max(8, Math.min(w, h) * 0.015);
      const iconSize = Math.min(56, Math.max(32, Math.floor(Math.min(w, h) * 0.07)));
      // Posicionar: home a la derecha, reset a su izquierda
      const spacing = 8;
      const rightX = w - padding;
      const homeX = rightX - iconSize; // x position of home icon (left)
      const homeY = padding;
      const resetX = homeX - spacing - iconSize; // reset to the left of home
      const resetY = padding;

      // Dibujar reset
      if (this.iconResetImg && this.iconResetImg.complete && this.iconResetImg.naturalWidth > 0) {
        ctx.drawImage(this.iconResetImg, resetX, resetY, iconSize, iconSize);
      } else {
        // fallback: rectángulo simple
        ctx.fillStyle = '#444';
        ctx.fillRect(resetX, resetY, iconSize, iconSize);
      }
      // Dessine home
      if (this.iconHomeImg && this.iconHomeImg.complete && this.iconHomeImg.naturalWidth > 0) {
        ctx.drawImage(this.iconHomeImg, homeX, homeY, iconSize, iconSize);
      } else {
        ctx.fillStyle = '#444';
        ctx.fillRect(homeX, homeY, iconSize, iconSize);
      }

      // Actualizar hotspots para detección de clicks
      this._iconHotspots.reset = { x: resetX, y: resetY, w: iconSize, h: iconSize };
      this._iconHotspots.home = { x: homeX, y: homeY, w: iconSize, h: iconSize };
    } catch (e) {
      // En entornos restringidos, no bloquear el dibujo principal
    }
  }

  // --- Timer API para el controller ---
  setTiempoRestante(segs) {
    this.tiempoRestante = Math.max(0, Math.floor(Number(segs) || 0));
  }
  // Alias por compatibilidad
  setTimerSeconds(segs) {
    this.setTiempoRestante(segs);
  }

  // Formato mm:ss
  _formatMMSS(total) {
    const mm = Math.floor(total / 60);
    const ss = total % 60;
    const s2 = ss < 10 ? '0' + ss : String(ss);
    return `${mm}:${s2}`;
  }

  // Utilidad: rectángulo redondeado
  _roundedRect(ctx, x, y, w, h, r, fill = false, stroke = false) {
    const radius = typeof r === 'number' ? { tl: r, tr: r, br: r, bl: r } : (r || { tl: 0, tr: 0, br: 0, bl: 0 });
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + w - radius.tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius.tr);
    ctx.lineTo(x + w, y + h - radius.br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius.br, y + h);
    ctx.lineTo(x + radius.bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // Calcula métricas del tablero (misma lógica usada en draw)
  _metrics() {
    // Mantener consistencia con draw(): usar misma escala y centrado
    const ctx = this.ctx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const dims = this.tablero ? this.tablero.dimensiones() : { rows: 7, cols: 7 };
    const rows = dims.rows;
    const cols = dims.cols;

    const boardSize = Math.min(w, h) * 0.8;
    const gridScale = Math.max(0.85, Math.min(1.0, this.gridScale || 0.94));
    const gridSize = boardSize * gridScale;
    const ox = (w - gridSize) / 2;
    const oy = (h - gridSize) / 2;
    const cellW = gridSize / cols;
    const cellH = gridSize / rows;
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

  // Mostrar mensaje de victoria y forzar redraw
  showGameWin(msg) {
    this.gameWinMessage = String(msg || 'Ganaste');
    this.gameOverMessage = null;
    this.draw();
  }

  // Mostrar mensaje de fin de juego (derrota) y forzar redraw
  showGameOver(msg) {
    this.gameOverMessage = String(msg || 'Fin del juego');
    this.draw();
  }

  // Limpiar mensajes de overlays
  clearGameOver() {
    this.gameOverMessage = null;
    this.gameWinMessage = null;
    this.draw();
  }
}
