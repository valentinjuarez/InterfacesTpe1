(() => {

/* =======================================
   SELECTORES Y NODOS IMPORTANTES
   (Cache para no buscar en el DOM siempre)
======================================= */
const $ = id => document.getElementById(id);

const juegoEl = $('game');                  // Contenedor del juego
const dragonEl = $('dragon');               // Dragón (sprite)
const obstaculosEl = $('obstacles');        // Contenedor de obstáculos
const parallaxEl = $('parallax-container'); // Fondo con capas parallax
const hudBonusTxt = $('bonus-counter-text');// Texto del contador de bonus

// Overlays de fin, victoria y pausa
const overlayFin = $('overlay-gameover');
const overlayWin = $('overlay-gamewin');
const overlayPause = $('overlay-pause');

/* =======================================
   CONSTANTES GLOBALES DEL JUEGO
======================================= */
const GRAV = 0.4;          // gravedad hacia abajo
const IMPULSO = -8;        // impulso hacia arriba al tocar SPACE
const VEL = 3;             // velocidad de desplazamiento horizontal de objetos
const GAP = 200;           // espacio entre los tubos
const PNG_W = 130;         // ancho de la imagen de obstáculo
const INTERVALO = 2800;    // tiempo entre spawns de obstáculos
const META_BONUS = 3;      // cantidad de bonus para ganar
const HIT = { DX:24, DY:24, OX:12, OY:12 }; // Ajuste hitbox

/* =======================================
   ESTADO INTERNO DEL JUEGO
======================================= */
let running = false;     // juego corriendo
let paused = false;      // juego en pausa
let velY = 0;            // velocidad vertical del dragón
let posY = 300;          // posición vertical inicial
let nextSpawn = 0;       // tiempo del próximo spawn
let spawnRest = null;    // tiempo restante si se pausa
let spawnTimer = null;   // timer de spawn
let mapSel = null;       // mapa seleccionado
let charSel = null;      // personaje seleccionado

// Listas dinámicas
const obstaculos = [];
const bonus = [];

let bonusSize = null;    // tamaño de la imagen bonus
let bonusCount = 0;      // cuántos bonus agarró el jugador
let pairCount = 0;       // cuántos pares de tubos pasaron (para spawnear bonus)

/* =======================================
   HELPERS
======================================= */

// Limita un valor entre dos números (ej: evitar salir de pantalla)
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

// Achica rectángulos para hitbox más justa
const shrink = (r,x,y)=>({
  left:r.left+x,
  right:r.right-x,
  top:r.top+y,
  bottom:r.bottom-y
});

// Mostrar / ocultar overlays
const show = el=>el.classList.add('show');
const hide = el=>el.classList.remove('show');

// Oculta todos los overlays a la vez
const hideAllOverlays = ()=>{ hide(overlayFin); hide(overlayWin); hide(overlayPause); };

// Actualiza contador de bonus
const updateHUD = ()=> hudBonusTxt.textContent = `${bonusCount}/${META_BONUS}`;

// Limpia escena al reiniciar
const clearScene = ()=>{
  obstaculosEl.innerHTML='';
  obstaculos.length=0;
  bonus.length=0;
  bonusCount=0;
  pairCount=0;
  updateHUD();
};

/* =======================================
   PARALLAX (FONDO EN CAPAS)
======================================= */
function cargarParallax(map){
  parallaxEl.innerHTML='';
  let i=1;
  const base = `./assetsJuego/background/${map}/`;

  // Función que carga capa por capa recursivamente
  (function cargar(){
    const img=new Image();
    img.src = `${base}${i}.png`;

    img.onload = ()=>{
      const capa=document.createElement('div');
      capa.className='parallax-layer';
      capa.style.backgroundImage = `url('${img.src}')`;

      // Duración distinta por capa → velocidad distinta = parallax
      capa.style.animationDuration = `${8 + i*2}s`;

      // Calcula el ancho del tile para que no se deforme
      const h = parallaxEl.clientHeight;
      capa.style.setProperty('--tile-w', `${Math.round((img.naturalWidth*h)/img.naturalHeight)}px`);

      parallaxEl.appendChild(capa);
      i++;
      cargar(); // intenta cargar la siguiente capa
    };

    // Cuando no existe la siguiente imagen, detenemos la recursión
    img.onerror = ()=>{
      // no hay más capas; solo detenemos la carga
    };
  })();
}

/* =======================================
   PERSONAJE
======================================= */
function cargarPersonaje(id){
  // Asigna sprite sheet del personaje elegido
  dragonEl.style.backgroundImage = `url('./assetsJuego/character/144x128/dragon${id}.png')`;

  // Lo centra verticalmente
  posY = (juegoEl.clientHeight - dragonEl.clientHeight)/2;
  velY = 0;
  dragonEl.style.top = `${posY}px`;
}

/* =======================================
   BONUS
======================================= */

// Carga tamaño real del bonus una vez
function cargarBonusSize(cb){
  if(bonusSize) return cb(); // si ya está cargado, seguimos
  const img=new Image();
  img.src='./assetsJuego/extras/bonus/bonus1.png';
  img.onload=()=>{ bonusSize={w:img.naturalWidth,h:img.naturalHeight}; cb(); };
  img.onerror=()=>{ bonusSize={w:24,h:24}; cb(); };
}

// Crea un bonus en posición random
function crearBonus(){
  cargarBonusSize(()=>{
    const b=document.createElement('div');
    b.className='bonus';
    b.style.width = `${bonusSize.w}px`;
    b.style.height = `${bonusSize.h}px`;
    b.style.left='1100px'; // aparece fuera de pantalla

    const h=juegoEl.clientHeight;
    const y=Math.random()*(h - bonusSize.h - 100) + 50;
    b.style.top = `${y}px`;

    obstaculosEl.appendChild(b);
    bonus.push(b);
  });
}

// Animación del bonus volando al HUD
function animBonus(rect){
  const fly=document.createElement('div');
  fly.className='bonus-fly';
  fly.textContent='+';

  const g=juegoEl.getBoundingClientRect();
  const c=$('bonus-counter').getBoundingClientRect();

  // Coordenadas desde la posición donde se recogió
  fly.style.setProperty('--from-x', `${rect.left + rect.width/2 - g.left}px`);
  fly.style.setProperty('--from-y', `${rect.top + rect.height/2 - g.top}px`);

  // Hacia el contador del HUD
  fly.style.setProperty('--to-x', `${c.left + c.width/2 - g.left}px`);
  fly.style.setProperty('--to-y', `${c.top + c.height/2 - g.top}px`);
  fly.style.setProperty('--anim-dur', '.7s');

  juegoEl.appendChild(fly);

  // Cuando termina la animación
  fly.addEventListener('animationend',()=>{
    fly.remove();
    updateHUD();
    if(bonusCount >= META_BONUS) victoria();
  },{once:true});
}

/* =======================================
   OBSTÁCULOS
======================================= */

// Maneja el spawn repetitivo
function spawnObstaculos(delay=INTERVALO){
  clearTimeout(spawnTimer);
  spawnRest=null;
  nextSpawn=performance.now()+delay;//primer spawn

  // Función que se repite cada intervalo
  spawnTimer=setTimeout(function tick(){
    if(running && !paused){
      crearObstaculo();
    }
    nextSpawn=performance.now()+INTERVALO;
    spawnTimer=setTimeout(tick,INTERVALO);
  },delay);
}

// Pausa creación de obstáculos guardando cuánto faltaba
function stopSpawn(){
  clearTimeout(spawnTimer);
  spawnRest = nextSpawn ? Math.max(0,nextSpawn - performance.now()) : null;
  nextSpawn = 0;
}

// Crea UN par de obstáculos (arriba y abajo)
function crearObstaculo(){
  const h=juegoEl.clientHeight;
  const gapY=Math.random()*(h - GAP - 160)+80;//distancia de tubos

  // Función auxiliar para crear un tubo
  const crear=(top,alto,flip)=>{
    const o=document.createElement('div');
    o.className='obstacle';

    const startLeft = juegoEl.clientWidth + 100;//aparece fuera de pantalla

    // Estilo del tubo
    o.style.cssText=`
      position:absolute;
      left:${startLeft}px;
      width:${PNG_W}px;
      top:${top}px;
      height:${alto}px;
      background-image:url('./assetsJuego/extras/obstacle/obstaculo.png');
      background-repeat:repeat-y;
      background-size:${PNG_W}px auto;
      ${flip?'transform:scaleY(-1);':''}
    `;

    obstaculosEl.appendChild(o);
    obstaculos.push(o);
  };

  // Tubo superior
  crear(0, gapY, true);
  // Tubo inferior
  crear(gapY+GAP, h-(gapY+GAP));

  // Cada 6 pares → bonus
  if(++pairCount % 6 === 0) crearBonus();
}

/* =======================================
   PAUSA / CONTROLES
======================================= */

// Input principal del jugador
document.addEventListener('keydown',e=>{
  if(e.code==='Space' && running && !paused){
    e.preventDefault();
    velY = IMPULSO; // impulsa hacia arriba
  }
  if(e.code==='Escape' && running) togglePause();
});

function pausar(){
  if(!running || paused) return;
  paused=true;
  stopSpawn();
  juegoEl.classList.add('paused');
  hideAllOverlays();
  show(overlayPause);
}

function reanudar(){
  if(!running || !paused) return;
  paused=false;
  juegoEl.classList.remove('paused');
  spawnObstaculos(spawnRest ?? INTERVALO);
  spawnRest=null;
  hide(overlayPause);
  requestAnimationFrame(loop);
}

const togglePause = ()=> paused ? reanudar() : pausar();

/* =======================================
   LOOP PRINCIPAL
======================================= */

// Mueve obstáculos y bonus hacia la izquierda
function moverEntidad(lista,lim){
  for(let i=lista.length-1;i>=0;i--){
    const o=lista[i];
    const x=parseFloat(o.style.left);

    // Movimiento
    o.style.left=(x - VEL)+'px';

    // Si se fue de pantalla → eliminarlo
    if(x < lim){
      o.remove();
      lista.splice(i,1);
    }
  }
}

function loop(){
  if(!running || paused) return;

  // Física del dragón
  velY += GRAV;
  posY = clamp(posY + velY, 0, juegoEl.clientHeight - dragonEl.clientHeight);// evita salir de pantalla
  dragonEl.style.top = `${posY}px`;// aplica posición

  // Movimiento de obstáculos y bonus
  moverEntidad(obstaculos, -PNG_W);
  moverEntidad(bonus, -50);

  // Rect del dragón
  const d = shrink(dragonEl.getBoundingClientRect(), HIT.DX, HIT.DY);// hitbox más justa

  // Colisión con obstáculos
  for(const o of obstaculos){
    const r = shrink(o.getBoundingClientRect(), HIT.OX, HIT.OY);
    if(d.left<r.right && d.right>r.left && d.top<r.bottom && d.bottom>r.top)
      return gameOver();
  }

  // Colisión con bonus
  for(let i=bonus.length-1;i>=0;i--){
    const b = bonus[i];
    const br = b.getBoundingClientRect();

    if(d.left<br.right && d.right>br.left && d.top<br.bottom && d.bottom>br.top){
      b.remove();
      bonus.splice(i,1);
      bonusCount++;
      animBonus(br);
    }
  }

  requestAnimationFrame(loop);
}

/* =======================================
   GAME OVER / VICTORIA
======================================= */
const gameOver = () => {
  running = false;
  stopSpawn();

  if (dragonEl) {
    // Espera a que termine la animación de explosión
    const onEnd = (ev) => {
      if (ev && ev.animationName !== 'dragonFade' && ev.animationName !== 'explode-fire') {
        return;
      }
      dragonEl.removeEventListener('animationend', onEnd);// evita múltiples llamadas
      juegoEl.classList.add('halted'); // congela escena
      show(overlayFin);
    };

    dragonEl.addEventListener('animationend', onEnd);
    dragonEl.classList.add('explode-fire'); // activa animación
  } 
  else {
    juegoEl.classList.add('halted');
    show(overlayFin);
  }
};

const victoria = () => {
  running = false;
  stopSpawn();
  juegoEl.classList.add('halted');
  show(overlayWin);
};

/* =======================================
   BOTONES UI
======================================= */
document.addEventListener('click',e=>{
  const id=e.target.id;
  if(id==='btnRetry') reiniciar();
  if(id==='btnResume') reanudar();
  if(id==='btnMenuFromOver' || id==='btnMenuFromWin' || id==='btnMenuFromPause')
    location.reload();
});

/* =======================================
   INICIO / REINICIO DEL JUEGO
======================================= */
function reiniciar(){
  hideAllOverlays();
  paused = false;
  juegoEl.classList.remove('halted');
  clearScene();
  stopSpawn();
  iniciar(mapSel,charSel);
}

function iniciar(map,char){
  mapSel = map;
  charSel = char;
  running = true;
  paused = false;
  hideAllOverlays();
  juegoEl.classList.remove('halted');//pausa animaciones
  updateHUD();//actualiza contador
  cargarParallax(map);
  cargarPersonaje(char);

  if (dragonEl) dragonEl.classList.remove('explode-fire');

  stopSpawn();
  spawnObstaculos(INTERVALO);
  requestAnimationFrame(loop);
}

// API pública
window.dragonRush = { iniciar, start: iniciar };

})();