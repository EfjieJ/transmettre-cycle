/* Outils communs : canevas net, boucle d'animation visible seulement, pointeur unifié souris/tactile. */
(function(){
  const T = window.T = {};
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  T.reduced = mq.matches;
  mq.addEventListener && mq.addEventListener('change', e => { T.reduced = e.matches; });
  T.col = { bg:'#f5f2ec', ink:'#1c1b19', soft:'#a9a397', faint:'#e4dfd5', accent:'#d4572a' };
  T.clamp = (v,a,b) => Math.max(a, Math.min(b, v));
  T.lerp = (a,b,t) => a + (b-a)*t;
  T.ease = t => t<.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2;
  // mélange encre -> accent selon k (0..1)
  T.mix = (k, a='#1c1b19', b='#d4572a') => {
    k = T.clamp(k,0,1);
    const p = h => [1,3,5].map(i => parseInt(h.substr(i,2),16));
    const A=p(a), B=p(b);
    return 'rgb(' + A.map((v,i)=>Math.round(v+(B[i]-v)*k)).join(',') + ')';
  };
  T.alpha = (hex, a) => { const p=[1,3,5].map(i=>parseInt(hex.substr(i,2),16)); return `rgba(${p[0]},${p[1]},${p[2]},${a})`; };

  T.canvas = function(el, onResize){
    const ctx = el.getContext('2d');
    const s = { el, ctx, w:0, h:0 };
    const fit = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (!r.width || !r.height) return;
      s.w = r.width; s.h = r.height;
      el.width = Math.round(r.width*dpr); el.height = Math.round(r.height*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      onResize && onResize(s);
    };
    new ResizeObserver(fit).observe(el); fit();
    return s;
  };

  // anime seulement quand l'élément est à l'écran
  T.loop = function(el, frame){
    let vis = false, last = 0, id = 0;
    const tick = now => {
      const dt = Math.min(0.05, (now-last)/1000 || 0.016); last = now;
      try { frame(dt, now/1000); } catch(e){ console.error(e); }
      if (vis) id = requestAnimationFrame(tick);
    };
    new IntersectionObserver(es => {
      const v = es[0].isIntersecting;
      if (v && !vis){ vis = true; last = performance.now(); id = requestAnimationFrame(tick); }
      else if (!v && vis){ vis = false; cancelAnimationFrame(id); }
    }, { threshold: 0 }).observe(el);
  };

  // pointeur : coordonnées locales, capture, un seul doigt
  T.pointer = function(el, h){
    let active = null;
    const pos = e => { const r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; };
    el.addEventListener('pointerdown', e => {
      if (active !== null) return;
      active = e.pointerId;
      try { el.setPointerCapture(e.pointerId); } catch(_){}
      h.down && h.down(pos(e), e);
    });
    el.addEventListener('pointermove', e => {
      if (active === null){ h.hover && h.hover(pos(e)); return; }
      if (e.pointerId !== active) return;
      h.move && h.move(pos(e), e);
    });
    const end = e => { if (e.pointerId !== active) return; active = null; h.up && h.up(pos(e), e); };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('lostpointercapture', end);
  };

  // lien actif dans la barre du haut
  const links = [...document.querySelectorAll('.top nav a')];
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#'+en.target.id));
  }), { threshold: 0.45 });
  document.querySelectorAll('main > section').forEach(sec => io.observe(sec));
})();
