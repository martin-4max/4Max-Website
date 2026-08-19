(function(){
  if (window.__4maxEnhanceLoaded) return;
  window.__4maxEnhanceLoaded = true;
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
  function onScroll(){ navFade(); progress(); tick(); savePos(); }

  var POS = {};
  var curRoute = (location.hash || '#/home');
  var saveTimer = null;
  function savePos(){
    var rt = curRoute, y = window.scrollY;
    POS[rt] = y;
    if(saveTimer) return;
    saveTimer = setTimeout(function(){ saveTimer = null; POS[rt] = window.scrollY; }, 200);
  }
  function restorePos(route){
    var y = POS[route];
    if(!y) return;
    [40,160,400,800,1400,2200].forEach(function(d){
      setTimeout(function(){
        if(document.documentElement.scrollHeight - window.innerHeight >= y - 4) window.scrollTo(0, y);
      }, d);
    });
  }

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

  var menuBtn, open = false, wasNarrow = null;
  var BURGER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;display:block"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>';
  var CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;display:block"><path d="M6 6l12 12M18 6L6 18"></path></svg>';

  function navParts(){
    var nav = document.querySelector('nav');
    if(!nav || !nav.firstElementChild) return null;
    var barEl = nav.firstElementChild;
    var links = barEl.querySelector(':scope > div:last-of-type');
    if(!links || links.querySelector('a') === null) return null;
    return {nav:nav, barEl:barEl, links:links};
  }

  function snap(el){ if(el.dataset.origStyle === undefined) el.dataset.origStyle = el.getAttribute('style') || ''; }
  function restore(el){ if(el.dataset.origStyle !== undefined) el.setAttribute('style', el.dataset.origStyle); }

  function paintPanel(p, on){
    var links = p.links;
    var kids = [].slice.call(links.querySelectorAll('a,[data-dropdown],[data-dropdown-panel]'));
    snap(links); kids.forEach(snap);
    if(on){
      links.style.position = 'absolute';
      links.style.top = '100%';
      links.style.left = '0';
      links.style.right = '0';
      links.style.flexDirection = 'column';
      links.style.alignItems = 'stretch';
      links.style.gap = '4px';
      links.style.background = '#ffffff';
      links.style.borderTop = '1px solid #ececf2';
      links.style.boxShadow = '0 14px 32px rgba(29,36,60,0.16)';
      links.style.padding = '12px 16px 18px';
      links.style.maxHeight = 'calc(100vh - 72px)';
      links.style.overflowY = 'auto';
      links.style.display = open ? 'flex' : 'none';
      [].slice.call(links.querySelectorAll('a')).forEach(function(a){
        var isBtn = /5b37ff|rgb\(91/.test(a.style.background || '');
        if(!isBtn){ a.style.color = '#1d243c'; a.style.padding = '11px 4px'; }
        else { a.style.textAlign = 'center'; a.style.marginTop = '6px'; }
        a.style.fontSize = '16px';
        a.style.whiteSpace = 'normal';
      });
      [].slice.call(links.querySelectorAll('[data-dropdown]')).forEach(function(w){ w.style.display = 'block'; });
      [].slice.call(links.querySelectorAll('[data-dropdown-panel]')).forEach(function(pan){
        pan.style.display = 'block';
        pan.style.position = 'static';
        pan.style.transform = 'none';
        pan.style.minWidth = '0';
        pan.style.border = '0';
        pan.style.boxShadow = 'none';
        pan.style.padding = '0 0 0 4px';
        pan.style.marginTop = '0';
      });
    } else {
      restore(links); kids.forEach(restore);
    }
  }

  function setMenu(state){
    var p = navParts();
    if(!p) return;
    open = state;
    p.links.style.display = open ? 'flex' : 'none';
    if(menuBtn){ menuBtn.innerHTML = open ? CLOSE : BURGER; menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  }

  function mobileNav(){
    var p = navParts();
    if(!p) return;
    p.barEl.style.position = 'relative';
    if(!menuBtn || !menuBtn.isConnected) menuBtn = p.barEl.querySelector('[data-navmenu]');
    if(!menuBtn){
      menuBtn = document.createElement('button');
      menuBtn.type = 'button';
      menuBtn.setAttribute('data-navmenu','1');
      menuBtn.setAttribute('aria-label','Menu');
      menuBtn.setAttribute('aria-expanded','false');
      menuBtn.innerHTML = BURGER;
      menuBtn.style.cssText = 'display:none;align-items:center;justify-content:center;width:44px;height:44px;background:none;border:1px solid currentColor;border-radius:8px;padding:0;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent';
      menuBtn.addEventListener('click', function(e){ e.stopPropagation(); setMenu(!open); });
      p.barEl.appendChild(menuBtn);
    }
    var narrow = window.innerWidth < (window.__navTest || 760);
    menuBtn.style.display = narrow ? 'flex' : 'none';
    var logo = p.barEl.querySelector('a');
    if(logo) menuBtn.style.color = getComputedStyle(logo).color;
    if(narrow !== wasNarrow){
      wasNarrow = narrow;
      open = false;
      paintPanel(p, narrow);
      if(narrow) p.links.style.display = 'none';
    }
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

  var stack = [];
  function trail(){
    var prev = stack.length ? stack[stack.length-1] : '';
    [].slice.call(document.querySelectorAll('[data-back]')).forEach(function(a){
      var dupe = (!prev || prev === '#/home') && a.parentElement && a.parentElement.querySelector('a[href="#/home"]');
      a.style.display = dupe ? 'none' : '';
      a.setAttribute('href', prev || '#/home');
      var name = '';
      try { name = decodeURIComponent((prev || '').split('/').pop()); } catch(err) {}
      if(name === 'home') name = 'index';
      var LABELS = {'index':'main page','certification-prep':'Certification Prep','fd-hub':'Functional Deployment articles','inventory-hub':'Inventory Management articles','articles':'all articles','recommendations':'Recommendations'};
      if(LABELS[name]) name = LABELS[name];
      else if(/^(fd|inventory)-post-\d$/.test(name)) name = 'the article';
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

  var toastEl;
  function toast(msg){
    if(!toastEl){
      toastEl = document.createElement('div');
      toastEl.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#1d243c;color:#fff;font-family:Inter,sans-serif;font-size:14px;font-weight:600;padding:12px 18px;border-radius:8px;box-shadow:0 10px 30px rgba(29,36,60,0.28);z-index:2000;opacity:0;transition:opacity .2s ease;pointer-events:none;max-width:88vw;text-align:center';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.style.opacity = '1';
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function(){ toastEl.style.opacity = '0'; }, 3200);
  }

  document.addEventListener('click', function(e){
    if(open){
      var inLink = e.target.closest && e.target.closest('nav a');
      var onBtn = menuBtn && menuBtn.contains(e.target);
      if(!onBtn && (inLink || !(e.target.closest && e.target.closest('nav')))) setMenu(false);
    }
    var mail = e.target.closest && e.target.closest('a[href^="mailto:"]');
    if(mail){
      var href = mail.getAttribute('href');
      var addr = href.slice(7).split('?')[0];
      var win = null;
      try { win = window.open(href, '_blank'); } catch(err) {}
      if(!win){
        var p = null;
        try { if(navigator.clipboard && navigator.clipboard.writeText) p = navigator.clipboard.writeText(addr); } catch(err2) {}
        if(p && p.then) p.then(function(){ toast('Email address copied: ' + addr); }, function(){ toast('Email: ' + addr); });
        else toast('Email: ' + addr);
      }
      e.preventDefault();
      return;
    }
    var hashLink = e.target.closest && e.target.closest('a[href^="#/"]');
    if(hashLink && !hashLink.hasAttribute('data-back')){
      var target = hashLink.getAttribute('href');
      var idx = stack.lastIndexOf(target);
      var looksBack = /^\s*(\u2190|<)/.test(hashLink.textContent || '');
      if(idx > -1 && looksBack){
        stack.length = idx + 1;
        backNav = true;
      }
    }
    var back = e.target.closest && e.target.closest('[data-back]');
    if(back){
      e.preventDefault();
      var prev = stack.length ? stack[stack.length-1] : '#/home';
      backNav = true;
      if(prev === location.hash) prev = '#/home';
      window.location.hash = prev;
      return;
    }
    var btn = e.target.closest && e.target.closest('[data-rec-toggle]');
    if(!btn) return;
    btn.dataset.expanded = btn.dataset.expanded === '1' ? '0' : '1';
    syncRecs();
  });
  var backNav = false;
  window.addEventListener('hashchange', function(){
    if(!/^#\//.test(location.hash)) return;
    var incoming = location.hash;
    if(incoming !== curRoute) POS[curRoute] = window.scrollY;
    if(saveTimer){ clearTimeout(saveTimer); saveTimer = null; }
    var isBack = backNav;
    backNav = false;
    if(isBack && stack.length && stack[stack.length-1] === incoming) stack.pop();
    else if(!isBack && incoming !== curRoute) stack.push(curRoute);
    qTimer = null; bar = null; wasNarrow = null; menuBtn = null; open = false;
    curRoute = incoming;
    if(isBack) restorePos(incoming);
    else { POS[incoming] = 0; [0,60,200,500,1000].forEach(function(d){ setTimeout(function(){ if(curRoute === incoming) window.scrollTo(0,0); }, d); }); }
    [0,120,400,900].forEach(function(d){ setTimeout(function(){ try{ init(); }catch(err){} }, d); });
  });
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', function(){ mobileNav(); syncRecs(); }, {passive:true});
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  [0, 300, 900, 1800, 3000].forEach(function(d){ setTimeout(init, d); });
  setInterval(function(){
    try{ trail(); }catch(e){}
    try{ mobileNav(); }catch(e){}
    try{ tick(); }catch(e){}
    try{
      [].slice.call(document.querySelectorAll('[data-reveal]')).forEach(function(el){
        if(getComputedStyle(el).opacity === '0' && !el.hasAttribute('data-reveal-pending')){ el.style.animation = ''; el.style.opacity = '1'; }
      });
    }catch(e){}
  }, 600);
})();
