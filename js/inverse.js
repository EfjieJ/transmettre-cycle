/* 4. L'inverse : entre celle qui sait et celui qui a besoin de savoir, des étapes en trop.
   Chacune garde une part de l'élan. Touche-les : elles s'effacent, la chaîne se raccourcit. */
(function(){
  const el = document.getElementById('cv-inv');
  const hint = document.getElementById('hint-inv'), endEl = document.getElementById('end-inv');
  const C = T.col, TAU = Math.PI*2;
  const s = T.canvas(el);

  const base = () => [
    { kind:'p', label:'sait' },
    { kind:'b', label:'certifie sans enseigner' },
    { kind:'b', label:'vend l\u2019accès' },
    { kind:'b', label:'vit de la distance' },
    { kind:'p', label:'a besoin de savoir' }
  ].map(n => ({ ...n, alive: 1, gone: false, x: null, hover: 0, kept: 0 }));
  let nodes = base(), pulse = { x: 0, str: 1, wait: 0, passed: new Set() }, simple = 0, arrive = 0;

  function live(){ return nodes.filter(n => n.alive > 0.01); }
  function targets(w){
    const L = live().filter(n => !n.gone), cnt = L.length, span = T.lerp(w*0.42, w*0.84, (cnt-2)/3);
    const t = new Map(); L.forEach((n, i) => t.set(n, w/2 - span/2 + span*i/(cnt-1))); return t;
  }
  function remove(n){ if (n.kind !== 'b' || n.gone) return; n.gone = true; if (nodes.every(m => m.kind === 'p' || m.gone)){ hint.classList.add('off'); endEl.classList.add('on'); } }
  function nearest(p){ const y = s.h/2; let best = null, bd = 44; nodes.forEach(n => { if (n.kind !== 'b' || n.gone || n.x == null) return; const d = Math.hypot(n.x - p.x, y - p.y); if (d < bd){ bd = d; best = n; } }); return best; }

  T.pointer(el, { down(p){ const n = nearest(p); if (n) remove(n); }, hover(p){ const n = nearest(p); nodes.forEach(m => m.hoverOn = m === n); el.style.cursor = n ? 'pointer' : 'default'; } });
  el.tabIndex = 0;
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); const n = nodes.find(m => m.kind === 'b' && !m.gone); if (n) remove(n); } });
  document.getElementById('reset-inv').addEventListener('click', () => { nodes = base(); simple = 0; pulse = { x: 0, str: 1, wait: 0, passed: new Set() }; hint.classList.remove('off'); endEl.classList.remove('on'); });

  T.loop(el, (dt, t) => {
    const { ctx, w, h } = s; if (!w) return;
    const y = h/2, R = T.reduced, tg = targets(w);
    nodes.forEach(n => {
      if (n.gone) n.alive = Math.max(0, n.alive - dt*(R ? 50 : 1.4));
      const tx = tg.has(n) ? tg.get(n) : n.x;
      n.x = n.x == null ? tx : T.lerp(n.x, tx, Math.min(1, dt*(R ? 60 : 3.5)));
      n.hover = T.lerp(n.hover, n.hoverOn ? 1 : 0, Math.min(1, dt*10));
      n.kept = Math.max(0, n.kept - dt*0.5);
    });
    const vis = nodes.filter(n => n.alive > 0.01), first = vis[0], last = vis[vis.length-1];
    const allGone = nodes.every(n => n.kind === 'p' || n.alive <= 0.01);
    simple = T.lerp(simple, allGone ? 1 : 0, Math.min(1, dt*(R ? 60 : 2)));

    // l'élan voyage de gauche à droite
    if (pulse.wait > 0) pulse.wait -= dt;
    else {
      pulse.x += dt * (R ? 2000 : 220);
      vis.forEach(n => { if (n.kind === 'b' && !n.gone && !pulse.passed.has(n) && pulse.x >= n.x - first.x){ pulse.passed.add(n); pulse.str *= 0.55; pulse.wait = R ? 0 : 0.6; n.kept = 1; } });
      if (pulse.x >= last.x - first.x){ arrive = pulse.str; pulse = { x: 0, str: 1, wait: R ? 0.3 : 0.9, passed: new Set() }; }
    }
    arrive = Math.max(0, arrive - dt*0.8);

    ctx.clearRect(0, 0, w, h);
    // la ligne
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(first.x, y); ctx.lineTo(last.x, y); ctx.stroke();

    // les trois gestes, quand il ne reste que l'essentiel
    if (simple > 0.02){
      ['montrer','refaire','vérifier'].forEach((lab, i) => { const x = T.lerp(first.x, last.x, (i+1)/4);
        ctx.fillStyle = T.alpha(C.accent, simple); ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill();
        ctx.font = '13px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(lab, x, y - 18); });
    }

    // les nœuds
    vis.forEach(n => {
      const a = n.alive;
      if (n.kind === 'p'){
        const g = n === last ? arrive : 0;
        if (g > 0.02){ ctx.fillStyle = T.alpha(C.accent, 0.2*g); ctx.beginPath(); ctx.arc(n.x, y, 14 + 22*g, 0, TAU); ctx.fill(); }
        ctx.fillStyle = T.mix(g); ctx.beginPath(); ctx.arc(n.x, y, 11, 0, TAU); ctx.fill();
        ctx.fillStyle = C.soft; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(n.label, n.x, y + 34);
      } else {
        const sz = 26 * a * (1 + 0.12*n.hover);
        ctx.fillStyle = C.bg; ctx.fillRect(n.x - sz/2, y - sz/2, sz, sz);
        ctx.fillStyle = T.alpha(C.ink, 0.12*n.kept*a); ctx.fillRect(n.x - sz/2, y - sz/2, sz, sz);
        ctx.strokeStyle = T.alpha(n.hover > 0.5 ? C.accent : C.ink, a); ctx.lineWidth = 1.5; ctx.strokeRect(n.x - sz/2, y - sz/2, sz, sz);
        ctx.fillStyle = T.alpha(C.ink, 0.75*a); ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center';
        const words = n.label.split(' '), mid = Math.ceil(words.length/2);
        const l1 = words.length > 2 ? words.slice(0, mid).join(' ') : n.label, l2 = words.length > 2 ? words.slice(mid).join(' ') : '';
        ctx.fillText(l1, n.x, y + 36); if (l2) ctx.fillText(l2, n.x, y + 52);
      }
    });

    // l'élan : il rétrécit à chaque étape en trop
    if (pulse.wait <= 0 || pulse.x > 0){
      const px = first.x + pulse.x, r = 3 + 7*pulse.str;
      ctx.fillStyle = T.alpha(C.accent, 0.25 + 0.75*pulse.str); ctx.beginPath(); ctx.arc(px, y, r, 0, TAU); ctx.fill();
    }
  });
})();
