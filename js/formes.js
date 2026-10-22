/* 2. Le gradient de formes : chaque forme s'assemble pièce par pièce (toucher),
   puis se pousse. La couleur montre la poussée qui passe d'une pièce à l'autre. */
(function(){
  const el = document.getElementById('cv-formes');
  const chainEl = document.getElementById('chain-formes');
  const capEl = document.getElementById('cap-formes');
  const hintEl = document.getElementById('hint-formes');
  const tabs = [...document.querySelectorAll('.gradient button')];
  const C = T.col, TAU = Math.PI*2;
  const s = T.canvas(el);
  const imgEl = document.getElementById('img-forme'), veil = document.getElementById('veil-formes');
  const IMGS = ['02-levier','03-roue','04-poulie','05-engrenage','06-machine','07-onde','08-puce'];
  let lastTouch = -10;
  const rot = (x,y,a) => [x*Math.cos(a)-y*Math.sin(a), x*Math.sin(a)+y*Math.cos(a)];

  function gearPath(ctx, x, y, r, n, a, tooth){
    ctx.beginPath();
    for (let k = 0; k < n; k++){
      const b = a + k*TAU/n, q = TAU/n;
      const pts = [[r-tooth, b], [r+tooth, b+q*0.15], [r+tooth, b+q*0.45], [r-tooth, b+q*0.6]];
      pts.forEach(([rr,aa],j) => { const px = x+rr*Math.cos(aa), py = y+rr*Math.sin(aa); (k===0&&j===0)?ctx.moveTo(px,py):ctx.lineTo(px,py); });
    }
    ctx.closePath();
  }

  // ---------- les formes ----------
  const forms = [
  { nom:'levier', parts:['planche','appui','charge'], cap:'Une main appuie. Le poids monte.', hint:'appuie à gauche et descends',
    init(st){ st.a = 0.28; st.va = 0; st.drag = false; },
    down(st,p){ st.drag = true; }, move(st,p,dx,dy){ if (st.drag) st.target = T.clamp((st.target ?? st.a) - dy*0.006, -0.36, 0.3); }, up(st){ st.drag = false; st.target = null; },
    step(st,dt){ const old = st.a;
      if (st.target != null) st.a += (st.target - st.a)*Math.min(1, dt*14);
      else st.a += (0.28 - st.a)*Math.min(1, dt*1.6);
      st.input = Math.min(1, Math.abs(st.a-old)/dt*0.9); },
    draw(D, st, u, cx, cy){ const {ctx} = D;
      const P = [cx+u*1.6, cy+u*1.3], Ll = 5*u, Lr = 2*u;
      const L = rot(-Ll,0,st.a), R = rot(Lr,0,st.a);
      let p;
      if ((p = D.on(0))){ ctx.lineWidth = 5; ctx.lineCap='round'; const k = T.ease(p);
        ctx.beginPath(); ctx.moveTo(P[0]+L[0]*k, P[1]+L[1]*k); ctx.lineTo(P[0]+R[0]*k, P[1]+R[1]*k); ctx.stroke(); }
      if ((p = D.on(1))){ const k = T.ease(p); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(P[0], P[1]+4); ctx.lineTo(P[0]-u*0.7*k, P[1]+u*1.1); ctx.lineTo(P[0]+u*0.7*k, P[1]+u*1.1); ctx.closePath(); D.fill(); }
      if ((p = D.on(2))){ const k = T.ease(p), b = u*1.2*k; ctx.save(); ctx.translate(P[0]+R[0], P[1]+R[1]); ctx.rotate(st.a);
        ctx.beginPath(); ctx.rect(-b/2, -b-3, b, b); D.fill(); ctx.restore(); }
      // sol
      ctx.strokeStyle = C.faint; ctx.lineWidth = 1; ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(cx-6*u, P[1]+u*1.1); ctx.lineTo(cx+6*u, P[1]+u*1.1); ctx.stroke();
      // la main
      if (D.done){ const hx = P[0]+L[0], hy = P[1]+L[1]; ctx.fillStyle = st.drag ? C.accent : T.alpha(C.ink,.25);
        ctx.beginPath(); ctx.arc(hx, hy-14, 7, 0, TAU); ctx.fill();
        ctx.strokeStyle = st.drag ? C.accent : T.alpha(C.ink,.25); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hx, hy-40); ctx.lineTo(hx, hy-24); ctx.stroke(); }
    }
  },
  { nom:'roue', parts:['cercle','axe','rayons','charge'], cap:'Une poussée. Ça roule, longtemps.', hint:'glisse pour faire rouler',
    init(st){ st.x = 0; st.v = 0; st.phi = 0; },
    down(st){ st.drag = true; }, move(st,p,dx,dy,dt){ if (st.drag) st.v = T.lerp(st.v, dx/Math.max(dt,0.008), 0.5); }, up(st){ st.drag = false; },
    step(st,dt,u,w){ if (!st.drag) st.v -= st.v*0.35*dt; st.v = T.clamp(st.v, -1400, 1400); if (Math.abs(st.v)<3 && !st.drag) st.v = 0;
      st.x += st.v*dt; st.phi += st.v*dt/(1.8*u); const half = w/2 + 2.5*u; if (st.x > half) st.x -= 2*half; if (st.x < -half) st.x += 2*half;
      st.input = Math.min(1, Math.abs(st.v)/700); if (st.drag) st.v *= Math.pow(0.02, dt); },
    draw(D, st, u, cx, cy, w){ const {ctx} = D; const R = 1.8*u, gy = cy + 2.2*u, X = cx + st.x, Y = gy - R;
      ctx.strokeStyle = C.faint; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      let p;
      if ((p = D.on(0))){ ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(X, Y, R, st.phi - Math.PI/2, st.phi - Math.PI/2 + TAU*T.ease(p)); ctx.stroke(); }
      if ((p = D.on(1))){ ctx.beginPath(); ctx.arc(X, Y, 7*T.ease(p), 0, TAU); D.fill(); }
      if ((p = D.on(2))){ ctx.lineWidth = 2; for (let k=0;k<6;k++){ const a = st.phi + k*TAU/6, rr = R*T.ease(p); ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X+rr*Math.cos(a), Y+rr*Math.sin(a)); ctx.stroke(); } }
      if ((p = D.on(3))){ const k = T.ease(p); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X, Y-R-u*0.6*k); ctx.stroke();
        ctx.beginPath(); ctx.rect(X-1.4*u*k, Y-R-u*0.6-u*1.1*k, 2.8*u*k, u*1.1*k); D.fill(); }
    }
  },
  { nom:'poulie', parts:['poulie','corde','charge'], cap:'Tirer ici. Monter là.', hint:'tire vers le bas',
    init(st){ st.d = 0; },
    down(st){ st.drag = true; }, move(st,p,dx,dy){ if (st.drag) st.dt = (st.dt||0) + dy; }, up(st){ st.drag = false; },
    step(st,dt,u){ const old = st.d; if (st.drag){ st.d += (st.dt||0); st.dt = 0; } else st.d -= Math.min(st.d, dt*u*1.6);
      st.d = T.clamp(st.d, 0, 3.4*u); st.input = Math.min(1, Math.abs(st.d-old)/dt/(u*3)); },
    draw(D, st, u, cx, cy){ const {ctx} = D; const r = u, Q = [cx, cy - 2.6*u];
      const ly = cy + 2.6*u - st.d, hy = cy + 0.4*u + st.d;
      ctx.strokeStyle = C.faint; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx-3*u, Q[1]-1.4*u); ctx.lineTo(cx+3*u, Q[1]-1.4*u); ctx.stroke();
      let p;
      if ((p = D.on(0))){ const k = T.ease(p); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(Q[0], Q[1]-1.4*u); ctx.lineTo(Q[0], Q[1]-(1.4*u)*(1-k)); ctx.stroke();
        ctx.beginPath(); ctx.arc(Q[0], Q[1], r*k, 0, TAU); ctx.stroke();
        const a = st.d/r; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(Q[0], Q[1]); ctx.lineTo(Q[0]+r*k*Math.cos(a), Q[1]+r*k*Math.sin(a)); ctx.stroke(); }
      if ((p = D.on(1))){ const k = T.ease(p); ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(Q[0]-r, Q[1]+ (hy-Q[1])*k); ctx.lineTo(Q[0]-r, Q[1]); ctx.arc(Q[0], Q[1], r, Math.PI, 0); ctx.lineTo(Q[0]+r, Q[1] + (ly-Q[1])*k); ctx.stroke();
        if (D.done){ ctx.beginPath(); ctx.arc(Q[0]-r, hy+8, 8, 0, TAU); ctx.fillStyle = st.drag ? C.accent : ctx.strokeStyle; ctx.fill(); } }
      if ((p = D.on(2))){ const k = T.ease(p), b = 1.4*u*k; ctx.beginPath(); ctx.rect(Q[0]+r-b/2, ly, b, b); D.fill(); }
    }
  },
  { nom:'engrenage', parts:['première dent','deuxième','troisième'], cap:'Une dent pousse la suivante.', hint:'fais tourner la première',
    init(st){ st.a = 0; st.w = 0; },
    down(st,p){ st.drag = true; st.last = null; }, up(st){ st.drag = false; },
    move(st,p){ if (!st.drag || !st.c1) return; const ang = Math.atan2(p.y-st.c1[1], p.x-st.c1[0]);
      if (st.last != null){ let d = ang - st.last; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; st.acc = (st.acc||0) + d; } st.last = ang; },
    step(st,dt){ if (st.drag){ const d = st.acc||0; st.acc = 0; st.w = T.lerp(st.w, d/dt, 0.4); st.a += d; } else { st.w -= st.w*0.5*dt; st.a += st.w*dt; }
      if (Math.abs(st.w) < 0.02 && !st.drag) st.w = 0; st.input = Math.min(1, Math.abs(st.w)/5); },
    draw(D, st, u0, cx, cy, w, h){ const {ctx} = D; const u = Math.min(w/11, h/6.4);
      const r1 = 1.5*u, r2 = 1.0*u, r3 = 2.0*u, th = 0.17*u;
      const x1 = cx - 4.5*u + r1, x2 = x1 + r1 + r2, x3 = x2 + r2 + r3; st.c1 = [x1, cy];
      const q1 = TAU/12, q2 = TAU/8, q3 = TAU/16;
      const a2 = -(st.a + 0.3*q1)*r1/r2 + Math.PI - 0.8*q2, a3 = -(a2 + 0.3*q2)*r2/r3 + Math.PI - 0.8*q3;
      const g = [[x1, r1, 12, st.a], [x2, r2, 8, a2], [x3, r3, 16, a3]];
      g.forEach(([x, r, n, a], i) => { const p = D.on(i); if (!p) return; const k = T.ease(p);
        ctx.lineWidth = 2; gearPath(ctx, x, cy, r*k, n, a, th*k); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, cy, 5, 0, TAU); D.fill();
        ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x + r*0.7*k*Math.cos(a), cy + r*0.7*k*Math.sin(a)); ctx.stroke(); });
      if (D.done){ ctx.fillStyle = st.drag ? C.accent : T.alpha(C.ink,.3); ctx.beginPath(); ctx.arc(x1 + r1*0.7*Math.cos(st.a), cy + r1*0.7*Math.sin(st.a), 7, 0, TAU); ctx.fill(); }
    }
  },
  { nom:'machine', parts:['courant','moteur','bras','avant-bras','pince'], cap:'Courant → moteur → engrenage → bras. Un robot, c\u2019est la même chaîne.', hint:'guide la pince',
    init(st){ st.j1 = -1.9; st.j2 = 1.2; st.tx = null; },
    down(st,p){ st.drag = true; st.tx = p.x; st.ty = p.y; }, move(st,p){ if (st.drag){ st.tx = p.x; st.ty = p.y; } }, up(st){ st.drag = false; },
    step(st,dt,u,w,h){ const B = [w/2 - 0.5*u, h/2 + 2.6*u], L1 = 2.6*u, L2 = 2.2*u;
      let t1 = -1.9, t2 = 1.2;
      if (st.tx != null && st.drag){ let dx = st.tx - B[0], dy = st.ty - B[1]; let d = Math.hypot(dx,dy); const m = L1+L2-1; if (d > m){ dx*=m/d; dy*=m/d; d=m; } d = Math.max(d, Math.abs(L1-L2)+1);
        const c2 = T.clamp((d*d - L1*L1 - L2*L2)/(2*L1*L2), -1, 1); t2 = Math.acos(c2);
        t1 = Math.atan2(dy, dx) - Math.atan2(L2*Math.sin(t2), L1 + L2*Math.cos(t2)); }
      const o1 = st.j1, o2 = st.j2; const r = Math.min(1, dt*6); st.j1 += (t1-st.j1)*r; st.j2 += (t2-st.j2)*r;
      st.input = Math.min(1, (Math.abs(st.j1-o1)+Math.abs(st.j2-o2))/dt/2.5); st.B = B; st.L1 = L1; st.L2 = L2; },
    draw(D, st, u, cx, cy, w){ const {ctx} = D; if (!st.B) return; const B = st.B;
      const E = [B[0] + st.L1*Math.cos(st.j1), B[1] + st.L1*Math.sin(st.j1)];
      const a2 = st.j1 + st.j2, F = [E[0] + st.L2*Math.cos(a2), E[1] + st.L2*Math.sin(a2)];
      ctx.strokeStyle = C.faint; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx-6*u, B[1]+0.9*u); ctx.lineTo(cx+6*u, B[1]+0.9*u); ctx.stroke();
      let p;
      if ((p = D.on(0))){ const k = T.ease(p), x0 = cx - 5.5*u; ctx.lineWidth = 2; ctx.setLineDash(D.ghost ? [4,4] : [10,8]); ctx.lineDashOffset = -D.t*120*(D.e[0]||0);
        ctx.beginPath(); ctx.moveTo(x0, B[1]+0.5*u); ctx.lineTo(T.lerp(x0, B[0], k), B[1]+0.5*u); ctx.stroke(); ctx.setLineDash(D.ghost?[4,4]:[]);
        ctx.beginPath(); ctx.rect(x0-0.5*u, B[1]+0.2*u, 0.5*u, 0.6*u); D.fill(); }
      if ((p = D.on(1))){ const k = T.ease(p); ctx.lineWidth = 2; ctx.beginPath(); ctx.rect(B[0]-0.9*u*k, B[1]-0.1*u, 1.8*u*k, 1.0*u*k); ctx.stroke();
        gearPath(ctx, B[0], B[1], 0.5*u*k, 10, st.j1*4, 0.1*u); ctx.stroke(); }
      if ((p = D.on(2))){ const k = T.ease(p); ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(B[0], B[1]); ctx.lineTo(T.lerp(B[0],E[0],k), T.lerp(B[1],E[1],k)); ctx.stroke(); }
      if ((p = D.on(3))){ const k = T.ease(p); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(E[0], E[1]); ctx.lineTo(T.lerp(E[0],F[0],k), T.lerp(E[1],F[1],k)); ctx.stroke();
        ctx.lineWidth = 1.5; gearPath(ctx, E[0], E[1], 0.36*u*k, 8, st.j2*5, 0.08*u); ctx.stroke(); }
      if ((p = D.on(4))){ const k = T.ease(p), g = 0.55*u*k, op = st.drag ? 0.25 : 0.6; ctx.lineWidth = 3;
        [op, -op].forEach(o => { const a = a2 + o; ctx.beginPath(); ctx.moveTo(F[0], F[1]); ctx.lineTo(F[0]+g*Math.cos(a), F[1]+g*Math.sin(a)); ctx.stroke(); }); }
      if (D.done && st.drag && st.tx != null){ ctx.strokeStyle = T.alpha(C.accent,.5); ctx.setLineDash([]); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(st.tx, st.ty, 10, 0, TAU); ctx.stroke(); }
    }
  },
  { nom:'onde', parts:['charge','espace','autre charge'], cap:'Une charge accélère. L\u2019onde part. Là-bas, une autre bouge. C\u2019est la radio, le téléphone.', hint:'secoue la charge de haut en bas',
    init(st){ st.y = 0; st.ty = 0; st.hist = []; st.rings = []; st.v = 0; st.acc = 0; st.ringT = 0; st.time = 0; },
    down(st,p){ st.drag = true; st.py = p.y; }, move(st,p){ if (st.drag) st.py = p.y; }, up(st){ st.drag = false; },
    step(st,dt,u,w,h){ st.time += dt; const cy = h/2, lim = Math.min(2.6*u, h*0.36);
      const target = st.drag && st.py != null ? T.clamp(st.py - cy, -lim, lim) : 0;
      const ov = st.v; const nv = (T.lerp(st.y, target, Math.min(1, dt*(st.drag?18:3))) - st.y)/dt;
      st.y += nv*dt; st.v = nv; st.acc = T.lerp(st.acc, (nv-ov)/dt, 0.3);
      st.hist.push({ t: st.time, y: st.y }); while (st.hist.length > 2 && st.time - st.hist[0].t > 6) st.hist.shift();
      const A = Math.abs(st.acc); st.ringT -= dt;
      if (st.built >= 2 && A > 1500 && st.ringT <= 0 && st.rings.length < 16){ st.rings.push({ r: 0, a: Math.min(0.7, A/14000), y: st.y }); st.ringT = 0.12; }
      const c = Math.max(220, w*0.32); st.c = c;
      st.rings.forEach(r => { r.r += c*dt; }); st.rings = st.rings.filter(r => r.r < w*1.1);
      st.input = Math.min(1, A/5000); },
    yAt(st, tt){ const H = st.hist; if (!H.length || tt < H[0].t) return 0; let lo = 0, hi = H.length-1; while (hi-lo > 1){ const m = (lo+hi)>>1; if (H[m].t < tt) lo = m; else hi = m; } const a = H[lo], b = H[hi]; const f = b.t===a.t?0:(tt-a.t)/(b.t-a.t); return T.lerp(a.y, b.y, T.clamp(f,0,1)); },
    draw(D, st, u, cx, cy, w, h){ const {ctx} = D; const X0 = w*0.12, X1 = w*0.88, c = st.c || 260;
      let p;
      if ((p = D.on(1))){ const k = T.ease(p);
        st.rings.forEach(r => { ctx.strokeStyle = T.alpha(C.accent, r.a*(1 - r.r/(w*1.1))*0.8); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X0, cy + r.y, r.r, -0.9, 0.9); ctx.stroke(); });
        ctx.strokeStyle = D.ghost ? T.alpha(C.ink,.3) : C.ink; ctx.lineWidth = 1.5; ctx.beginPath();
        const xe = T.lerp(X0, X1, k);
        for (let x = X0; x <= xe; x += 4){ const yy = cy + this.yAt(st, st.time - (x-X0)/c) * (1 - 0.35*(x-X0)/(X1-X0)); x===X0 ? ctx.moveTo(x,yy) : ctx.lineTo(x,yy); }
        ctx.stroke(); }
      if ((p = D.on(0))){ const k = T.ease(p); ctx.beginPath(); ctx.arc(X0, cy + st.y, 12*k, 0, TAU); D.fill();
        ctx.strokeStyle = C.faint; ctx.lineWidth = 1; ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(X0, cy-3*u); ctx.lineTo(X0, cy+3*u); ctx.stroke(); }
      if ((p = D.on(2))){ const k = T.ease(p); const yy = this.yAt(st, st.time - (X1-X0)/c)*0.65; ctx.beginPath(); ctx.arc(X1, cy + yy, 9*k, 0, TAU); D.fill();
        if (!D.ghost && Math.abs(yy) > 4){ ctx.fillStyle = T.alpha(C.accent, Math.min(1, Math.abs(yy)/40)); ctx.beginPath(); ctx.arc(X1, cy + yy, 20, 0, TAU); ctx.fill(); } }
    }
  },
  { nom:'puce', parts:['source','interrupteurs','lumière'], cap:'Un interrupteur en ferme un autre. Des milliards, très vite.', hint:'garde appuyé',
    init(st){ st.on = false; st.c = new Array(8).fill(0); st.lit = 0; },
    down(st){ st.on = true; }, up(st){ st.on = false; },
    step(st,dt){ const sp = T.reduced ? 30 : 7; let prev = st.on ? 1 : 0;
      for (let i = 0; i < 8; i++){ const tgt = prev >= 0.98 ? 1 : 0; st.c[i] += T.clamp(tgt - st.c[i], -sp*dt, sp*dt); prev = st.c[i]; }
      st.lit = T.lerp(st.lit, prev >= 0.98 ? 1 : 0, Math.min(1, dt*10));
      st.input = st.on ? 1 : 0; },
    energies(st){ const avg = st.c.reduce((a,b)=>a+b,0)/8; return [st.on?1:0, avg, st.lit]; },
    draw(D, st, u, cx, cy, w, h){ const {ctx} = D; const S = Math.min(7.6*u, h*0.82, w*0.8), x0 = cx - S/2, y0 = cy - S/2;
      // la puce
      ctx.strokeStyle = C.faint; ctx.lineWidth = 1; ctx.setLineDash([]); ctx.strokeRect(x0, y0, S, S);
      for (let i = 1; i < 8; i++){ const q = i*S/8; [[x0+q,y0,x0+q,y0-10],[x0+q,y0+S,x0+q,y0+S+10],[x0,y0+q,x0-10,y0+q],[x0+S,y0+q,x0+S+10,y0+q]].forEach(([a,b,c2,d]) => { ctx.beginPath(); ctx.moveTo(a,b); ctx.lineTo(c2,d); ctx.stroke(); }); }
      const rowY = [cy - S*0.18, cy + S*0.18], gap = S/5.2;
      const pos = i => { const row = i < 4 ? 0 : 1, col = row === 0 ? i : 7 - i; return [x0 + S*0.2 + col*gap, rowY[row], row]; };
      const src = [x0 + S*0.08, rowY[0]], light = [x0 + S*0.08, rowY[1]];
      let p;
      if ((p = D.on(0))){ ctx.beginPath(); ctx.arc(src[0], src[1], 9*T.ease(p), 0, TAU); D.fill(); }
      if ((p = D.on(1))){
        let flowing = st.on;
        let last = src;
        for (let i = 0; i < 8; i++){ const k = T.ease(T.clamp(p*8 - i, 0, 1)); if (!k) break; const [x, y, row] = pos(i), dir = row === 0 ? 1 : -1;
          const a = x - dir*gap*0.25, b = x + dir*gap*0.25;
          // fil jusqu'à l'interrupteur
          ctx.lineWidth = 2; ctx.strokeStyle = D.ghost ? T.alpha(C.ink,.3) : (flowing ? C.accent : C.ink);
          ctx.beginPath(); ctx.moveTo(last[0], last[1]); if (last[1] !== y){ ctx.lineTo(last[0] + gap*0.35, last[1]); ctx.lineTo(last[0] + gap*0.35, y); } ctx.lineTo(a, y); ctx.stroke();
          // l'interrupteur : une petite lame qui se ferme
          const th = (1 - st.c[i]) * 0.75, L = b - a; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a, y); ctx.lineTo(a + L*Math.cos(th)*k, y - Math.abs(L)*Math.sin(th)*k); ctx.stroke();
          ctx.beginPath(); ctx.arc(a, y, 3, 0, TAU); ctx.arc(b, y, 3, 0, TAU); ctx.fillStyle = ctx.strokeStyle; ctx.fill();
          const gx = (a+b)/2, gy = y - gap*0.42, gs = gap*0.16; ctx.lineWidth = 1.5;
          ctx.fillStyle = D.ghost ? 'transparent' : T.alpha(C.accent, st.c[i]); ctx.strokeStyle = D.ghost ? T.alpha(C.ink,.3) : T.mix(st.c[i]);
          ctx.beginPath(); ctx.rect(gx - gs, gy - gs*0.6, gs*2, gs*1.2); ctx.fill(); ctx.stroke();
          ctx.setLineDash([2,3]); ctx.beginPath(); ctx.moveTo(gx, gy + gs*0.6); ctx.lineTo(gx, y - 6); ctx.stroke(); ctx.setLineDash(D.ghost ? [4,5] : []);
          flowing = flowing && st.c[i] >= 0.98; ctx.strokeStyle = D.ghost ? T.alpha(C.ink,.3) : (flowing ? C.accent : C.ink);
          last = [b, y]; }
        if (p >= 1){ ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(light[0], light[1]); ctx.stroke(); }
      }
      if ((p = D.on(2))){ const k = T.ease(p); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(light[0], light[1], 11*k, 0, TAU); ctx.stroke();
        if (st.lit > 0.02){ ctx.fillStyle = T.alpha(C.accent, st.lit); ctx.beginPath(); ctx.arc(light[0], light[1], 11*k, 0, TAU); ctx.fill();
          ctx.fillStyle = T.alpha(C.accent, 0.15*st.lit); ctx.beginPath(); ctx.arc(light[0], light[1], 28, 0, TAU); ctx.fill(); }
        ctx.fillStyle = st.lit > 0.5 ? C.accent : C.soft; ctx.font = '14px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(st.lit > 0.5 ? '1' : '0', light[0], light[1] + 34); }
    }
  }
  ];

  // ---------- état et moteur commun ----------
  const states = forms.map(f => { const st = { built: 0, prog: f.parts.map(()=>0), e: f.parts.map(()=>0), input: 0 }; f.init(st); return st; });
  let cur = 0, fade = 1, lastP = null;

  function renderChain(){
    const f = forms[cur], st = states[cur];
    chainEl.innerHTML = f.parts.map((n,i) => `<li class="${i < st.built ? 'built' : ''}"><i></i>${n}</li>`).join('');
    capEl.textContent = st.built >= f.parts.length ? f.cap : '';
    hintEl.textContent = st.built >= f.parts.length ? f.hint : 'touche pour assembler · ' + st.built + '/' + f.parts.length;
  }
  function select(i){
    cur = (i + forms.length) % forms.length; fade = 0;
    tabs.forEach((b,j) => { b.setAttribute('aria-selected', j === cur ? 'true' : 'false'); b.tabIndex = j === cur ? 0 : -1; });
    renderChain();
    const src = 'img/' + IMGS[cur] + '.webp';
    if (!imgEl.src.endsWith(src)){ imgEl.classList.add('out'); setTimeout(() => { imgEl.src = src; imgEl.alt = forms[cur].nom; }, T.reduced ? 0 : 250); }
  }
  imgEl.addEventListener('load', () => imgEl.classList.remove('out'));
  tabs.forEach((b,i) => b.addEventListener('click', () => select(i)));
  document.querySelector('.sec-formes .prev').addEventListener('click', () => select(cur-1));
  document.querySelector('.sec-formes .next').addEventListener('click', () => select(cur+1));
  el.tabIndex = 0;
  el.addEventListener('keydown', e => { if (e.key === 'ArrowRight') select(cur+1); if (e.key === 'ArrowLeft') select(cur-1);
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); const st = states[cur]; if (st.built < forms[cur].parts.length){ st.built++; renderChain(); } } });

  T.pointer(el, {
    down(p){ const f = forms[cur], st = states[cur]; lastP = p; lastTouch = performance.now()/1000;
      if (st.built < f.parts.length){ st.built++; st.building = true; renderChain(); return; }
      st.building = false; f.down && f.down(st, p); },
    move(p){ lastTouch = performance.now()/1000; const f = forms[cur], st = states[cur]; if (st.building || !lastP){ lastP = p; return; }
      const dt = (p.t - lastP.t)/1000; f.move && f.move(st, p, p.x-lastP.x, p.y-lastP.y, dt); lastP = p; },
    up(p){ const f = forms[cur], st = states[cur]; lastP = null; if (st.building){ st.building = false; return; } f.up && f.up(st, p); }
  });

  select(0);

  T.loop(el, (dt, t) => {
    const { ctx, w, h } = s; if (!w) return;
    const f = forms[cur], st = states[cur];
    const u = Math.min(w/12, h/7.4), cx = w/2, cy = h/2;
    fade = Math.min(1, fade + dt*(T.reduced ? 100 : 3));
    st.prog = st.prog.map((v,i) => i < st.built ? Math.min(1, v + dt*(T.reduced ? 100 : 1.8)) : 0);
    const done = st.built >= f.parts.length && st.prog[st.prog.length-1] >= 1;
    st.input = 0;
    f.step(st, dt, u, w, h);
    if (!done) st.input = 0;
    if (f.energies && done){ const E = f.energies(st); st.e = st.e.map((v,i) => T.lerp(v, E[i], Math.min(1, dt*10))); }
    else { st.e[0] = T.lerp(st.e[0], st.input, Math.min(1, dt*12)); for (let i = 1; i < st.e.length; i++) st.e[i] = T.lerp(st.e[i], st.e[i-1], Math.min(1, dt*(T.reduced?40:7))); }

    const active = t - lastTouch < 2.5;
    veil.className = 'veil' + (active ? ' on' : (st.built < f.parts.length ? ' half' : ''));
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = fade * (active || st.built < f.parts.length ? 1 : 0.55);
    const D = { ctx, t, e: st.e, done, ghost: false,
      on(i){ ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        if (i < st.built){ D.ghost = false; const col = T.mix(st.e[i]*1.3); ctx.strokeStyle = col; ctx.fillStyle = col; return Math.max(0.001, st.prog[i]); }
        if (i === st.built){ D.ghost = true; ctx.strokeStyle = T.alpha(C.ink, 0.28 + 0.12*Math.sin(t*3)); ctx.fillStyle = 'transparent'; ctx.setLineDash([4,5]); return 1; }
        return 0; },
      fill(){ if (D.ghost){ ctx.lineWidth = 1.5; ctx.stroke(); } else ctx.fill(); }
    };
    f.draw(D, st, u, cx, cy, w, h);
    ctx.setLineDash([]); ctx.globalAlpha = 1;

    // la chaîne sous la scène s'allume au passage de la poussée
    const lis = chainEl.children;
    for (let i = 0; i < lis.length; i++){ const k = st.e[i] || 0; lis[i].style.color = i < st.built ? T.mix(k*1.3) : ''; }
  });
})();
