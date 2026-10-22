/* 1. Le cycle nu : appuyer lance, garder prolonge, tirer en arrière freine. Sans relance, ça s'éteint. */
(function(){
  const el = document.getElementById('cv-cycle');
  const hint = document.getElementById('hint-cycle');
  const phases = [...document.querySelectorAll('.phases li')];
  const C = T.col;
  const s = T.canvas(el);
  const img = document.getElementById('img-cycle');

  const st = { x: 0, v: 0, lap: 0, push: false, brake: 0, trail: [], ghosts: [], glow: 0, idle: 0, touched: false, phase: -1, lastX: null, holdT: 0 };
  const MAXV = 900;

  function setPhase(p){
    if (p === st.phase) return; st.phase = p;
    phases.forEach((li,i) => li.classList.toggle('on', i === p));
  }

  function start(){ return s.w*0.12; }
  function end(){ return s.w*0.88; }

  T.pointer(el, {
    down(p){ st.push = true; st.lastX = p.x; st.holdT = 0;
      if (!st.touched){ st.touched = true; hint.textContent = 'garde appuyé · tire vers l\u2019arrière pour freiner'; setTimeout(()=>hint.classList.add('off'), 5000); }
    },
    move(p){ if (st.lastX !== null){ const dx = p.x - st.lastX; if (dx < 0) st.brake += -dx; st.lastX = p.x; } },
    up(){ st.push = false; st.lastX = null; }
  });
  // clavier : espace = pousser, flèche gauche = freiner
  el.tabIndex = 0;
  el.addEventListener('keydown', e => { if (e.code === 'Space'){ e.preventDefault(); st.push = true; st.touched = true; } if (e.code === 'ArrowLeft') st.brake += 60; });
  el.addEventListener('keyup', e => { if (e.code === 'Space') st.push = false; });

  T.loop(el, (dt, t) => {
    const { ctx, w, h } = s; if (!w) return;
    const y = h*0.8, x0 = start(), x1 = end(), L = x1 - x0;

    // physique : poussée, frottement, frein
    if (st.push){ st.holdT += dt; st.v += (520 + 260*Math.min(1, st.holdT)) * dt; }
    if (st.brake > 0){ st.v -= st.brake * 9; st.brake = 0; }
    st.v -= (st.v * 0.55 + 18) * dt;           // ce qui ne se relance pas s'use
    st.v = T.clamp(st.v, 0, MAXV);
    if (st.v < 4 && !st.push) st.v = 0;

    const prevX = st.x;
    st.x += st.v * dt;
    if (st.x >= L){ // un tour de plus : la ligne repart, l'ancienne s'efface
      st.ghosts.push({ a: 1 }); st.x -= L; st.lap++; st.trail = [];
    }
    if (st.v > 0) st.trail.push({ x: st.x, v: st.v });
    if (st.trail.length > 1200) st.trail.shift();

    // phases
    if (st.push && st.v < 140) setPhase(0);
    else if (st.v > 0 && !(st.push && st.v < 140)) setPhase(st.v < 70 && !st.push ? 2 : 1);
    else if (st.touched && st.v === 0) { st.idle += dt; setPhase(st.idle < 1.6 ? 2 : -1); }
    if (st.v > 0) st.idle = 0;

    // extinction : sans relance, la ligne pâlit puis disparaît
    const life = st.v > 0 || st.push ? 1 : Math.max(0, 1 - st.idle/2.4);
    if (st.v === 0 && st.idle > 2.4 && st.trail.length){ st.trail = []; st.x = 0; st.ghosts = []; st.lap = 0; }

    if (img && !T.reduced) img.style.transform = 'scale(' + (1 + 0.035*st.v/MAXV).toFixed(4) + ')';
    ctx.clearRect(0,0,w,h);
    // rail
    ctx.strokeStyle = C.faint; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    // tours précédents
    st.ghosts = st.ghosts.filter(g => (g.a -= dt*(T.reduced?3:0.7)) > 0);
    st.ghosts.forEach(g => { ctx.strokeStyle = T.alpha(C.ink, 0.25*g.a); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0,y); ctx.lineTo(x1,y); ctx.stroke(); });

    // la ligne : épaisseur = élan reçu à cet endroit
    if (st.trail.length > 1){
      ctx.lineCap = 'round';
      for (let i = 1; i < st.trail.length; i++){
        const a = st.trail[i-1], b = st.trail[i];
        const k = b.v / MAXV;
        ctx.strokeStyle = T.alpha(C.ink, (0.35 + 0.65*life) * life);
        ctx.lineWidth = 1.2 + k*7;
        ctx.beginPath(); ctx.moveTo(x0 + a.x, y); ctx.lineTo(x0 + b.x, y); ctx.stroke();
      }
    }

    // la tête
    const hx = x0 + st.x, k = st.v / MAXV;
    if (st.touched || st.v > 0){
      const r = 5 + k*10;
      if (st.push){ ctx.fillStyle = T.alpha(C.accent, 0.12); ctx.beginPath(); ctx.arc(hx, y, r + 18 + 6*Math.sin(t*12), 0, 7); ctx.fill(); }
      ctx.fillStyle = st.push ? C.accent : T.alpha(C.ink, Math.max(0.15, life));
      ctx.beginPath(); ctx.arc(hx, y, r, 0, 7); ctx.fill();
      // traces d'élan devant
      if (st.v > 40){ for (let i=1;i<=3;i++){ ctx.fillStyle = T.alpha(C.ink, 0.18*k*(4-i)/3); ctx.beginPath(); ctx.arc(hx + i*(10+k*22), y, 2, 0, 7); ctx.fill(); } }
    } else {
      // invitation : un point qui respire au départ
      const b = T.reduced ? 0.5 : (Math.sin(t*2.2)+1)/2;
      ctx.strokeStyle = T.alpha(C.ink, 0.25 + 0.3*b); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x0, y, 14 + b*6, 0, 7); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x0, y, 5, 0, 7); ctx.fill();
    }

    // compteur de tours, discret
    if (st.lap > 0){ ctx.fillStyle = C.soft; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillText('×' + (st.lap+1), x1, y - 22); }
  });
})();
