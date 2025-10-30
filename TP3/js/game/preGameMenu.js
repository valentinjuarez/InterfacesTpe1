'use strict';

/**
 * Módulo: Menú previo al juego de Blocka.
 * - Renderiza un menú en el canvas con selección de dificultad y rompecabezas.
 * - Ofrece ruleta de selección cuando se elige "Random".
 * - Lanza el panel del juego o el panel de instrucciones según la interacción.
 */

/* =========================
   UTILIDADES (fuera del scope del menú)
   ========================= */
/**
 * Normaliza un texto para comparaciones (minúsculas, sin acentos).
 * @param {string} s
 * @returns {string}
 */
function normalizeText(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Devuelve cantidad de piezas estimada según dificultad.
 * Fácil=4, Normal=6, Difícil=8.
 * @param {string} diff
 * @returns {number}
 */
function piecesFromDifficulty(diff) {
  const d = normalizeText(diff);
  if (d.startsWith('fac')) return 4;
  if (d.startsWith('dif')) return 8;
  return 6; // normal
}

/* =========================
   PUNTO DE ENTRADA DEL MENÚ
   ========================= */
/**
 * Carga y muestra el menú en el canvas principal.
 * - Prepara estado/UI, assets e interacciones.
 * - Al pulsar JUGAR, lanza el panel del juego.
 */
function loadMenu() {
  // Referencias base
  const canvas = document.getElementById('myCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Estado UI
  const ui = {
    selectedDifficulty: 'Normal',
    imagesSrc: [
      'assets/rompecabezasDesierto.png',
      'assets/rompecabezasJungla.png',
      'assets/rompecabezasCiudad.png',
      'assets/rompecabezasNieve.png',
      'assets/rompecabezasMontaña.png',
      'assets/rompecabezasPlaya.png',
      'assets/rompecabezasRandom.png' // último = Random
    ],
    images: [],
    imageIndex: 0
  };

  // Layout base (panel)
  const panel = { x: 0, y: 0, w: 800, h: 680 };
  /**
   * Centra el panel dentro del canvas.
   */
  function centerPanel() {
    panel.x = Math.round((canvas.width - panel.w) / 2);
    panel.y = Math.round((canvas.height - panel.h) / 2);
  }

  /**
   * Calcula X centrado para un ancho dado dentro del panel.
   * @param {number} w
   * @returns {number}
   */
  function centerX(w) {
    return Math.round(panel.x + panel.w / 2 - w / 2);
  }

  // Elementos interactivos
  
  let diffButtons = [];

  let thumbsArea;

  let thumbTiles = [];

  let hoverIndex = -1;
 
  let btnJugar = { x: 0, y: 0, w: 200, h: 46, label: 'JUGAR' };
 
  let linkInstruccionesRect = null;

  // Flags de control
  let gamePanelLoaded = false;

  /* =========================
     RULETA RANDOM (estado y control)
     ========================= */
  let isRoulette = false;
  let rouletteTimer = null;
  let rouletteEndTimer = null;

  /**
   * Ejecuta la ruleta de selección para "Random".
   * - Cicla por miniaturas (excluye la de Random) durante ~1.4s.
   * - Se detiene en una miniatura aleatoria y, tras ~2.2s, llama al callback.
   * @param {(finalIdx:number)=>void} done
   */
  // ...existing code...
function playRandomRoulette(done) {
  // Evita múltiples ruletas simultáneas
  if (isRoulette) return;
  isRoulette = true;

  // Arma la lista de índices válidos (excluye el último = "Random")
  const total = ui.imagesSrc.length;
  const pool = Array.from({ length: Math.max(0, total - 1) }, (_, i) => i);//Todas las miniaturas menos la última
  if (pool.length === 0) { // no hay nada para sortear
    isRoulette = false;
    done?.(0);
    return;
  }

  // Hace “girar” las miniaturas rápidamente
  let i = 0;
  rouletteTimer = setInterval(() => {
    ui.imageIndex = pool[i++ % pool.length]; // avanza en bucle
    drawForm(); // refresca UI
  }, 120);

  // Programa la detención del giro
  rouletteEndTimer = setTimeout(() => {
    clearInterval(rouletteTimer); rouletteTimer = null;

    // Selección final aleatoria
    const finalIdx = pool[Math.floor(Math.random() * pool.length)];
    ui.imageIndex = finalIdx;
    drawForm();

    // Espera para que el usuario vea el resultado y luego continúa
    setTimeout(() => {
      done?.(finalIdx); // loadGamePanel limpiará flags/timers
    }, 2200);
  }, 1400);
}

  function loadGamePanel(config) {
    if (gamePanelLoaded) return;
    gamePanelLoaded = true;

    // Detener ruleta si estaba corriendo
    if (rouletteTimer) { clearInterval(rouletteTimer); rouletteTimer = null; }
    if (rouletteEndTimer) { clearTimeout(rouletteEndTimer); rouletteEndTimer = null; }
    isRoulette = false;

    // Desregistrar eventos del menú
    if (canvas) {
      canvas.removeEventListener('click', onCanvasClick);
      canvas.removeEventListener('mousemove', onCanvasMove);
      canvas.removeEventListener('mouseleave', onCanvasLeave);
    }

    // Feedback de carga
    try {
      const ctx2 = canvas.getContext('2d');
      ctx2.clearRect(0, 0, canvas.width, canvas.height);
      ctx2.fillStyle = '#12347eff';
      ctx2.fillRect(0, 0, canvas.width, canvas.height);
      ctx2.fillStyle = '#fff';
      ctx2.font = '600 18px Poppins, sans-serif';
      ctx2.textAlign = 'center';
      ctx2.textBaseline = 'middle';
      ctx2.fillText('Cargando juego...', canvas.width / 2, canvas.height / 2);
    } catch {}

    // Guardar config
    window.__gameConfig = config;
    try { sessionStorage.setItem('gameConfig', JSON.stringify(config)); } catch {}

    // Cargar script del panel del juego
    const script = document.createElement('script');
    script.src = 'js/game/gamePanel.js';
    script.onload = () => {
      if (typeof window.startGamePanel === 'function') {
        try {
          const ctx2 = canvas.getContext('2d');
          window.startGamePanel(canvas, ctx2, config);
        } catch (e) {
          console.error('Error al iniciar el panel de juego:', e);
        }
      }
    };
    script.onerror = () => console.error('No se pudo cargar js/game/gamePanel.js');
    document.head.appendChild(script);
  }

  /**
   * Limpia listeners del menú y muestra el panel de instrucciones.
   */
  function loadInstructionsPanel() {
    if (canvas) {
      canvas.removeEventListener('click', onCanvasClick);
      canvas.removeEventListener('mousemove', onCanvasMove);
      canvas.removeEventListener('mouseleave', onCanvasLeave);
    }
    const script = document.createElement('script');
    script.src = 'js/game/instructionsPanel.js';
    script.onload = () => {
      if (typeof window.startInstructionsPanel === 'function') {
        try {
          const ctx2 = canvas.getContext('2d');
          window.startInstructionsPanel(canvas, ctx2);
        } catch (e) { console.error('Error al iniciar instrucciones:', e); }
      }
    };
    script.onerror = () => console.error('No se pudo cargar js/game/instructionsPanel.js');
    document.head.appendChild(script);
  }

  /* =========================
     LAYOUT DEL PANEL
     ========================= */
  /**
   * Recalcula posiciones (dificultad, grilla, botón JUGAR) según el canvas.
   */
  function recalcLayout() {
    const dW = 120, dH = 40, dGap = 30, dY = panel.y + 200;//btn dificulta
    const dMidX = centerX(dW);
    diffButtons = [
      { x: dMidX - (dW + dGap), y: dY, w: dW, h: dH, label: 'Fácil',   value: 'Fácil',   group: 'diff' },
      { x: dMidX,               y: dY, w: dW, h: dH, label: 'Normal',  value: 'Normal',  group: 'diff' },
      { x: dMidX + (dW + dGap), y: dY, w: dW, h: dH, label: 'Difícil', value: 'Difícil', group: 'diff' },
    ];

    const marginX = 40;
    thumbsArea = { x: panel.x + marginX, y: panel.y + 340, w: panel.w - marginX * 2, h: 180 };//posición grilla

    btnJugar = { x: centerX(200), y: panel.y + 550, w: 200, h: 46, label: 'JUGAR' };
  }

  /* =========================
     CARGA DE RECURSOS (imágenes)
     ========================= */
  let imagesLoaded = 0;
  const imgTitulo = new Image();
  const totalToLoad = 1 + ui.imagesSrc.length;
  /**
   * Incrementa el contador de cargas y arranca el menú al completar.
   */
  function checkImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalToLoad) iniciarMenu();
  }

  // Cargar título
  imgTitulo.addEventListener('load', checkImagesLoaded);
  imgTitulo.addEventListener('error', (e) => { console.error('No se pudo cargar la imagen del título', e); checkImagesLoaded(); });
  imgTitulo.src = 'assets/tituloBlocka.png';

  // Cargar miniaturas
  ui.images = ui.imagesSrc.map(src => {
    const im = new Image();
    im.addEventListener('load', checkImagesLoaded);
    im.addEventListener('error', (e) => { console.error('No se pudo cargar imagen del carrusel', src, e); checkImagesLoaded(); });
    im.src = src;
    return im;
  });

  /* =========================
     INICIO DEL MENÚ
     ========================= */
  /**
   * Inicializa layout y dibuja la primera pantalla.
   * Si existe window.startMenu externo, lo usa.
   */
  function iniciarMenu() {
    centerPanel();
    recalcLayout();

    if (typeof window.startMenu === 'function') {
      window.startMenu(ctx, canvas);
    } else {
      // Fallback visual mínimo (no se usa normalmente)
      ctx.save();
      ctx.fillStyle = 'rgba(108, 54, 54, 0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 32px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Menú inicial', canvas.width / 2, canvas.height / 2);
      ctx.restore();
    }
  }

  /* =========================
     DIBUJO DEL FORMULARIO COMPLETO
     ========================= */
  /**
   * Redibuja el menú completo: panel, título, subtítulos, controles y botón JUGAR.
   */
  function drawForm() {
    centerPanel();
    recalcLayout();

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo del panel
    ctx.fillStyle = 'rgba(25, 99, 195, 0.5)';
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);

    // Título "Blocka"
    drawTitleImage();

    // Subtítulos
    const subtPad = 24;
    drawSubtitulo(diffButtons[0] ? diffButtons[0].y - subtPad : panel.y + 150, 'Dificultad');//Alineado con botones de dificultad
    drawSubtitulo(thumbsArea.y - subtPad, 'Rompecabezas');

    // Botones de dificultad
    diffButtons.forEach(b => drawButton(b, ui.selectedDifficulty === b.value));

    // Grilla de miniaturas
    drawThumbnailsGrid();

    // Link "¿Cómo jugar?" y botón JUGAR
    drawLinkInstrucciones();
    drawButtonJugar();

    ctx.restore();
  }

  /* =========================
     HELPERS / HIT-TEST
     ========================= */
 
  function pointInRect(px, py, r) {//verifica si un punto está dentro de un rectángulo
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  /* =========================
     INTERACCIÓN (event handlers)
     ========================= */
  
  function onCanvasClick(ev) {
    if (isRoulette) return; // bloquear durante ruleta
    centerPanel();
    recalcLayout();

    const rect = canvas.getBoundingClientRect();
    const mx = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const my = (ev.clientY - rect.top) * (canvas.height / rect.height);

    // Dificultad
    for (const b of diffButtons) {//verifica si se hizo click en un botón de dificultad
      if (pointInRect(mx, my, b)) {
        ui.selectedDifficulty = b.value;
        drawForm();
        return;
      }
    }

    // Miniaturas
    for (const t of thumbTiles) {//verifica si se hizo click en una miniatura
      if (pointInRect(mx, my, t.rect)) {
        ui.imageIndex = t.index;
        drawForm();
        return;
      }
    }

    // Link "¿Cómo jugar?"
    // Verifica si se hizo click en el link de instrucciones
    if (linkInstruccionesRect && pointInRect(mx, my, linkInstruccionesRect)) {
      loadInstructionsPanel();
      return;
    }

    // Botón JUGAR
    if (pointInRect(mx, my, btnJugar)) {
      const isRandomSelected =
        ui.imageIndex === ui.imagesSrc.length - 1 ||
        (ui.imagesSrc[ui.imageIndex] || '').toLowerCase().includes('random');

      if (isRandomSelected) {
        // Ruleta y luego iniciar juego con el índice final
        playRandomRoulette((finalIdx) => {
          const config = {
            difficulty: ui.selectedDifficulty,
            pieces: piecesFromDifficulty(ui.selectedDifficulty),
            imageIndex: finalIdx,
            image: ui.imagesSrc[finalIdx]
          };
          loadGamePanel(config);
        });
        return;
      }

      // Flujo normal
      const chosenImageIndex = ui.imageIndex;
      const config = {
        difficulty: ui.selectedDifficulty,
        pieces: piecesFromDifficulty(ui.selectedDifficulty),
        imageIndex: chosenImageIndex,
        image: ui.imagesSrc[chosenImageIndex]
      };
      loadGamePanel(config);
      return;
    }
  }

  /**
   * Maneja el movimiento del mouse sobre el canvas.
   * @param {MouseEvent} ev
   */
  function onCanvasMove(ev) {//actualiza el hover sobre las miniaturas
    if (isRoulette) return;
    centerPanel();
    recalcLayout();

    const rect = canvas.getBoundingClientRect();
    const mx = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const my = (ev.clientY - rect.top) * (canvas.height / rect.height);

    let newHover = -1;
    for (let i = 0; i < thumbTiles.length; i++) {
      if (pointInRect(mx, my, thumbTiles[i].rect)) { newHover = i; break; }
    }
    if (newHover !== hoverIndex) {
      hoverIndex = newHover;
      drawForm();
    }
  }

  /**
   * Maneja el evento cuando el mouse sale del canvas.
   */
  function onCanvasLeave() {//limpia el hover cuando el mouse sale del canvas
    if (isRoulette) return;
    if (hoverIndex !== -1) {
      hoverIndex = -1;
      drawForm();
    }
  }

  /* =========================
     EXPOSE: startMenu (para wrappers externos)
     ========================= */
  window.startMenu = function (ctxExtern, canvasExtern) {
    drawForm();//inicia el dibujo del menú
    canvasExtern.removeEventListener('click', onCanvasClick);
    canvasExtern.addEventListener('click', onCanvasClick);
    canvasExtern.removeEventListener('mousemove', onCanvasMove);
    canvasExtern.removeEventListener('mouseleave', onCanvasLeave);
    canvasExtern.addEventListener('mousemove', onCanvasMove);
    canvasExtern.addEventListener('mouseleave', onCanvasLeave);
  };

  /* =========================
     DIBUJO: componentes
     ========================= */
  /**
   * Dibuja un subtítulo en una posición Y dada.
   */
  function drawSubtitulo(y, text) {
    ctx.fillStyle = '#0e0e0e';
    ctx.font = '700 18px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, panel.x + panel.w / 2, y);
  }

  
  function drawRoundedRect(x, y, w, h, r) {//redondea el rectangulo
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }


  function drawButton(b, selected) {
    ctx.save();
    drawRoundedRect(b.x, b.y, b.w, b.h, 10);
    ctx.fillStyle = selected ? '#7C3AED' : '#FFFFFF';//fondo del botón
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = selected ? '#4A1F85' : '#C5C2C2';//borde del botón
    ctx.stroke();
    ctx.fillStyle = selected ? '#fff' : '#1F1D1D';//color del texto
    ctx.font = '600 16px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2);//pos del texto
    ctx.restore();
  }

  /**
   * Dibuja el botón "JUGAR" con estilo destacado.
   */
  function drawButtonJugar() {
    ctx.save();
    drawRoundedRect(btnJugar.x, btnJugar.y, btnJugar.w, btnJugar.h, 12);
    ctx.fillStyle = '#7C3AED';
    ctx.fill();
    ctx.strokeStyle = '#4A1F85';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '700 18px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btnJugar.label, btnJugar.x + btnJugar.w / 2, btnJugar.y + btnJugar.h / 2);
    ctx.restore();
  }

  /**
   * Dibuja la imagen del título "Blocka" en la parte superior del panel.
   */
  function drawTitleImage() {
    if (!imgTitulo || !imgTitulo.naturalWidth) return;
    const paddingX = 40, topPad = 40, maxH = 100;
    
    const availW = panel.w - paddingX * 2;
    const scale = Math.min(availW / imgTitulo.width, maxH / imgTitulo.height);
    const destW = Math.round(imgTitulo.width * scale);
    const destH = Math.round(imgTitulo.height * scale);
    const dx = centerX(destW);
    const dy = Math.round(panel.y + topPad);

    ctx.save();
    ctx.drawImage(imgTitulo, dx, dy, destW, destH);
    ctx.restore();
  }

  /**
   * Dibuja la grilla de miniaturas de rompecabezas.
   */
  function drawThumbnailsGrid() {
    const n = ui.images.length;
    const cols = Math.min(4, Math.max(2, n));//cantidad de columnas
    const rows = Math.ceil(n / cols);
    const gap = 12;

    // Dimension de contenedor
    const tileW = Math.floor((thumbsArea.w - gap * (cols + 1)) / cols);//ancho de cada miniatura
    const tileH = Math.floor((thumbsArea.h - gap * (rows + 1)) / rows);//alto de cada miniatura

   
    thumbTiles = [];
    for (let i = 0; i < n; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = Math.round(thumbsArea.x + gap + col * (tileW + gap));
      const y = Math.round(thumbsArea.y + gap + row * (tileH + gap));

      // Imagen con cover
      ctx.save();
      drawRoundedRect(x, y, tileW, tileH, 8);
      
      ctx.clip();
      
      const img = ui.images[i];
      if (img && img.complete && img.naturalWidth) {
        const iw = img.naturalWidth, ih = img.naturalHeight;
        const scale = Math.max(tileW / iw, tileH / ih);
        const sw = Math.round(tileW / scale);
        const sh = Math.round(tileH / scale);
        const sx = Math.round((iw - sw) / 2);
        const sy = Math.round((ih - sh) / 2);
        ctx.drawImage(img, sx, sy, sw, sh, x, y, tileW, tileH);
      } else {
        ctx.fillStyle = '#ccc';
        ctx.fillRect(x, y, tileH, tileH);
      }
      ctx.restore();

      // Borde base
      drawRoundedRect(x, y, tileW, tileH, 8);
      ctx.strokeStyle = '#C5C2C2';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Modo Activo
      if (i === ui.imageIndex) {
        ctx.save();
        drawRoundedRect(x - 2, y - 2, tileW + 4, tileH + 4, 10);
        ctx.strokeStyle = '#4A1F85';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }

      // Hover
      if (i === hoverIndex) {
        ctx.save();
        drawRoundedRect(x, y, tileW, tileH, 8);
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#7C3AED';
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#7C3AED';
        ctx.stroke();
        ctx.restore();
      }

      thumbTiles.push({ index: i, rect: { x, y, w: tileW, h: tileH } });
    }
  }

  /**
   * Dibuja el link de instrucciones "¿Cómo jugar?" sobre el botón JUGAR.
   */
  function drawLinkInstrucciones() {
    const label = '¿Cómo jugar?';
    const y = btnJugar.y - 28;
    const cx = panel.x + panel.w / 2;

    ctx.save();
    ctx.font = '600 16px Poppins, sans-serif';
    const textW = Math.ceil(ctx.measureText(label).width);
    const padX = 8, padY = 6;
    const rect = { x: Math.round(cx - textW / 2) - padX, y: y - padY, w: textW + padX * 2, h: 22 + padY * 2 };//rectangulo clickable

    // Texto
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, cx, y);

    // Subrayado
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - textW / 2, y + 18);
    ctx.lineTo(cx + textW / 2, y + 18);
    ctx.stroke();

    ctx.restore();
    linkInstruccionesRect = rect;
  }
}

/* =========================
   EXPORTS Y BOOTSTRAP
   ========================= */
window.loadMenu = loadMenu;
document.addEventListener('DOMContentLoaded', () => {
  loadMenu();
});

