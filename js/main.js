/* 北投市場蕭太太水餃
   這個檔案只做五件事：標出今天星期幾、標題逐字落下、捲動到才出現、
   跟著頁面的選單橫條、照片列的暫停鈕。 */

/* ---------- 營業狀態 ----------
   day：0 是週日、1 是週一……6 是週六。minutes：從半夜零點起算的分鐘數。
   營業時間是早上 8:00（480 分）到下午 1:30（810 分），週一公休。
   要改營業時間，改這裡的數字和文字就好。 */
function shopStatus(day, minutes) {
  var names = ['日', '一', '二', '三', '四', '五', '六'];
  if (day === 1) return { text: '今天週一公休，週二早上八點見', open: false };
  if (minutes < 480) return { text: '今天週' + names[day] + '，早上八點開門', open: false };
  if (minutes < 810) return { text: '營業中，下午一點半收攤', open: true };
  var tomorrowIsMonday = (day + 1) % 7 === 1;
  return { text: tomorrowIsMonday ? '今天收攤了，週二早上八點見' : '今天收攤了，明天早上八點見', open: false };
}

/* 不管訪客人在哪裡，一律用台北時間判斷 */
function taipeiNow() {
  var parts = {};
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
  return {
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday),
    minutes: (+parts.hour % 24) * 60 + +parts.minute
  };
}

(function () {
  document.documentElement.classList.add('js');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- 營業時間表標出今天 ----------
     頁首目前不顯示「營業中／收攤了」的文字。之後想加回來，用上面的 shopStatus 就能取得。 */
  function showStatus() {
    var now = taipeiNow();
    [].forEach.call(document.querySelectorAll('#days li'), function (li) {
      var today = +li.dataset.d === now.day;
      li.classList.toggle('today', today);
      if (today) li.setAttribute('aria-current', 'date'); else li.removeAttribute('aria-current');
    });
  }
  showStatus();
  setInterval(showStatus, 60000); /* 頁面開著的時候，每分鐘更新一次 */

  /* ---------- 標題逐字落下 ---------- */
  var lead = $('lead');
  if (lead) {
    var text = lead.textContent;
    lead.setAttribute('aria-label', text);
    lead.textContent = '';
    text.split('').forEach(function (ch, i) {
      var span = document.createElement('span');
      span.className = 'ch';
      span.style.setProperty('--i', i);
      span.setAttribute('aria-hidden', 'true');
      span.textContent = ch;
      lead.appendChild(span);
    });
  }

  /* ---------- 捲動到時才出現（只播一次） ---------- */
  var reveal = document.querySelectorAll('.rv, .prints, .dust, #lead');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -14% 0px' });
    [].forEach.call(reveal, function (el) { io.observe(el); });
  } else {
    [].forEach.call(reveal, function (el) { el.classList.add('in'); });
  }

  /* ---------- 選單橫條、目前位置、照片視差 ---------- */
  var bar = $('tb');
  var parallax = [].slice.call(document.querySelectorAll('[data-par]'));
  var links = [].slice.call(document.querySelectorAll('.nav a, .tb__nav a'));
  var sections = ['#about', '#price', '#stories', '#find']
    .map(function (id) { return document.querySelector(id); })
    .filter(function (el) { return el && el.offsetParent !== null; }); /* 關掉的區塊不算 */
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;

    /* 捲過主照片後，橫條一直跟著 */
    var on = y > vh * 0.7;
    bar.classList.toggle('is-on', on);
    bar.inert = !on;

    /* 選單標出目前看到哪一段 */
    var current = sections[0];
    sections.forEach(function (el) { if (el.getBoundingClientRect().top < vh * 0.45) current = el; });
    links.forEach(function (a) {
      if (current && a.getAttribute('href') === '#' + current.id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });

    /* 照片輕微視差（只在桌面，且沒有開「減少動態效果」時） */
    if (!reduce && window.innerWidth > 820) {
      parallax.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var offset = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.par);
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)' + (el.tagName === 'IMG' ? ' scale(1.12)' : '');
      });
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- 照片列暫停鈕 ---------- */
  var gallery = $('gal'), control = $('galctl');
  if (gallery && control) {
    control.addEventListener('click', function () {
      var paused = gallery.classList.toggle('is-paused');
      control.setAttribute('aria-pressed', paused);
      control.textContent = paused ? '繼續播放' : '暫停照片';
    });
  }
})();
