(() => {

  /* =============================
     SELECTORES Y CACHE DE NODOS
  ==============================*/
  const $ = id => document.getElementById(id);

  const juegoEl = $('game');
  const dragonEl = $('dragon');
  const obstaculosEl = $('obstacles');
  const parallaxEl = $('parallax-container');
  const hudBonusTxt = $('bonus-counter-text');

  const overlayFin = $('overlay-gameover');
  const overlayWin = $('overlay-gamewin');
  const overlayPause = $('overlay-pause');

  /* =============================
     CONSTANTES
  ==============================*/
  const GRAV = 0.4, IMPULSO = -8;
  const VEL = 3, GAP = 200, PNG_W = 130;
  const INTERVALO = 2500, META_BONUS = 3;
  const HIT = { DX:24, DY:24, OX:12, OY:12 };

  /* =============================
     ESTADO DEL JUEGO
  ==============================*/
  let running = false, paused = false;
  let velY = 0, posY = 300;
  let nextSpawn = 0, spawnRest = null, spawnTimer = null;
  let mapSel = null, charSel = null;

  const obstaculos = [];
  const bonus = [];
  let bonusSize = null;
  let bonusCount = 0;
  let pairCount = 0;

  /* =============================
     HELPERS
  ==============================*/
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const shrink = (r,x,y)=>({left:r.left+x,right:r.right-x,top:r.top+y,bottom:r.bottom-y});
  const show = el=>el.classList.add('show');
  const hide = el=>el.classList.remove('show');

  const hideAllOverlays = ()=>{ hide(overlayFin); hide(overlayWin); hide(overlayPause); };
  const updateHUD = ()=> hudBonusTxt.textContent = `${bonusCount}/${META_BONUS}`;

  const clearScene = ()=>{
    obstaculosEl.innerHTML='';
    obstaculos.length=0;
    bonus.length=0;
    bonusCount=0;
    pairCount=0;
    updateHUD();
  };

  /* =============================
     PARALLAX
  ==============================*/
  function cargarParallax(map){
    parallaxEl.innerHTML='';
    let i=1;
    const base=`./assetsJuego/background/${map}/`;

    (function cargar(){
      const img=new Image();
      img.src=`${base}${i}.png`;
      img.onload=()=>{
        const capa=document.createElement('div');
        capa.className='parallax-layer';
        capa.style.backgroundImage=`url('${img.src}')`;
        capa.style.animationDuration=`${8+i*2}s`;

        const h=parallaxEl.clientHeight;
        capa.style.setProperty('--tile-w',`${Math.round((img.naturalWidth*h)/img.naturalHeight)}px`);

        parallaxEl.appendChild(capa);
        i++; cargar();
      };
    })();
  }

  /* =============================
     PERSONAJE
  ==============================*/
  function cargarPersonaje(id){
    dragonEl.style.backgroundImage=`url('./assetsJuego/character/144x128/dragon${id}.png')`;
    posY=(juegoEl.clientHeight - dragonEl.clientHeight)/2;
    velY=0;
    dragonEl.style.top=`${posY}px`;
  }

  /* =============================
     BONUS
  ==============================*/
  function cargarBonusSize(cb){
    if(bonusSize) return cb();
    const img=new Image();
    img.src='./assetsJuego/extras/bonus/bonus1.png';
    img.onload=()=>{ bonusSize={w:img.naturalWidth,h:img.naturalHeight}; cb(); };
    img.onerror=()=>{ bonusSize={w:24,h:24}; cb(); };
  }

  function crearBonus(){
    cargarBonusSize(()=>{
      const b=document.createElement('div');
      b.className='bonus';
      b.style.width=`${bonusSize.w}px`;
      b.style.height=`${bonusSize.h}px`;
      b.style.left='1100px';

      const h=juegoEl.clientHeight;
      const y=Math.random()*(h - bonusSize.h - 100) + 50;
      b.style.top=`${y}px`;

      obstaculosEl.appendChild(b);
      bonus.push(b);
    });
  }

  function animBonus(rect){
    const fly=document.createElement('div');
    fly.className='bonus-fly';
    fly.textContent='+';

    const g=juegoEl.getBoundingClientRect();
    const c=$('bonus-counter').getBoundingClientRect();

    fly.style.setProperty('--from-x',`${rect.left+rect.width/2 - g.left}px`);
    fly.style.setProperty('--from-y',`${rect.top+rect.height/2 - g.top}px`);
    fly.style.setProperty('--to-x',`${c.left+c.width/2 - g.left}px`);
    fly.style.setProperty('--to-y',`${c.top+c.height/2 - g.top}px`);
    fly.style.setProperty('--anim-dur','.7s');

    juegoEl.appendChild(fly);

    fly.addEventListener('animationend',()=>{
      fly.remove();
      updateHUD();
      if(bonusCount>=META_BONUS) victoria();
    },{once:true});
  }

  /* =============================
     OBSTÁCULOS
  ==============================*/
  function spawnObstaculos(delay=INTERVALO){
    clearTimeout(spawnTimer);
    spawnRest=null;
    nextSpawn=performance.now()+delay;

    spawnTimer=setTimeout(function tick(){
      if(running && !paused) crearObstaculo();
      nextSpawn=performance.now()+INTERVALO;
      spawnTimer=setTimeout(tick,INTERVALO);
    },delay);
  }

  function stopSpawn(){
    clearTimeout(spawnTimer);
    spawnRest=nextSpawn ? Math.max(0,nextSpawn-performance.now()) : null;
    nextSpawn=0;
  }

  function crearObstaculo(){
    const h=juegoEl.clientHeight;
    const gapY=Math.random()*(h - GAP - 160)+80;

    const crear=(top,alto,flip)=>{
      const o=document.createElement('div');
      o.className='obstacle';
      o.style.cssText=`
        position:absolute;
        left:1300px;
        width:${PNG_W}px;
        top:${top}px;
        height:${alto}px;
        background-image:url('../assetsJuego/extras/obstacle/obstaculo.png');
        background-repeat:repeat-y;
        background-size:${PNG_W}px auto;
        ${flip?'transform:scaleY(-1);':''}
      `;
      obstaculosEl.appendChild(o);
      obstaculos.push(o);
    };

    crear(0,gapY,true);
    crear(gapY+GAP, h-(gapY+GAP));

    if(++pairCount % 6 === 0) crearBonus();
  }

  /* =============================
     PAUSA / CONTROLES
  ==============================*/
  document.addEventListener('keydown',e=>{
    if(e.code==='Space' && running && !paused){
      e.preventDefault();
      velY=IMPULSO;
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
    spawnObstaculos( spawnRest ?? INTERVALO );
    spawnRest=null;
    hide(overlayPause);
    requestAnimationFrame(loop);
  }

  const togglePause=()=> paused ? reanudar() : pausar();

  /* =============================
     LOOP PRINCIPAL
  ==============================*/
  function moverEntidad(lista,lim){
    for(let i=lista.length-1;i>=0;i--){
      const o=lista[i];
      const x=parseFloat(o.style.left);
      o.style.left=(x-VEL)+'px';
      if(x < lim){ o.remove(); lista.splice(i,1); }
    }
  }

  function loop(){
    if(!running || paused) return;

    velY+=GRAV;
    posY=clamp(posY+velY,0, juegoEl.clientHeight - dragonEl.clientHeight);
    dragonEl.style.top=`${posY}px`;

    moverEntidad(obstaculos,-PNG_W);
    moverEntidad(bonus,-50);

    const d=shrink(dragonEl.getBoundingClientRect(),HIT.DX,HIT.DY);

    // colisión obstáculo
    for(const o of obstaculos){
      const r=shrink(o.getBoundingClientRect(),HIT.OX,HIT.OY);
      if(d.left<r.right && d.right>r.left && d.top<r.bottom && d.bottom>r.top)
        return gameOver();
    }

    // colisión bonus
    for(let i=bonus.length-1;i>=0;i--){
      const b=bonus[i];
      const br=b.getBoundingClientRect();
      if(d.left<br.right && d.right>br.left && d.top<br.bottom && d.bottom>br.top){
        b.remove();
        bonus.splice(i,1);
        bonusCount++;
        animBonus(br);
      }
    }

    requestAnimationFrame(loop);
  }

  /* =============================
     GAME OVER / VICTORIA
  ==============================*/
  const gameOver = () => {
    running = false;
    // Detenemos spawns y loop (loop se detiene porque running=false)
    stopSpawn();
    // Permitir animación de explosión antes de congelar
    if (dragonEl) {
      const onEnd = (ev) => {
        if (ev && ev.animationName !== 'dragonFade' && ev.animationName !== 'explode-fire') {
          return; // filtra si hubiera otras animaciones
        }
        dragonEl.removeEventListener('animationend', onEnd);
        // Congelar todo después de la explosión
        juegoEl.classList.add('halted');
        show(overlayFin);
      };
      dragonEl.addEventListener('animationend', onEnd);
      dragonEl.classList.add('explode-fire');
    } else {
      juegoEl.classList.add('halted');
      show(overlayFin);
    }
  };

  const victoria = () => {
    running = false;
    stopSpawn();
    // Congelar inmediatamente
    juegoEl.classList.add('halted');
    show(overlayWin);
  };

  /* =============================
     BOTONES UI
  ==============================*/
  document.addEventListener('click',e=>{
    const id=e.target.id;
    if(id==='btnRetry') reiniciar();
    if(id==='btnResume') reanudar();
    if(id==='btnMenuFromOver' || id==='btnMenuFromWin' || id==='btnMenuFromPause')
      location.reload();
  });

  /* =============================
     INICIO / REINICIO
  ==============================*/
  function reiniciar(){
    hideAllOverlays();
    paused = false;
    // Quitar congelado previo
    juegoEl.classList.remove('halted');
    clearScene();
    stopSpawn();
    iniciar(mapSel,charSel);
  }

  function iniciar(map,char){
    mapSel=map; charSel=char;
    running=true; paused=false;
    hideAllOverlays();
    juegoEl.classList.remove('halted');
    updateHUD();
    cargarParallax(map);
    cargarPersonaje(char);
    if (dragonEl) {
      dragonEl.classList.remove('explode-fire');
    }
    stopSpawn();
    spawnObstaculos(INTERVALO);
    requestAnimationFrame(loop);
  }

  window.dragonRush = { iniciar, start: iniciar };
})();
