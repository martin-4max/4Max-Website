(function(){
  var clockOk = false;
  try { requestAnimationFrame(function(){ clockOk = true; }); } catch(e) {}

  var LINES = 6;
  function navFade(){
    var nav = document.querySelector('nav[data-navfade]');
    if(!nav) return;
    var t = Math.min(Math.max(window.scrollY/360,0),1);
    nav.style.background = 'rgba(43,45,56,'+(t*0.96).toFixed(3)+')';
    nav.style.backdropFilter = t>0.05 ? 'blur(6px)' : 'none';
    nav.style.borderBottom = '1px solid rgba(29,36,60,'+((1-t)*0.12).toFixed(3)+')';
  }
  var bar;
  function progress(){
    if(!document.querySelector('article')) return;
    if(!bar){
      bar = document.createElement('div');
      bar.setAttribute('data-progress-bar','1');
      bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;width:0;background:#5b37ff;z-index:1100;transition:width .1s linear';
      document.body.appendChild(bar);
    }
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max>0 ? Math.min(window.scrollY/max,1)*100 : 0) + '%';
  }
  function onScroll(){ navFade(); progress(); tick(); }

  function inView(el, slack){
    var r = el.getBoundingClientRect();
    if(r.height === 0 && r.width === 0) return false;
    return r.top < window.innerHeight - (slack || 40) && r.bottom > 0;
  }

  function reveals(){
    var els = [].slice.call(document.querySelectorAll('[data-reveal]:not([data-reveal-init])'));
    if(!els.length) return;
    if(matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    var order = new Map();
    els.forEach(function(el){
      el.setAttribute('data-reveal-init','1');
      if(el.style.animation) return;
      var i = order.get(el.parentElement) || 0;
      order.set(el.parentElement, i+1);
      el.dataset.revealIndex = String(Math.min(i,6));
      el.setAttribute('data-reveal-pending','1');
    });
    tick();
  }

  function animateCount(el){
    var target = Number(el.dataset.count), suffix = el.dataset.suffix || '';
    var steps = 18, i = 0;
    var timer = setInterval(function(){
      i++;
      var p = Math.min(i/steps, 1), eased = 1 - Math.pow(1-p, 3);
      el.textContent = Math.round(target*eased).toLocaleString('en-GB') + suffix;
      if(p >= 1) clearInterval(timer);
    }, 40);
  }

  function tick(){
    [].slice.call(document.querySelectorAll('[data-reveal-pending]')).forEach(function(el){
      if(!inView(el)) return;
      el.removeAttribute('data-reveal-pending');
      if(!clockOk) return;
      el.style.animation = 'fadeInUp .9s cubic-bezier(.2,.7,.3,1) ' + (Number(el.dataset.revealIndex||0)*90) + 'ms both';
      setTimeout(function(){ if(getComputedStyle(el).opacity === '0'){ el.style.animation = ''; el.style.opacity = '1'; } }, 1400);
    });
    [].slice.call(document.querySelectorAll('[data-count]:not([data-count-done])')).forEach(function(el){
      if(!inView(el, 80)) return;
      el.setAttribute('data-count-done','1');
      var final = Number(el.dataset.count).toLocaleString('en-GB') + (el.dataset.suffix || '');
      el.textContent = '0';
      animateCount(el);
      setTimeout(function(){ el.textContent = final; }, 1100);
      setTimeout(function(){ el.textContent = final; }, 3000);
    });
  }

  function toc(){
    var art = document.querySelector('article');
    if(!art || art.querySelector('[data-toc]')) return;
    var heads = [].slice.call(art.querySelectorAll('h2'));
    if(heads.length < 2) return;
    var box = document.createElement('nav');
    box.setAttribute('data-toc','1');
    box.style.cssText = 'background:#fbfbfd;border:1px solid #ececf2;border-radius:8px;padding:20px 24px;margin:0 0 28px';
    var t = document.createElement('div');
    t.textContent = 'In this session';
    t.style.cssText = 'font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#8890ab;margin-bottom:10px';
    box.appendChild(t);
    var ul = document.createElement('ul');
    ul.style.cssText = 'margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px';
    heads.forEach(function(hd,i){
      hd.id = 'sec-'+i;
      var li = document.createElement('li');
      li.style.cssText = 'font-size:14.5px';
      var a = document.createElement('a');
      a.href = '#sec-'+i;
      a.textContent = hd.textContent;
      a.style.cssText = 'color:#5b37ff;text-decoration:none';
      li.appendChild(a); ul.appendChild(li);
    });
    box.appendChild(ul);
    heads[0].parentElement.insertBefore(box, heads[0]);
  }

  var menuBtn, open = false;
  function mobileNav(){
    var nav = document.querySelector('nav');
    if(!nav || !nav.firstElementChild) return;
    var barEl = nav.firstElementChild;
    var links = barEl.querySelector('div:last-of-type');
    if(!links) return;
    if(menuBtn && !menuBtn.isConnected){ barEl.appendChild(menuBtn); }
    if(!menuBtn){
      menuBtn = document.createElement('button');
      menuBtn.type = 'button';
      menuBtn.textContent = 'Menu';
      menuBtn.style.cssText = 'display:none;background:none;border:1px solid currentColor;border-radius:6px;padding:6px 12px;font:inherit;font-size:13px;font-weight:600;cursor:pointer';
      menuBtn.addEventListener('click', function(){
        open = !open;
        links.style.display = open ? 'flex' : 'none';
        links.style.width = '100%';
        links.style.justifyContent = 'flex-start';
      });
      barEl.appendChild(menuBtn);
    }
    var narrow = window.innerWidth < 480;
    menuBtn.style.display = narrow ? 'block' : 'none';
    var firstLink = nav.querySelector('a');
    if(firstLink) menuBtn.style.color = getComputedStyle(firstLink).color;
    if(!narrow){ links.style.display = 'flex'; links.style.width = ''; open = false; }
    else if(!open){ links.style.display = 'none'; }
  }

  function clampP(p, on){
    if(on){
      p.style.display = '-webkit-box';
      p.style.WebkitBoxOrient = 'vertical';
      p.style.WebkitLineClamp = String(LINES);
      p.style.overflow = 'hidden';
    } else {
      p.style.display = 'block';
      p.style.WebkitLineClamp = '';
      p.style.overflow = '';
    }
  }
  function syncRecs(){
    var ps = [].slice.call(document.querySelectorAll('[data-rec-text]'));
    ps.forEach(function(p){
      var btn = p.parentElement.querySelector('[data-rec-toggle]');
      if(!btn) return;
      var expanded = btn.dataset.expanded === '1';
      clampP(p, false);
      var lh = parseFloat(getComputedStyle(p).lineHeight) || 25;
      var overflows = p.scrollHeight > lh*LINES + 2;
      btn.style.display = overflows ? 'block' : 'none';
      if(!overflows){ btn.dataset.expanded = '0'; btn.textContent = 'Read more'; return; }
      clampP(p, !expanded);
      btn.textContent = expanded ? 'Show less' : 'Read more';
    });
  }

  var qTimer;
  function quotes(){
    var q = document.querySelector('[data-quote]'), by = document.querySelector('[data-quote-by]');
    if(!q || !by || qTimer) return;
    var items = [
      ['There are experts, and then there are people who have genuinely shaped a field \u2014 Martin is firmly in the second category.', 'Morgan Brown \u00a0\u00b7\u00a0 20+ years IBM'],
      ['Martin is, quite simply, the best trainer I have ever encountered.', 'Pawel Wozniak \u00a0\u00b7\u00a0 Senior Delivery Consultant'],
      ['One of the most knowledgeable Maximo Application Suite experts on the planet.', 'Andrew Jeffery \u00a0\u00b7\u00a0 Maximo Secrets author']
    ];
    var i = 0;
    q.style.opacity = '1';
    by.style.opacity = '1';
    qTimer = setInterval(function(){
      i = (i+1) % items.length;
      q.textContent = items[i][0];
      by.textContent = items[i][1];
      q.style.opacity = '1';
      by.style.opacity = '1';
    }, 7000);
  }

  function dropdowns(){
    [].slice.call(document.querySelectorAll('[data-dropdown]:not([data-dropdown-init])')).forEach(function(wrap){
      wrap.setAttribute('data-dropdown-init','1');
      var panel = wrap.querySelector('[data-dropdown-panel]');
      if(!panel) return;
      var timer = null;
      var show = function(){ if(timer){ clearTimeout(timer); timer = null; } panel.style.display = 'block'; };
      var hide = function(){ panel.style.display = 'none'; };
      var hideSoon = function(){ if(timer) clearTimeout(timer); timer = setTimeout(hide, 260); };
      wrap.addEventListener('mouseenter', show);
      wrap.addEventListener('mouseleave', hideSoon);
      panel.addEventListener('mouseenter', show);
      panel.addEventListener('mouseleave', hideSoon);

      wrap.addEventListener('focusin', show);
      wrap.addEventListener('focusout', function(ev){ if(!wrap.contains(ev.relatedTarget)) hide(); });
      panel.addEventListener('click', hide);
    });
  }

  function trail(){
    var here = location.pathname;
    var prev = '';
    try {
      var last = sessionStorage.getItem('4max:currentPage') || '';
      if(last && last.split('?')[0] !== here) { sessionStorage.setItem('4max:prevPage', last); }
      sessionStorage.setItem('4max:currentPage', here + location.search);
      prev = sessionStorage.getItem('4max:prevPage') || '';
    } catch(err) {}
    if(!prev && document.referrer && document.referrer.indexOf(location.origin) === 0 && document.referrer !== location.href) prev = document.referrer;
    [].slice.call(document.querySelectorAll('[data-back]')).forEach(function(a){
      a.setAttribute('href', prev || 'index.dc.html');
      var name = '';
      try { name = decodeURIComponent((prev || '').split('?')[0].split('/').pop().replace('.dc.html','')); } catch(err) {}
      if(name === 'index') name = 'main page';
      a.textContent = name ? '\u2190 Back to ' + name.replace(/^4Max /,'') : '\u2190 Back to previous page';
    });
  }

  function init(){
    try{ trail(); }catch(e){}
    try{ dropdowns(); }catch(e){}
    try{ reveals(); }catch(e){}
    try{ toc(); }catch(e){}
    try{ mobileNav(); }catch(e){}
    try{ quotes(); }catch(e){}
    try{ syncRecs(); }catch(e){}
    try{ onScroll(); }catch(e){}
  }

  document.addEventListener('click', function(e){
    var back = e.target.closest && e.target.closest('[data-back]');
    if(back){
      e.preventDefault();
      var prev = '';
      try { prev = sessionStorage.getItem('4max:prevPage') || ''; } catch(err) {}
      if(!prev && document.referrer && document.referrer.indexOf(location.origin) === 0 && document.referrer !== location.href) prev = document.referrer;
      window.location.href = prev || 'index.dc.html';
      return;
    }
    var btn = e.target.closest && e.target.closest('[data-rec-toggle]');
    if(!btn) return;
    btn.dataset.expanded = btn.dataset.expanded === '1' ? '0' : '1';
    syncRecs();
  });
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', function(){ mobileNav(); syncRecs(); }, {passive:true});
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  [0, 300, 900, 1800, 3000].forEach(function(d){ setTimeout(init, d); });
  setInterval(function(){
    try{ mobileNav(); }catch(e){}
    try{ tick(); }catch(e){}
    try{
      [].slice.call(document.querySelectorAll('[data-reveal]')).forEach(function(el){
        if(getComputedStyle(el).opacity === '0' && !el.hasAttribute('data-reveal-pending')){ el.style.animation = ''; el.style.opacity = '1'; }
      });
    }catch(e){}
  }, 600);
})();
