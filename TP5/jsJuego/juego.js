(() => {
  let running = false;
  let velocity = 0;
  let playerY = 300;
  const gravity = 0.4;
  const impulse = -8;

  // Buffer para hitbox (ajustable)
  const HITBOX_BUFFER = {
    DRAGON_X: 12, // px a recortar a izquierda/derecha
    DRAGON_Y: 10, // px a recortar arriba/abajo
    OBSTACLE_X: 2,
    OBSTACLE_Y: 2
  };

  // Inset de un DOMRect sin mutarlo
  function shrinkRect(rect, insetX = 0, insetY = 0) {
    return {
      left: rect.left + insetX,
      right: rect.right - insetX,
      top: rect.top + insetY,
      bottom: rect.bottom - insetY
    };
  }

  /* ===== PARALLAX ===== */

  function createLayer(src, speed) {
	const layer = document.createElement("div");
	layer.className = "parallax-layer";
	layer.style.backgroundImage = `url('${src}')`;
	layer.style.animationDuration = `${speed}s`;
	return layer;
  }

  function setTileSize(layer, img, cont) {
	const h = cont.clientHeight;
	const tw = Math.round((img.naturalWidth * h) / img.naturalHeight);
	layer.style.setProperty("--tile-w", `${tw}px`);
  }

  function loadParallax(map) {
	const cont = document.getElementById("parallax-container");
	cont.innerHTML = "";
	let i = 1;
	const base = `./assetsJuego/background/${map}/`;
	const load = () => {
	  const img = new Image();
	  img.src = `${base}${i}.png`;
	  img.onload = () => {
		const layer = createLayer(img.src, 8 + i * 2);
		cont.appendChild(layer);
		setTileSize(layer, img, cont);
		i++;
		load();
	  };
	};
	load();
  }

  /* ===== CHARACTER ===== */
  function loadCharacter(id) {
    const p = document.getElementById("dragon");
    const game = document.getElementById("game");
    p.style.backgroundImage = `url('./assetsJuego/character/144x128/dragon${id}.png')`;
    const pH = p.clientHeight;
    const gH = game.clientHeight;
    playerY = (gH - pH) / 2;
    velocity = 0;
    p.style.top = `${playerY}px`;
  }

  /* ===== OBSTÁCULOS PNG ===== */

  const obstacles = [];
  const OBSTACLE_SPEED = 3;
  const DIST_BETWEEN = 360; // más separados
  const GAP = 200; // gap más chico (obstáculos más cerca)
  const PNG_WIDTH = 130; // ajustalo si tu PNG tiene otro tamaño

  function createObstacle() {
	const game = document.getElementById("game");
	const container = document.getElementById("obstacles");
	const gH = game.clientHeight;

	// límite donde puede estar el hueco (sin cortar arriba/abajo)
	const minGapTop = 80;
	const maxGapTop = gH - GAP - 80;

	// posición aleatoria del hueco
	const gapY = Math.floor(Math.random() * (maxGapTop - minGapTop)) + minGapTop;

	// -------- OBSTÁCULO SUPERIOR (rellena desde arriba hasta el hueco) --------
	const topObs = document.createElement("div");
	topObs.className = "obstacle";
	topObs.style.position = "absolute";
	topObs.style.width = PNG_WIDTH + "px";
	topObs.style.left = "1300px";
	topObs.style.top = "0px";
	topObs.style.height = `${gapY}px`;
	topObs.style.backgroundImage = "url('../assetsJuego/extras/obstacle/obstaculo.png')";
	topObs.style.backgroundRepeat = "repeat-y";
	topObs.style.backgroundSize = `${PNG_WIDTH}px auto`;
	// mantener la orientación del sprite superior
	topObs.style.transform = "scaleY(-1)";

	// -------- OBSTÁCULO INFERIOR (rellena desde el hueco hasta el piso) --------
	const bottomTop = gapY + GAP;
	const bottomHeight = Math.max(0, gH - bottomTop);

	const bottomObs = document.createElement("div");
	bottomObs.className = "obstacle";
	bottomObs.style.position = "absolute";
	bottomObs.style.width = PNG_WIDTH + "px";
	bottomObs.style.left = "1300px";
	bottomObs.style.top = `${bottomTop}px`;
	bottomObs.style.height = `${bottomHeight}px`;
	bottomObs.style.backgroundImage = "url('../assetsJuego/extras/obstacle/obstaculo.png')";
	bottomObs.style.backgroundRepeat = "repeat-y";
	bottomObs.style.backgroundSize = `${PNG_WIDTH}px auto`;

	// guardamos y agregamos
	obstacles.push(topObs, bottomObs);
	container.appendChild(topObs);
	container.appendChild(bottomObs);
  }

  /* ===== CONTROLES ===== */

  document.addEventListener("keydown", e => {
	if (e.code === "Space" && running) {
	  e.preventDefault();
	  velocity = impulse;
	}
  });

  /* ===== LOOP ===== */

  function update() {
    if (!running) return;
    const p = document.getElementById("dragon");
    const game = document.getElementById("game");

	velocity += gravity;
	playerY += velocity;

	const maxY = game.clientHeight - p.clientHeight;
	if (playerY < 0) {
	  playerY = 0;
	  velocity = 0;
	}
	if (playerY > maxY) {
	  playerY = maxY;
	  velocity = 0;
	}

	p.style.top = `${playerY}px`;

	/* mover obstáculos */
	for (let obs of obstacles) {
	  let x = parseFloat(obs.style.left) || 0;
	  obs.style.left = (x - OBSTACLE_SPEED) + "px";
	}

	// Detección de colisiones con buffer (bounding boxes reducidos)
	{
	  const dRect = shrinkRect(
		p.getBoundingClientRect(),
		HITBOX_BUFFER.DRAGON_X,
		HITBOX_BUFFER.DRAGON_Y
	  );

	  for (let i = 0; i < obstacles.length; i++) {
		const o = obstacles[i];
		if (!o.isConnected) continue;

		const r = shrinkRect(
		  o.getBoundingClientRect(),
		  HITBOX_BUFFER.OBSTACLE_X,
		  HITBOX_BUFFER.OBSTACLE_Y
		);

		const overlap =
		  dRect.left < r.right &&
		  dRect.right > r.left &&
		  dRect.top < r.bottom &&
		  dRect.bottom > r.top;

		if (overlap) {
		  running = false;
		  if (typeof gameOver === "function") gameOver();
		  break;
		}
	  }
	}

	requestAnimationFrame(update);
  }

  /* ===== START ===== */

  function start(map, char) {
	running = true;
	loadParallax(map);
	loadCharacter(char);
	setInterval(() => {
	  if (running) createObstacle();
	}, 2800); // menos frecuentes
	update();
  }

  window.dragonRush = { start };
})();