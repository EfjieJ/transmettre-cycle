/* Texte : histoire.txt, tel quel. Il est seulement découpé (aux débuts de phrase ci-dessous) ; aucun mot n'est changé. */
(function(){
var B=[
 ['01-mains-aube','',''],
 ['02-the-eliza','Sa femme, Eliza'],
 ['03-fils-tousse','Leur fils aîné'],
 ['04-machine','Quand la machine à vapeur'],
 ['05-regarde-mains','Un soir, il s’assoit sur le bord du lit'],
 ['06-hopital','En 1943'],
 ['07-carnet','Un soir, après une garde'],
 ['08-soldat','Le lendemain, quand un soldat'],
 ['09-abribus','En 1987'],
 ['10-pizza','Il livre la pizza.'],
 ['11-labo','En 2029'],
 ['12-ca-tient','Lena s’assoit.'],
 ['13-thomas-2034','En 2034'],
 ['14-robot','Dehors, un robot'],
 ['15-labo-public','Plus tard, dans la journée'],
 ['16-repas','Le soir, Thomas rentre.']
];
var CH={0:'Manchester · 1803',5:'Londres · 1943',8:'Montréal · 1987',10:'Berlin · 2029',12:'2034'};
var root=document.getElementById('recit'),imgs=document.getElementById('images'),lieu=document.getElementById('lieu');
B.forEach(function(b,i){var im=new Image();im.src='img/histoire/'+b[0]+'.webp';im.alt='';im.decoding='async';if(i>1)im.loading='lazy';if(!i)im.className='on';imgs.appendChild(im);});
var els=imgs.children;
function show(i){for(var k=0;k<els.length;k++)els[k].classList.toggle('on',k===i);}
fetch('histoire.txt').then(function(r){if(!r.ok)throw 0;return r.text()}).then(function(t){
 var cuts=[0],pos=0;
 for(var i=1;i<B.length;i++){var k=t.indexOf(B[i][1],pos);if(k<0){k=pos;}cuts.push(k);pos=k;}
 cuts.push(t.length);root.innerHTML='';var chap='';
 B.forEach(function(b,i){
  var slice=t.slice(cuts[i],cuts[i+1]);if(!slice)return;
  if(CH[i])chap=CH[i];
  var sec=document.createElement('section');sec.className='beat';sec.dataset.beat=i;sec.dataset.lieu=chap;
  var bl=document.createElement('div');bl.className='bloc';sec.appendChild(bl);
  if(CH[i]){var c=document.createElement('p');c.className='chap';c.setAttribute('aria-hidden','true');c.textContent=CH[i];bl.appendChild(c);}
  var parts=slice.split(/(\n[ \t]*\n\s*)/);
  for(var j=0;j<parts.length;j+=2){var e=document.createElement('p');e.className='txt';e.textContent=parts[j];e.dataset.sep=parts[j+1]||'';bl.appendChild(e);}
  root.appendChild(sec);
 });
 var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){show(+e.target.dataset.beat);lieu.textContent=e.target.dataset.lieu||'';}})},{rootMargin:'-45% 0px -45% 0px'});
 root.querySelectorAll('.beat').forEach(function(s){io.observe(s)});
 lieu.textContent=CH[0];
}).catch(function(){root.innerHTML='<p class="charge">Le texte de l’histoire n’est pas encore en place.</p>';});
})();
