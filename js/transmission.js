/* 3. Transmission : le mentor montre un geste, l'onde passe jusqu'à toi, tu le refais.
   Si ça tient, l'onde continue de personne en personne. Sinon, tout revient au départ. */
(function(){
  const el = document.getElementById('cv-trans');
  const statusEl = document.getElementById('status-trans');
  const stepEls = [...document.querySelectorAll('.steps li')];
  const afterEl = document.getElementById('after-trans');
  const againBtn = document.getElementById('again-trans');
  const payBtn = document.getElementById('paybtn'), payNote = document.getElementById('paynote');
  const C = T.col, TAU = Math.PI*2;

  // ---- lien PayPal (à configurer dans config.js) ----
  const LINK = (window.TRANSMETTRE_CONFIG || {}).PAYPAL_LINK || 'PAYPAL_LINK_ICI';
  const placeholder = !/^https?:\/\//.test(LINK) || LINK.includes('PAYPAL_LINK_ICI');
  if (placeholder){ payBtn.href = '#'; payBtn.addEventListener('click', e => { e.preventDefault(); payNote.hidden = false; }); }
  else { payBtn.href = LINK; payBtn.target = '_blank'; }

  // ---- les gestes (coordonnées 0..1 dans le cadre) ----
  const N = 64;
  const gen = f => Array.from({length: N}, (_, i) => f(i/(N-1)));
  const poly = pts => t => { const seg = pts.length-1, x = Math.min(seg-1e-9, t*seg), i = Math.floor(x), f = x-i; return [T.lerp(pts[i][0],pts[i+1][0],f), T.lerp(pts[i][1],pts[i+1][1],f)]; };
  const SHAPES = [
    gen(t => [0.12 + 0.76*t, 0.5 - 0.26*Math.sin(t*3*Math.PI)]),                       // vague
    gen(t => [0.5 + 0.32*Math.sin(TAU*t*0.92), 0.5 + 0.32*Math.cos(TAU*t*0.92)]),       // boucle
    gen(poly([[0.14,0.28],[0.38,0.76],[0.62,0.28],[0.86,0.76]])),                         // zigzag
    gen(t => { const r = 0.38*(1 - 0.82*t), a = t*3.6*Math.PI; return [0.5 + r*Math.cos(a), 0.5 + r*Math.sin(a)]; }) // spirale
  ];

  function resample(pts, n){
    if (pts.length < 2) return null;
    const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i-1] + Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]));
    const L = d[d.length-1]; if (L <= 0) return null;
    const out = []; let j = 0;
    for (let k = 0; k < n; k++){ const tt = L*k/(n-1); while (j < d.length-2 && d[j+1] < tt) j++; const f = (tt - d[j])/((d[j+1]-d[j]) || 1); out.push([T.lerp(pts[j][0],pts[j+1][0],f), T.lerp(pts[j][1],pts[j+1][1],f)]); }
    return { pts: out, len: L };
  }
  const pathLen = pts => pts.reduce((a,p,i) => i ? a + Math.hypot(p[0]-pts[i-1][0], p[1]-pts[i-1][1]) : 0, 0);
  function check(user, ref){
    const U = resample(user, 40), R = resample(ref, 40); if (!U || !R) return { ok:false, d:1 };
    let d = 0; for (let i = 0; i < 40; i++) d += Math.hypot(U.pts[i][0]-R.pts[i][0], U.pts[i][1]-R.pts[i][1]); d /= 40;
    const ratio = U.len / R.len;
    return { ok: d < 0.12 && ratio > 0.55 && ratio < 1.7, d, ratio };
  }

  // ---- mise en page ----
  let L = null;
  function layout(w, h){
    const wide = w > h*1.05;
    let b1, b2, M, A, nodes, segs;
    if (wide){
      const side = Math.min(w*0.36, h*0.6), top = h*0.05;
      b1 = { x: w*0.27 - side/2, y: top, s: side }; b2 = { x: w*0.73 - side/2, y: top, s: side };
      M = [w*0.27, top + side + h*0.08]; A = [w*0.73, M[1]];
      const ny = h*0.92; nodes = [[w*0.86, ny], [w*0.5, ny], [w*0.14, ny]];
      segs = [[M, A], [A, nodes[0]], [nodes[0], nodes[1]], [nodes[1], nodes[2]], [nodes[2], M]];
    } else {
      const side = Math.min(w*0.68, h*0.32), x = w*0.24;
      b1 = { x, y: h*0.03, s: side }; b2 = { x, y: h*0.03 + side + h*0.05, s: side };
      M = [w*0.1, b1.y + side/2]; A = [w*0.1, b2.y + side/2];
      const ny = b2.y + side + (h - b2.y - side)/2; nodes = [[w*0.22, ny], [w*0.52, ny], [w*0.82, ny]];
      segs = [[M, A], [A, nodes[0]], [nodes[0], nodes[1]], [nodes[1], nodes[2]], [nodes[2], [w*0.96, ny], [w*0.96, h*0.012], [w*0.1, h*0.012], M]];
    }
    // anneau complet pour la circulation : M → A → n1 → n2 → n3 → M
    const ring = []; segs.forEach((sg, i) => sg.forEach((p, j) => { if (i && !j) return; ring.push(p); }));
    const cum = [0]; for (let i = 1; i < ring.length; i++) cum.push(cum[i-1] + Math.hypot(ring[i][0]-ring[i-1][0], ring[i][1]-ring[i-1][1]));
    const at = p => { let best = 0, bd = 1e9; ring.forEach((q,i) => { const d = Math.hypot(q[0]-p[0], q[1]-p[1]); if (d < bd){ bd = d; best = i; } }); return cum[best]; };
    const people = [M, A, ...nodes].map((p, i) => ({ p, d: i === 0 ? 0 : at(p) }));
    L = { wide, b1, b2, M, A, nodes, ring, cum, total: cum[cum.length-1], people, dA: people[1].d };
  }
  const s = T.canvas(el, s => layout(s.w, s.h));

  function ringPoint(d){
    const { ring, cum, total } = L; d = ((d % total) + total) % total;
    let i = 1; while (i < cum.length-1 && cum[i] < d) i++;
    const f = (d - cum[i-1]) / ((cum[i]-cum[i-1]) || 1), a = ring[i-1], b = ring[i];
    return [T.lerp(a[0],b[0],f), T.lerp(a[1],b[1],f), Math.atan2(b[1]-a[1], b[0]-a[0])];
  }

  // ---- état ----
  const st = { phase: 'montrer', t: 0, shape: 0, user: [], drawing: false, head: 0, tail: 0, laps: 0, glow: [0,0,0,0,0], mini: [0,0,0,0,0], result: null, back: 0 };
  function go(phase){
    st.phase = phase; st.t = 0;
    const ph = { montrer:'montrer', passer:'montrer', refaire:'refaire', verifier:'refaire', tient:'tient', casse:'montrer', retour:'montrer' }[phase];
    document.querySelectorAll('#photos-trans img').forEach(im => im.classList.toggle('on', im.dataset.ph === ph));
    const si = { montrer:0, passer:0, refaire:1, verifier:2, tient:2, casse:2, retour:2 }[phase];
    stepEls.forEach((li, i) => { li.classList.toggle('on', i === si); li.classList.toggle('done', i < si); });
    statusEl.textContent = { montrer:'regarde', passer:'', refaire:'à toi · refais le même geste', verifier:'…', tient:'ça tient · ça passe', casse:'ça casse · on recommence', retour:'ça casse · on recommence' }[phase];
  }
  function restart(next){
    if (next) st.shape = (st.shape + 1) % SHAPES.length;
    st.user = []; st.laps = 0; st.result = null; st.mini = [0,0,0,0,0]; afterEl.hidden = true; payNote.hidden = true;
    go('montrer');
  }
  againBtn.addEventListener('click', () => { restart(true); el.scrollIntoView({ block: 'center', behavior: T.reduced ? 'auto' : 'smooth' }); });

  const toBox = (p, b) => [(p.x - b.x)/b.s, (p.y - b.y)/b.s];
  T.pointer(el, {
    down(p){ if (st.phase !== 'refaire') return; st.drawing = true; st.user = [toBox(p, L.b2)]; },
    move(p){ if (!st.drawing) return; const q = toBox(p, L.b2), l = st.user[st.user.length-1]; if (Math.hypot(q[0]-l[0], q[1]-l[1]) > 0.004) st.user.push(q); },
    up(){ if (!st.drawing) return; st.drawing = false;
      if (st.user.length < 6 || pathLen(st.user) < 0.15){ st.user = []; return; }
      st.result = check(st.user, SHAPES[st.shape]); go('verifier'); }
  });

  // ---- dessin ----
  function corners(ctx, b, col){
    const k = b.s*0.08; ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath();
    [[b.x,b.y,1,1],[b.x+b.s,b.y,-1,1],[b.x,b.y+b.s,1,-1],[b.x+b.s,b.y+b.s,-1,-1]].forEach(([x,y,dx,dy]) => { ctx.moveTo(x+dx*k, y); ctx.lineTo(x, y); ctx.lineTo(x, y+dy*k); });
    ctx.stroke();
  }
  function stroke(ctx, pts, b, upto, col, lw){
    const n = Math.max(0, Math.min(pts.length, Math.floor(upto))); if (n < 2) return;
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); for (let i = 0; i < n; i++){ const x = b.x + pts[i][0]*b.s, y = b.y + pts[i][1]*b.s; i ? ctx.lineTo(x,y) : ctx.moveTo(x,y); } ctx.stroke();
  }
  // onde qui voyage le long de l'anneau, de d0 à d1 (la tête en d1)
  function wave(ctx, d0, d1, t, col, amp){
    if (d1 - d0 < 1) return;
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath();
    for (let d = d0, first = true; d <= d1; d += 3){
      const [x, y, a] = ringPoint(d), back = d1 - d, env = Math.exp(-Math.pow(back/48, 2));
      const o = amp * env * Math.sin(back*0.22 - t*10);
      const px = x - Math.sin(a)*o, py = y + Math.cos(a)*o; first ? (ctx.moveTo(px, py), first = false) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    const [hx, hy] = ringPoint(d1); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(hx, hy, 4, 0, TAU); ctx.fill();
  }

  T.loop(el, (dt, t) => {
    const { ctx, w, h } = s; if (!w || !L) return;
    st.t += dt;
    const R = T.reduced, shape = SHAPES[st.shape], speed = R ? 4000 : Math.max(260, L.total/4.5);
    ctx.clearRect(0, 0, w, h);

    // anneau discret + cadres
    ctx.strokeStyle = C.faint; ctx.lineWidth = 1; ctx.beginPath(); L.ring.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
    corners(ctx, L.b1, C.soft); corners(ctx, L.b2, st.phase === 'refaire' ? C.ink : C.soft);

    // --- machine à états ---
    const demoDur = R ? 0.4 : 2.4;
    let demo = shape.length;            // part du geste du mentor visible
    let waveTo = null, waveFrom = 0;

    if (st.phase === 'montrer'){
      demo = Math.min(1, st.t/demoDur) * shape.length;
      if (st.t > demoDur + (R ? 0.2 : 0.5)) go('passer');
    }
    if (st.phase === 'passer'){
      const d = Math.min(L.dA, st.t*speed); waveFrom = 0; waveTo = d;
      if (d >= L.dA){ go('refaire'); }
    }
    if (st.phase === 'verifier' && st.t > (R ? 0.2 : 0.7)){
      if (st.result.ok){ go('tient'); st.head = L.dA; }
      else go('casse');
    }
    if (st.phase === 'tient'){
      st.head += speed*dt;
      if (st.head - L.dA >= L.total){ // un tour complet : retour au mentor
        st.laps++; st.head -= L.total;
        if (st.laps === 1){ afterEl.hidden = false; statusEl.textContent = 'la chaîne est complète'; }
      }
      if (R && st.laps >= 1) st.head = L.dA + L.total - 0.01;
      waveFrom = Math.max(st.head - L.total*0.45, L.dA - (st.laps ? L.total : 0)); waveTo = st.head;
    }
    if (st.phase === 'casse'){
      // le geste se défait jusqu'au point de départ
      const k = Math.min(1, st.t/(R ? 0.2 : 0.9));
      stroke(ctx, st.user, L.b2, st.user.length*(1-k), C.accent, 3);
      if (k >= 1) go('retour');
    }
    if (st.phase === 'retour'){
      const d = Math.max(0, L.dA - st.t*speed); waveFrom = 0; waveTo = d;
      if (d <= 0 && st.t > 0.2){ st.user = []; go('montrer'); }
    }

    // --- le geste du mentor ---
    const mCol = st.phase === 'montrer' ? C.accent : C.ink;
    stroke(ctx, shape, L.b1, demo, mCol, 3);
    if (st.phase === 'montrer' && demo < shape.length){ const p = shape[Math.max(0, Math.floor(demo)-1)];
      ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(L.b1.x + p[0]*L.b1.s, L.b1.y + p[1]*L.b1.s, 7, 0, TAU); ctx.fill(); }

    // --- le cadre de l'apprenti ---
    if (['refaire','verifier','tient'].includes(st.phase) || (st.phase === 'casse')){
      if (st.phase === 'refaire'){
        ctx.setLineDash([3,6]); stroke(ctx, shape, L.b2, shape.length, T.alpha(C.ink, 0.22), 2); ctx.setLineDash([]);
        const p0 = shape[0], b = 0.5 + 0.5*Math.sin(t*4);
        ctx.strokeStyle = T.alpha(C.accent, 0.4 + 0.4*(R?1:b)); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(L.b2.x + p0[0]*L.b2.s, L.b2.y + p0[1]*L.b2.s, 10 + (R?0:b*4), 0, TAU); ctx.stroke();
      }
      if (st.phase !== 'casse'){
        const col = st.phase === 'tient' ? C.accent : C.ink;
        if (st.phase === 'verifier'){ // un trait qui balaie : on vérifie
          const k = Math.min(1, st.t/0.7), x = L.b2.x + k*L.b2.s; ctx.strokeStyle = T.alpha(C.accent, 0.5); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x, L.b2.y); ctx.lineTo(x, L.b2.y + L.b2.s); ctx.stroke(); }
        stroke(ctx, st.user, L.b2, st.user.length, col, 3);
      }
    }

    // --- l'onde ---
    if (waveTo != null) wave(ctx, waveFrom, waveTo, t, st.phase === 'retour' ? C.soft : C.accent, R ? 0 : 7);

    // --- les personnes ---
    L.people.forEach((pp, i) => {
      let lit = 0;
      if (st.phase === 'tient'){
        const trav = st.head - L.dA + st.laps*L.total, off = ((pp.d - L.dA) % L.total + L.total) % L.total;
        if (trav >= off){ const rel = ((st.head - pp.d) % L.total + L.total) % L.total; lit = Math.max(0.25, Math.exp(-rel/90)); if (i !== 1) st.mini[i] = Math.min(1, st.mini[i] + dt*(R ? 50 : 2)); }
      }
      if (st.phase === 'passer' && i === 0) lit = Math.exp(-st.t*2);
      if (i === 1 && st.phase === 'refaire') lit = 0.35;
      st.glow[i] = T.lerp(st.glow[i], lit, Math.min(1, dt*10));
      const [x, y] = pp.p, r = i < 2 ? 10 : 7;
      if (st.glow[i] > 0.02){ ctx.fillStyle = T.alpha(C.accent, 0.18*st.glow[i]); ctx.beginPath(); ctx.arc(x, y, r + 14*st.glow[i], 0, TAU); ctx.fill(); }
      ctx.fillStyle = T.mix(st.glow[i]); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      // les suivants refont le geste, en petit
      if (i >= 2 && st.mini[i] > 0){ const b = { x: x - 18, y: y - 52, s: 36 }; stroke(ctx, shape, b, shape.length*st.mini[i], T.alpha(C.accent, 0.9), 1.5); }
    });
    // deux mots seulement
    ctx.fillStyle = C.soft; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center';
    const lab = (p, txt) => { if (L.wide) ctx.fillText(txt, p[0], p[1] + 28); else { ctx.save(); ctx.translate(p[0], p[1] + 26); ctx.fillText(txt, 0, 0); ctx.restore(); } };
    lab(L.M, 'mentor'); lab(L.A, 'toi');
  });

  go('montrer');
  // petite porte de test : window.__trans
  window.__trans = { st, get layout(){ return L; }, shapes: SHAPES };
})();
