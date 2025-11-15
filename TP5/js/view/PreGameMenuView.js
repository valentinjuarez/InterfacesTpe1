export class PreGameMenuView {
  constructor({ canvas, imageSrc } = {}) {
    this.canvas = canvas || null;
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;

    // Fondo
    this.imageSrc = imageSrc || "assets/FlappyBird/FondoPreGame/FondoPreGame.png";
    this.image = new Image();
    this.imageLoaded = false;

    // Estado visual (se actualiza desde el Controller)
    this.state = {
      selectedDifficulty: 'normal',
      hoveredDifficulty: null,
      selectedMap: null,
      hoveredMap: null,
      playButtonHovered: false
    };

    // Layout/HitAreas
    this.layout = null; // se recalcula en cada render
    this.hitAreas = { difficulties: [], maps: [], play: null };

    // Estilos
    this.theme = {
      titleColor: "#FFFFFF",
      titleShadow: "rgba(0,0,0,0.6)",
      btnFill: "rgba(0,0,0,0.45)",
      btnHoverFill: "rgba(255,255,255,0.15)",
      btnText: "#FFFFFF",
      btnStroke: "rgba(255,255,255,0.5)",
      btnHoverStroke: "rgba(255,255,255,0.9)",
      selectedFill: "rgba(255, 213, 79, 0.2)",
      selectedStroke: "#FFD54F",
      mapFill: "rgba(0,0,0,0.35)",
      mapHoverFill: "rgba(255,255,255,0.12)",
      mapStroke: "rgba(255,255,255,0.5)",
      mapHoverStroke: "rgba(255,255,255,0.9)",
      playFill: "rgba(76,175,80,0.85)",
      playHoverFill: "rgba(102,187,106,0.95)",
      playStroke: "rgba(255,255,255,0.85)",
      overlayPanel: "rgba(0,0,0,0.2)"
    };

    // Dificultades
    this.difficulties = [
      { key: 'easy', label: 'Fácil' },
      { key: 'normal', label: 'Normal' },
      { key: 'hard', label: 'Difícil' }
    ];

    // Cargar fondo y re-render al cargar
    this.image.addEventListener("load", () => {
      this.imageLoaded = true;
      this.renderMenu();
    });
    this.image.src = this.imageSrc;
  }

  // Permite actualizar parcialmente el estado desde el Controller
  setState(patch = {}) {
    this.state = { ...this.state, ...patch };
  }

  // Render principal del menú (fondo + UI)
  renderMenu() {
    if (!this.canvas || !this.ctx) return;

    const { width: cw, height: ch } = this.canvas;
    // Fondo
    this.ctx.clearRect(0, 0, cw, ch);
    if (this.imageLoaded) {
      const iw = this.image.naturalWidth, ih = this.image.naturalHeight;
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale, dh = ih * scale;
      const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
      this.ctx.drawImage(this.image, dx, dy, dw, dh);
    } else {
      this.ctx.fillStyle = "#222";
      this.ctx.fillRect(0, 0, cw, ch);
    }

    // Panel sutil para contraste
    this.ctx.fillStyle = this.theme.overlayPanel;
    this.ctx.fillRect(cw * 0.08, ch * 0.06, cw * 0.84, ch * 0.82);

    // Layout
    this.computeLayout();

    // Dibujo de UI
    this.drawTitle();
    this.drawDifficultyButtons();
    this.drawMapSelectors();
    this.drawPlayButton();
  }

  computeLayout() {
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // Panel (mismo que el usado en renderMenu para contraste)
    const panelX = cw * 0.08;
    const panelY = ch * 0.06;
    const panelW = cw * 0.84;
    const panelH = ch * 0.82;
    const panelBottom = panelY + panelH;

    const titleY = Math.round(ch * 0.16);

    // Dificultades
    const diffW = Math.max(160, Math.min(220, cw * 0.18));
    const diffH = Math.max(48, Math.min(64, ch * 0.09));
    const diffGap = Math.max(20, Math.min(30, cw * 0.02));
    const totalDiffWidth = diffW * 3 + diffGap * 2;
    const diffStartX = Math.round((cw - totalDiffWidth) / 2);
    const diffY = Math.round(titleY + ch * 0.08);

    // Mapas
    const mapW = Math.max(120, Math.min(160, cw * 0.12));
    const mapH = Math.max(84, Math.min(110, ch * 0.15));
    const mapGap = Math.max(20, Math.min(28, cw * 0.022));
    const totalMapWidth = mapW * 5 + mapGap * 4;
    const mapStartX = Math.round((cw - totalMapWidth) / 2);
    const mapY = Math.round(diffY + diffH + ch * 0.08);

    // Play 
    const playW = Math.max(240, Math.min(320, cw * 0.28));
    const playH = Math.max(56, Math.min(72, ch * 0.1));
    const playX = Math.round((cw - playW) / 2);
    const playBottomMargin = Math.max(24, Math.round(ch * 0.04)); // margen mínimo 24px
    const playY = Math.round(panelBottom - playH - playBottomMargin);

    // Armar hitAreas
    this.hitAreas = { difficulties: [], maps: [], play: null };

    for (let i = 0; i < 3; i++) {
      const x = diffStartX + i * (diffW + diffGap);
      this.hitAreas.difficulties.push({
        key: this.difficulties[i].key,
        label: this.difficulties[i].label,
        rect: { x, y: diffY, w: diffW, h: diffH }
      });
    }

    this.hitAreas.maps = Array.from({ length: 5 }, (_, i) => {
      const x = mapStartX + i * (mapW + mapGap);
      return { index: i, rect: { x, y: mapY, w: mapW, h: mapH } };
    });

    this.hitAreas.play = { rect: { x: playX, y: playY, w: playW, h: playH } };

    this.layout = { titleY, panelX, panelY, panelW, panelH };
  }

  drawTitle() {
    const { ctx, canvas, theme } = this;
    const { titleY } = this.layout;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.max(36, Math.min(56, canvas.height * 0.08))}px Poppins, Arial, sans-serif`;
    ctx.fillStyle = theme.titleColor;
    ctx.shadowColor = theme.titleShadow;
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fillText("Flappy Bird", canvas.width / 2, titleY);
    ctx.restore();
  }

  drawDifficultyButtons() {
    const { ctx, theme, state } = this;

    this.hitAreas.difficulties.forEach((d) => {
      const isHovered = state.hoveredDifficulty === d.key;
      const isSelected = state.selectedDifficulty === d.key;

      // Fondo
      ctx.save();
      ctx.beginPath();
      ctx.rect(d.rect.x, d.rect.y, d.rect.w, d.rect.h);
      ctx.fillStyle = isSelected ? theme.selectedFill : (isHovered ? theme.btnHoverFill : theme.btnFill);
      ctx.fill();

      // Borde
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeStyle = isSelected ? theme.selectedStroke : (isHovered ? theme.btnHoverStroke : theme.btnStroke);
      ctx.stroke();

      // Texto
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "600 22px Poppins, Arial, sans-serif";
      ctx.fillStyle = isSelected ? theme.selectedStroke : theme.btnText;
      ctx.fillText(d.label, d.rect.x + d.rect.w / 2, d.rect.y + d.rect.h / 2);
      ctx.restore();
    });
  }

  drawMapSelectors() {
    const { ctx, theme, state } = this;

    this.hitAreas.maps.forEach((m) => {
      const isHovered = state.hoveredMap === m.index;
      const isSelected = state.selectedMap === m.index;

      ctx.save();
      ctx.beginPath();
      ctx.rect(m.rect.x, m.rect.y, m.rect.w, m.rect.h);
      ctx.fillStyle = isSelected ? theme.selectedFill : (isHovered ? theme.mapHoverFill : theme.mapFill);
      ctx.fill();

      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeStyle = isSelected ? theme.selectedStroke : (isHovered ? theme.mapHoverStroke : theme.mapStroke);
      ctx.stroke();
      ctx.restore();
    });
  }

  drawPlayButton() {
    const { ctx, theme, state } = this;
    const { rect } = this.hitAreas.play;
    const hovered = !!state.playButtonHovered;

    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = hovered ? theme.playHoverFill : theme.playFill;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = theme.playStroke;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 26px Poppins, Arial, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 6;
    ctx.fillText("JUGAR", rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.restore();
  }

  // Hit testing
  detectHover(x, y) {
    // Dificultades
    for (const d of this.hitAreas.difficulties) {
      if (this._inRect(x, y, d.rect)) {
        return { type: "difficulty", key: d.key };
      }
    }
    // Mapas
    for (const m of this.hitAreas.maps) {
      if (this._inRect(x, y, m.rect)) {
        return { type: "map", index: m.index };
      }
    }
    // Play
    if (this.hitAreas.play && this._inRect(x, y, this.hitAreas.play.rect)) {
      return { type: "play" };
    }
    return null;
  }

  detectClick(x, y) {
    return this.detectHover(x, y);
  }

  _inRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }
}