(() => {
  /* ======================================================
     VARIABLES PRINCIPALES
  ====================================================== */
  let running = false,
      velocity = 0,
      playerY = 300,
      obstacleTimer = null,
      lastMap = null,
      lastChar = null;

  const gravity = 0.4,
        impulse = -8;

  const HITBOX = { DRAGON_X: 24, DRAGON_Y: 24, OBSTACLE_X: 12, OBSTACLE_Y: 12 };

  /* Bonus */
  let obstaclePairCount = 0;
  let bonuses = [];
  let bonusSize = null;
  let bonusCount = 0;
  const BONUS_GOAL = 3;

  /* ======================================================
     HELPERS
  ====================================================== */

  const $ = id => document.getElementById(id);
  const shrinkRect = (r, x = 0, y = 0) => ({
    left:r.left+x, right:r.right-x, top:r.top+y, bottom:r.bottom-y
  });

  const hide = el => el?.classList.remove("show");
  const show = el => el?.classList.add("show");

  const updateHUD = () => { $("bonus-counter-text").textContent = `${bonusCount}/${BONUS_GOAL}` };

  const clearScene = () => {
    $("obstacles").innerHTML = "";
    bonuses.length = 0;
    bonusCount = 0;
    obstaclePairCount = 0;
    updateHUD();
  };

  /* ======================================================
     PARALLAX
  ====================================================== */
  function loadParallax(map) {
    const cont = $("parallax-container");
    cont.innerHTML = "";
    let i = 1;
    const base = `./assetsJuego/background/${map}/`;

    const loadLayer = () => {
      const img = new Image();
      img.src = `${base}${i}.png`;
      img.onload = () => {
        const layer = document.createElement("div");
        layer.className = "parallax-layer";
        layer.style.backgroundImage = `url('${img.src}')`;
        layer.style.animationDuration = `${8 + i * 2}s`;

        const h = cont.clientHeight;
        layer.style.setProperty("--tile-w",
          `${Math.round((img.naturalWidth * h) / img.naturalHeight)}px`
        );

        cont.appendChild(layer);
        i++;
        loadLayer();
      };
    };
    loadLayer();
  }

  /* ======================================================
     PERSONAJE
  ====================================================== */
  function loadCharacter(id) {
    const p = $("dragon"), g = $("game");
    p.style.backgroundImage = `url('./assetsJuego/character/144x128/dragon${id}.png')`;
    playerY = (g.clientHeight - p.clientHeight) / 2;
    velocity = 0;
    p.style.top = `${playerY}px`;
  }

  /* ======================================================
     BONUS
  ====================================================== */

  // Obtiene tamaño real del bonus solo la primera vez
  function ensureBonusSize(cb) {
    if (bonusSize) return cb();
    const img = new Image();
    img.src = "./assetsJuego/extras/bonus/bonus1.png";
    img.onload = () => {
      bonusSize = { w: img.naturalWidth, h: img.naturalHeight };
      cb();
    };
  }

  // Crea bonus centrado en el hueco
  function createBonusInGap(gapY) {
    ensureBonusSize(() => {
      const b = document.createElement("div");
      b.className = "bonus";
      b.style.width = `${bonusSize.w}px`;
      b.style.height = `${bonusSize.h}px`;
      b.style.left = "1300px";
      b.style.top = `${gapY + GAP / 2 - bonusSize.h / 2}px`;
      $("obstacles").appendChild(b);
      bonuses.push(b);
    });
  }

  // Animación "+" hacia contador
  function spawnFlyToCounter(fromRect) {
    const game = $("game");
    const counter = $("bonus-counter");

    const g = game.getBoundingClientRect();
    const c = counter.getBoundingClientRect();

    const fly = document.createElement("div");
    fly.className = "bonus-fly";
    fly.textContent = "+";

    fly.style.setProperty("--from-x", `${fromRect.left + fromRect.width/2 - g.left}px`);
    fly.style.setProperty("--from-y", `${fromRect.top + fromRect.height/2 - g.top}px`);
    fly.style.setProperty("--to-x", `${c.left + c.width/2 - g.left}px`);
    fly.style.setProperty("--to-y", `${c.top + c.height/2 - g.top}px`);
    fly.style.setProperty("--anim-dur", `.7s`);

    game.appendChild(fly);

    fly.addEventListener("animationend", () => {
      fly.remove();
      updateHUD();
      if (bonusCount >= BONUS_GOAL) gameWin();
    }, { once:true });
  }

  /* ======================================================
     OBSTÁCULOS
  ====================================================== */
  const obstacles = [];
  const SPEED = 3, GAP = 200, PNG_W = 130;

  function createObstacle() {
    const gH = $("game").clientHeight;
    const cont = $("obstacles");

    const min = 80, max = gH - GAP - 80;
    const gapY = Math.random() * (max - min) + min;

    const mk = (top, h, flip = false) => {
      const o = document.createElement("div");
      o.className = "obstacle";
      o.style = `
        position:absolute; left:1300px; width:${PNG_W}px;
        top:${top}px; height:${h}px;
        background-image:url('../assetsJuego/extras/obstacle/obstaculo.png');
        background-repeat:repeat-y;
        background-size:${PNG_W}px auto;
        transform:${flip ? "scaleY(-1)" : "none"};
      `;
      cont.appendChild(o);
      obstacles.push(o);
    };

    mk(0, gapY, true);                  // arriba
    mk(gapY + GAP, gH - (gapY + GAP));  // abajo

    // Bonus cada 6 pares
    if (++obstaclePairCount % 6 === 0) createBonusInGap(gapY);
  }

  /* ======================================================
     CONTROLES
  ====================================================== */
  document.addEventListener("keydown", e => {
    if (e.code === "Space" && running) {
      e.preventDefault();
      velocity = impulse;
    }
  });

  /* ======================================================
     LOOP PRINCIPAL
  ====================================================== */
  function update() {
    if (!running) return;

    const p = $("dragon"), g = $("game");

    // Físicas
    velocity += gravity;
    playerY = Math.max(0, Math.min(playerY + velocity, g.clientHeight - p.clientHeight));
    p.style.top = `${playerY}px`;

    // Movimiento
    [...obstacles, ...bonuses].forEach(o => {
      if (o.isConnected) o.style.left = (parseFloat(o.style.left) - SPEED) + "px";
    });

    // Hitbox dragón
    const dRect = shrinkRect(
      p.getBoundingClientRect(),
      HITBOX.DRAGON_X, HITBOX.DRAGON_Y
    );

    // Colisión con obstáculos
    for (const o of obstacles) {
      if (!o.isConnected) continue;
      const r = shrinkRect(o.getBoundingClientRect(), HITBOX.OBSTACLE_X, HITBOX.OBSTACLE_Y);
      if (dRect.left < r.right && dRect.right > r.left && dRect.top < r.bottom && dRect.bottom > r.top)
        return gameOver();
    }

    // Colisión con bonus
    for (const b of bonuses) {
      if (!b.isConnected) continue;
      const br = b.getBoundingClientRect();
      const hit =
        dRect.left < br.right &&
        dRect.right > br.left &&
        dRect.top < br.bottom &&
        dRect.bottom > br.top;

      if (hit) {
        b.remove();
        bonusCount++;
        spawnFlyToCounter(br);
      }
    }

    requestAnimationFrame(update);
  }

  /* ======================================================
     GAME OVER / WIN
  ====================================================== */
  function gameOver() {
    running = false;
    show($("overlay-gameover"));
  }

  function gameWin() {
    running = false;
    show($("overlay-gamewin"));
  }

  /* Botones overlays */
  document.addEventListener("click", e => {
    const id = e.target.id;
    if (id === "btnRetry") retry();
    if (id === "btnMenuFromOver" || id === "btnMenuFromWin") window.location.reload();
  });

  /* ======================================================
     REINTENTAR / START
  ====================================================== */
  function retry() {
    hide($("overlay-gameover"));
    hide($("overlay-gamewin"));
    clearScene();
    clearInterval(obstacleTimer);
    start(lastMap, lastChar);
  }

  function start(map, char) {
    lastMap = map;
    lastChar = char;

    running = true;
    hide($("overlay-gameover"));
    hide($("overlay-gamewin"));
    updateHUD();
    loadParallax(map);
    loadCharacter(char);

    clearInterval(obstacleTimer);
    obstacleTimer = setInterval(() => running && createObstacle(), 2800);

    update();
  }

  window.dragonRush = { start };
})();
