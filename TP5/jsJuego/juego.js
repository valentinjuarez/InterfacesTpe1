(() => {

    /* =========================
       ESTADO DEL JUEGO
    ========================= */
    let running = false;
    let velocity = 0;
    let playerY = 300;

    const gravity = 0.4;
    const impulse = -8;


    /* =========================
       PARALLAX
    ========================= */
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
        if (!cont) return;
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
                i++; load();
            };
        };

        load();

        window.addEventListener("resize", () => {
            cont.querySelectorAll(".parallax-layer").forEach(layer => {
                const img = new Image();
                img.src = layer.style.backgroundImage.replace(/url\(['"]?(.+)['"]?\)/, "$1");
                img.onload = () => setTileSize(layer, img, cont);
            });
        });
    }


    /* =========================
       PERSONAJE
    ========================= */
    function loadCharacter(id) {
        const p = document.getElementById("player");
        const game = document.getElementById("game");
        if (!p || !game) return;

        p.style.backgroundImage = `url('./assetsJuego/character/144x128/dragon${id}.png')`;
        p.style.backgroundPosition = "0 -128px";

        const pH = p.clientHeight;
        const gH = game.clientHeight;

        playerY = (gH - pH) / 2;
        velocity = 0;
        p.style.top = `${playerY}px`;
    }


    /* =========================
       CONTROLES
    ========================= */
    document.addEventListener("keydown", e => {
        if (e.code === "Space" && running) {
            e.preventDefault();
            velocity = impulse;
        }
    });


    /* =========================
       BUCLE DEL JUEGO
    ========================= */
    function update() {
        if (!running) return;

        const p = document.getElementById("player");
        const game = document.getElementById("game");
        if (!p || !game) return;

        velocity += gravity;
        playerY += velocity;

        const maxY = game.clientHeight - p.clientHeight;

        if (playerY < 0) { playerY = 0; velocity = 0; }
        if (playerY > maxY) { playerY = maxY; velocity = 0; }

        p.style.top = `${Math.round(playerY)}px`;

        requestAnimationFrame(update);
    }


    /* =========================
       API
    ========================= */
    function start(map, char) {
        running = true;
        loadParallax(map);
        loadCharacter(char);
        update();
    }

    window.dragonRush = { start };

})();
