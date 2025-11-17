// ---------- CAPTURAR SELECCION DE MAPA ----------
const mapItems = document.querySelectorAll(".map-item");
let selectedMap = "mapa1";

function selectMap(item) {
    mapItems.forEach(i => {
        i.classList.remove("selected");
        i.setAttribute("aria-selected", "false");
    });
    item.classList.add("selected");
    item.setAttribute("aria-selected", "true");
    selectedMap = item.dataset.map || selectedMap;
}

mapItems.forEach(item => {
    item.addEventListener("click", () => selectMap(item));
    item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectMap(item);
        }
    });
});


// ---------- CAPTURAR SELECCION DE PERSONAJE ----------
const charItems = document.querySelectorAll(".char-item");
let selectedChar = "1";

function selectChar(item) {
    charItems.forEach(i => {
        i.classList.remove("selected");
        i.setAttribute("aria-selected", "false");
    });
    item.classList.add("selected");
    item.setAttribute("aria-selected", "true");
    selectedChar = item.dataset.char || selectedChar;
}

charItems.forEach(item => {
    item.addEventListener("click", () => selectChar(item));
    item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectChar(item);
        }
    });
});


// ---------- BOTON JUGAR ----------
document.querySelector(".btn-play").addEventListener("click", startGame);


function startGame() {

    // Ocultar menú (protegido si no existe)
    const menuEl = document.getElementById("menu");
    if (menuEl) menuEl.classList.add("hidden");

    // Mostrar juego
    document.getElementById("game").classList.remove("hidden");

    // Iniciar el juego (lógica en juego.js)
    if (window.dragonRush && typeof window.dragonRush.start === "function") {
        window.dragonRush.start(selectedMap, selectedChar);
    } else {
        console.warn("dragonRush.start no está disponible");
    }
}
