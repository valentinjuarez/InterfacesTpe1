export default class PreGameMenu {
  // Clase que representa el menú previo al inicio del juego (pantalla con título y botón "JUGAR")
  constructor(ctx, onStart, bgSrc = 'assets/fondoPregame.png') {
    this.ctx = ctx;           // contexto 2D del canvas donde se dibuja el menú
    this.onStart = onStart;   // callback que se ejecuta cuando se pulsa el botón de iniciar

    this.w = ctx.canvas.width;  // ancho del canvas
    this.h = ctx.canvas.height; // alto del canvas

    // botón centrado y estado hover mínimo
    // btn guarda la posición y tamaño del rectángulo clicable del botón
    this.btn = { x: this.w / 2 - 140, y: this.h / 2 + 30, w: 280, h: 64 };
    this.hover = false;

    // Estilo tipo "pill" y animación (ajustado al CSS dado)
    this.btnRadius = this.btn.h / 2;
    this.hoverScale = 1.07;           // hover: scale(1.07)
    this.breathingAmplitude = 0.045;  // idle: escala máx 1.045 (breathing 2.2s)
    this.pulse = 0;

    // Imagen de fondo
    this.bgImage = new Image();
    this.bgLoaded = false;
    this.bgImage.onload = () => { this.bgLoaded = true; };
    this.bgImage.src = bgSrc;

    // Fila de dificultad (3 botones)
    this.diffs = [
      { key: 'facil',  label: 'FÁCIL (10 min)',  minutes: 10 },
      { key: 'normal', label: 'NORMAL (5 min)', minutes: 5 },
      { key: 'dificil',label: 'DIFÍCIL (3 min)',minutes: 3 },
    ];
    this.diffBtnW = 150; this.diffBtnH = 40; this.diffGap = 16;
    const totalW = this.diffs.length * this.diffBtnW + (this.diffs.length - 1) * this.diffGap;
    const startX = this.w / 2 - totalW / 2;
    const y = this.btn.y - 90;
    this.diffBtns = this.diffs.map((d, i) => ({
      key: d.key, x: startX + i * (this.diffBtnW + this.diffGap), y, w: this.diffBtnW, h: this.diffBtnH
    }));
    this.diffHover = null;
    this.diffSelected = 'normal'; // por defecto 5 min
  }

  // Helpers para que el controller maneje los eventos
  hitButton(x, y) {
    const b = this.btn;
    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  }
  setHover(hover) {
    this.hover = !!hover;
  }
  // Dificultad: helpers MVC
  hitDifficulty(x, y) {
    for (const b of this.diffBtns) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b.key;
    }
    return null;
  }
  setDifficultyHover(keyOrNull) {
    this.diffHover = keyOrNull || null;
  }
  setSelectedDifficulty(key) {
    if (this.diffs.some(d => d.key === key)) this.diffSelected = key;
  }

  // Dibuja el menú en el canvas: título, botón y texto del botón
  draw() {
    const ctx = this.ctx;

    // Dibuja la imagen de fondo escalada al canvas si ya cargó, si no, rellena con color
    if (this.bgLoaded) {
      ctx.drawImage(this.bgImage, 0, 0, this.w, this.h);
    } else {
      ctx.fillStyle = '#0b1020';
      ctx.fillRect(0, 0, this.w, this.h);
    }

    // Overlay semi-transparente para mejorar contraste (más oscuro)
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, this.w, this.h);

    // Título
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 56px Arial';
    // Texto grande centrado en la mitad superior de la pantalla
   // ctx.fillText('Peg Solitaire', this.w / 2, this.h / 2 - 60);

    // Botones de dificultad
    for (const b of this.diffBtns) {
      const isHover = this.diffHover === b.key;
      const isSelected = this.diffSelected === b.key;

      // estilo: seleccionado/hover en blanco, sino gradiente
      const grad = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
      // Cambiar a paleta relacionada con fondoPregame.png (azules/teal)
      grad.addColorStop(0, '#0D1B2A'); // deep navy
      grad.addColorStop(1, '#2e65c4ff'); // teal

      ctx.save();
      ctx.shadowColor = isHover || isSelected ? '#f357a855' : '#7a3ef055';
      ctx.shadowBlur = isHover || isSelected ? 28 : 18;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = isHover || isSelected ? 8 : 5;

      ctx.fillStyle = (isHover || isSelected) ? '#ffffff' : grad;
      roundRect(ctx, b.x, b.y, b.w, b.h, b.h / 2, true, false);

      // texto centrado
      ctx.shadowColor = 'transparent';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '600 16px Poppins, Arial, sans-serif';
      ctx.fillStyle = (isHover || isSelected) ? '#222222' : '#ffffff';
      const label = this.diffs.find(d => d.key === b.key)?.label || '';
      ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2);
      ctx.restore();
    }

    // Botón "JUGAR"
    const b = this.btn;

    // Animación "breathing" 2.2s (idle). En hover: escala fija 1.07 (sin breathing).
    const t = (performance.now ? performance.now() : Date.now()) / 1000;
    const breathing = (Math.sin((2 * Math.PI / 2.2) * t) + 1) / 2; // [0..1]
    const scale = this.hover ? this.hoverScale : 1 + this.breathingAmplitude * breathing;

    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);

    // Sombra externa (box-shadow) según estado
    // idle: 0 6px 32px #7a3ef055; hover: 0 10px 40px #f357a855
    if (this.hover) {
      ctx.shadowColor = '#f357a855';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 10;
    } else {
      // variación leve con "breathing"
      const baseBlur = 32, baseOffsetY = 6;
      const k = 0.25 * breathing; // leve variación
      ctx.shadowColor = '#7a3ef055';
      ctx.shadowBlur = baseBlur * (1 + k);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = baseOffsetY * (1 + k);
    }

    // Fondo del botón:
    // - hover: blanco (#fff)
    // - normal: gradiente azul/teal relacionado con fondoPregame.png
    const grad = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
    grad.addColorStop(0, '#0D1B2A'); // deep navy
    grad.addColorStop(1, '#2e65c4ff'); // teal

    ctx.fillStyle = this.hover ? '#ffffff' : grad;
    roundRect(ctx, b.x, b.y, b.w, b.h, this.btnRadius, true, false);

    // Inset highlight superior suave (simula "0 1.5px 0 #fff3 inset")
    ctx.save();
    // Clip al botón
    roundRect(ctx, b.x, b.y, b.w, b.h, this.btnRadius, false, false);
    ctx.clip();
    const inset = ctx.createLinearGradient(0, b.y, 0, b.y + 8);
    inset.addColorStop(0, 'rgba(255,255,255,0.20)');
    inset.addColorStop(1, 'rgba(255,255,255,0.0)');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = inset;
    ctx.fillRect(b.x, b.y, b.w, 8);
    ctx.restore();

    // Texto (sin sombra)
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.textAlign = 'left';          // lo maneja drawSpacedText con centrado propio
    ctx.textBaseline = 'middle';
    ctx.font = '700 24px Poppins, Arial, sans-serif';
    ctx.fillStyle = this.hover ? '#222222' : '#ffffff';
    drawSpacedText(ctx, 'JUGAR AHORA', b.x + b.w / 2, b.y + b.h / 2, 1); // letter-spacing: 1px

    ctx.restore();

    // Utilidades
    function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
      if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
      } else {
        const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (const side in defaultRadius) radius[side] = radius[side] || defaultRadius[side];
      }
      ctx.beginPath();
      ctx.moveTo(x + radius.tl, y);
      ctx.lineTo(x + width - radius.tr, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
      ctx.lineTo(x + width, y + height - radius.br);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
      ctx.lineTo(x + radius.bl, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
      ctx.lineTo(x, y + radius.tl);
      ctx.quadraticCurveTo(x, y, x + radius.tl, y);
      ctx.closePath();
      if (fill) ctx.fill();
      if (stroke) ctx.stroke();
    }

    // Dibuja texto centrado con letter-spacing (px)
    function drawSpacedText(ctx, text, centerX, centerY, spacing) {
      const metrics = [...text].map(ch => ctx.measureText(ch).width);
      const total = metrics.reduce((a, w) => a + w, 0) + spacing * (text.length - 1);
      let x = centerX - total / 2;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        ctx.fillText(ch, x, centerY);
        x += metrics[i] + spacing;
      }
    }
  }
}
