(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Wordmark: split into letters for the rise, and size it to fill the row.
  var wm = document.getElementById('wordmark');
  var txt = wm.textContent; wm.textContent = '';
  txt.split('').forEach(function (ch, i) {
    var s = document.createElement('span');
    s.className = 'l'; s.style.setProperty('--i', i);
    s.textContent = ch === ' ' ? ' ' : ch;
    wm.appendChild(s);
  });
  function fitWordmark() {
    wm.style.fontSize = '100px';
    var pad = parseFloat(getComputedStyle(wm).paddingLeft) * 2;
    var w = wm.scrollWidth - pad;
    wm.style.fontSize = (100 * (wm.clientWidth - pad) / w) + 'px';
  }
  fitWordmark();
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
    fitWordmark();
    setTimeout(function () { root.classList.add('go'); }, 30);
  });
  // Never leave the hero hidden if fonts stall.
  setTimeout(function () { root.classList.add('go'); }, 2500);
  window.addEventListener('resize', function () { fitWordmark(); fitRot(); });

  // Rotating team name: hold, flip, pause on hover.
  var rot = document.getElementById('rot');
  var words = rot.querySelectorAll('span');
  var wi = 0, paused = false;
  function fitRot() { rot.style.width = words[wi].offsetWidth + 'px'; }
  fitRot();
  if (document.fonts) document.fonts.ready.then(fitRot);
  window.addEventListener('load', fitRot);
  // Re-measure whenever a word's rendered size changes (late font swap, resize).
  if (window.ResizeObserver) { var ro = new ResizeObserver(fitRot); words.forEach(function (w) { ro.observe(w); }); }
  rot.addEventListener('mouseenter', function () { paused = true; });
  rot.addEventListener('mouseleave', function () { paused = false; });
  if (!reduce) setInterval(function () {
    if (paused || document.hidden) return;
    var cur = words[wi]; wi = (wi + 1) % words.length; var next = words[wi];
    cur.classList.remove('in'); cur.classList.add('out');
    next.classList.remove('out'); next.style.transition = 'none';
    void next.offsetWidth; next.style.transition = '';
    next.classList.add('in'); fitRot();
    setTimeout(function () { cur.classList.remove('out'); }, 450);
  }, 2600);

  // About statement: words light up as you scroll through the pinned section.
  var stmt = document.getElementById('stmt');
  stmt.innerHTML = stmt.textContent.split(' ').map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
  var sw = stmt.querySelectorAll('.w');
  var about = document.getElementById('about'), sign = document.getElementById('sign'), stats = document.getElementById('stats');
  function scrub() {
    if (window.innerWidth < 768 || reduce) { sign.classList.add('in'); stats.classList.add('in'); return; }
    var r = about.getBoundingClientRect();
    var p = Math.max(0, Math.min(1, -r.top / (r.height - window.innerHeight) * 1.25 + 0.12));
    var lit = p * (sw.length + 4);
    sw.forEach(function (w, i) { w.style.setProperty('--o', (0.14 + 0.86 * Math.max(0, Math.min(1, lit - i))).toFixed(3)); });
    sign.classList.toggle('in', p > 0.7);
    stats.classList.toggle('in', p > 0.78);
  }
  window.addEventListener('scroll', scrub, { passive: true });
  scrub();

  // "How it's calculated" toggles under each stat.
  document.querySelectorAll('.math').forEach(function (b) {
    b.addEventListener('click', function () {
      var open = b.nextElementSibling.classList.toggle('open');
      b.setAttribute('aria-expanded', open);
    });
  });

  // Reveal sections as they enter.
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.18 });
  document.querySelectorAll('#casesHead, .case, .side, .work, .site-footer, .eyebrow').forEach(function (el) {
    if (reduce) el.classList.add('in'); else io.observe(el);
  });

  // Case cards: a cursor bubble in the card's accent.
  var cur = document.getElementById('cursor');
  document.querySelectorAll('.case-inner').forEach(function (c) {
    var hit = c.querySelector('.case-hit');
    c.addEventListener('mouseenter', function () {
      cur.textContent = hit.dataset.cursor || 'View';
      cur.style.setProperty('--cc', getComputedStyle(c.parentElement).getPropertyValue('--glow'));
      cur.classList.add('on');
    });
    c.addEventListener('mouseleave', function () { cur.classList.remove('on'); });
  });
  window.addEventListener('mousemove', function (e) { cur.style.left = e.clientX + 'px'; cur.style.top = e.clientY + 'px'; });
  document.querySelectorAll('.case-links a').forEach(function (a) {
    a.addEventListener('mouseenter', function () { cur.classList.remove('on'); });
    a.addEventListener('mouseleave', function () { cur.classList.add('on'); });
  });

  // Footer: copy email, back to top.
  var copyBtn = document.getElementById('copyBtn');
  copyBtn.addEventListener('click', function () {
    var done = function () { copyBtn.textContent = 'Copied'; copyBtn.classList.add('copied'); setTimeout(function () { copyBtn.textContent = 'Copy'; copyBtn.classList.remove('copied'); }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText('crohiomoba@gmail.com').then(done, function () {}); else done();
  });
  document.getElementById('toTop').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  // Light / dark toggle (follows the system until clicked).
  document.getElementById('themeBtn').addEventListener('click', function () {
    var dark = root.dataset.theme ? root.dataset.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  });

  // This site tests itself the way the pipeline does. The badge reports real results.
  var box = document.getElementById('checks');
  var btn = box.querySelector('button');
  function runChecks() {
    var css = getComputedStyle(root);
    var checks = [
      ['in-page links resolve', function () {
        return [].every.call(document.querySelectorAll('a[href^="#"]'), function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
      }],
      ['rotating headline has 5 teams', function () { return document.querySelectorAll('#rot span').length === 5; }],
      ['every metric explains its math', function () {
        return [].every.call(document.querySelectorAll('.stat'), function (s) { var c = s.querySelector('.calc'); return c && c.textContent.trim().length > 40; });
      }],
      ['wordmark fits the row', function () { return wm.scrollWidth <= wm.clientWidth + 2; }],
      ['no horizontal scroll', function () { return document.documentElement.scrollWidth <= window.innerWidth; }],
      ['theme tokens defined', function () { return ['--paper', '--ink', '--rose', '--hairline'].every(function (v) { return css.getPropertyValue(v).trim(); }); }],
      ['every button has a name', function () {
        return [].every.call(document.querySelectorAll('button'), function (b) { return (b.getAttribute('aria-label') || b.textContent).trim(); });
      }],
      ['fonts loaded', function () { return !document.fonts || document.fonts.check('16px "Geist"'); }]
    ];
    var passed = 0, lines = ['<div class="head">$ site build --test</div>'];
    checks.forEach(function (c) {
      var ok = false; try { ok = !!c[1](); } catch (e) {}
      if (ok) passed++;
      lines.push('<div><span class="' + (ok ? 'ok">PASS' : 'bad">FAIL') + '</span>  ' + c[0] + '</div>');
    });
    lines.push('<div class="head" style="margin-top:6px">PASS=' + passed + ' FAIL=' + (checks.length - passed) + '</div>');
    document.getElementById('checksLog').innerHTML = lines.join('');
    document.getElementById('checksDot').className = 'dot ' + (passed === checks.length ? 'pass' : 'fail');
    var f = checks.length - passed;
    document.getElementById('checksSummary').textContent = f ? 'this site: ' + f + ' failing check' + (f > 1 ? 's' : '') : 'this site: ' + passed + '/' + checks.length + ' checks passing';
  }
  btn.addEventListener('click', function () { var open = box.classList.toggle('open'); btn.setAttribute('aria-expanded', open); });
  document.addEventListener('click', function (e) { if (!box.contains(e.target)) box.classList.remove('open'); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () { setTimeout(runChecks, 50); });
  window.addEventListener('resize', runChecks);

  console.log('%cReading the source?', 'font: 600 14px system-ui; color: #D9A64E');
  console.log('Same habit here. The pipeline behind the first project, tests and all: github.com/ebukaohiomoba/revenue-attribution-elt');
})();
