/* ==========================================================================
   Ubuntu Paws Animal Rescue: main.js
   PART 3: Enhancing Functionality and SEO

   Sections:
     1.  Config and helpers
     2.  Mobile navigation toggle
     3.  Scroll reveal animations and animated counters
     4.  Tabs and accordion (interactive elements)
     5.  Animal data loading (AJAX with fallback)
     6.  Services page: dynamic listings, search, filter, sort, modal
     7.  Gallery lightbox
     8.  Contact page map (Leaflet / OpenStreetMap)
     9.  Form validation framework
    10.  Enquiry form (AJAX submission and tailored response)
    11.  Contact form (compiles an email)
    12.  Start-up

   Everything is progressive enhancement: with JavaScript switched off the
   pages still show all of their content and the forms still render.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     1. Config and helpers
     ------------------------------------------------------------------------ */
  var CONFIG = {
    // Where the general contact form email is addressed, by message type.
    recipients: {
      general: 'shelter@ubuntupaws.org.za',
      adoption: 'shelter@ubuntupaws.org.za',
      fostering: 'fostercare@ubuntupaws.org.za',
      media: 'shelter@ubuntupaws.org.za',
      donation: 'shelter@ubuntupaws.org.za'
    },
    // Enquiry form endpoint. Replace YOUR_FORM_ID with a real Formspree id
    // (see README). While the placeholder is present the form runs in demo
    // mode and simulates a successful submission so the flow can be marked.
    demoEndpointToken: 'YOUR_FORM_ID',
    animalsUrl: 'data/animals.json',
    sponsorTiers: [
      { name: 'Bronze', amount: 150, perk: 'covers one month of food for a rescued cat' },
      { name: 'Silver', amount: 300, perk: 'covers a month of food for a dog' },
      { name: 'Gold', amount: 500, perk: 'covers vaccinations and sterilisation for one animal' }
    ],
    // Fallback copy of the animal data, used if data/animals.json cannot be
    // fetched (for example when index.html is opened straight from disk).
    fallbackAnimals: [
      { id: 'simba', name: 'Simba', species: 'dog', sex: 'male', ageYears: 2, ageLabel: '2 years', status: 'available', fee: 950, image: 'images/simba-cross-breed-dog.svg', imageAlt: 'Illustration of Simba, a friendly cross-breed dog', summary: 'A two-year-old male cross-breed dog, friendly and great with children. Fully vaccinated and sterilised.', details: 'Simba loves fetch, long walks and being around kids. He walks well on a lead and does best in a home with a garden.' },
      { id: 'miso', name: 'Miso', species: 'cat', sex: 'female', ageYears: 1, ageLabel: '1 year', status: 'available', fee: 750, image: 'images/miso-tabby-cat.svg', imageAlt: 'Illustration of Miso, a playful tabby cat', summary: 'A one-year-old female tabby cat, playful and litter-trained. Fully vaccinated and sterilised.', details: 'Miso is curious and affectionate, and gets along with other cats. She would suit a home with plenty of climbing space and toys.' },
      { id: 'rocky', name: 'Rocky', species: 'dog', sex: 'male', ageYears: 5, ageLabel: '5 years', status: 'available', fee: 950, image: 'images/rocky-terrier-mix.svg', imageAlt: 'Illustration of Rocky, a calm terrier mix', summary: 'A five-year-old male terrier mix, calm and well-suited to an apartment. Fully vaccinated and sterilised.', details: 'Rocky is a gentle dog who enjoys short walks and quiet evenings. He is house-trained and fine alone for a few hours.' },
      { id: 'luna', name: 'Luna', species: 'cat', sex: 'female', ageYears: 3, ageLabel: '3 years', status: 'available', fee: 750, image: null, imageAlt: '', summary: 'A three-year-old female cat, shy at first but very loving once settled. Fully vaccinated and sterilised.', details: 'Luna needs a patient family and a quiet space to settle in. Once she trusts you she is a champion lap cat.' },
      { id: 'max', name: 'Max', species: 'dog', sex: 'male', ageYears: 1, ageLabel: '1 year', status: 'available', fee: 950, image: null, imageAlt: '', summary: 'A one-year-old male dog full of energy, looking for an active home with a garden. Fully vaccinated and sterilised.', details: 'Max is smart, playful and still learning his manners. He would thrive with training, daily exercise and a secure garden.' },
      { id: 'daisy', name: 'Daisy', species: 'rabbit', sex: 'female', ageYears: 2, ageLabel: '2 years', status: 'available', fee: 300, image: null, imageAlt: '', summary: 'A two-year-old female rabbit, gentle and used to being handled. Sterilised and health-checked.', details: 'Daisy enjoys fresh greens and a roomy run. She is calm with respectful children and would love a bonded companion.' },
      { id: 'pepper', name: 'Pepper', species: 'cat', sex: 'male', ageYears: 4, ageLabel: '4 years', status: 'pending', fee: 750, image: null, imageAlt: '', summary: 'A four-year-old male cat with a big personality. An adoption is currently pending. Fully vaccinated and sterilised.', details: 'Pepper has an application pending. If it falls through we will update this page, so check back soon or enquire to join the waiting list.' }
    ]
  };

  var PAW_PATH =
    '<ellipse cx="12" cy="16" rx="5.5" ry="5"/><ellipse cx="5" cy="10" rx="2.4" ry="3"/>' +
    '<ellipse cx="19" cy="10" rx="2.4" ry="3"/><ellipse cx="9" cy="5" rx="2" ry="2.8"/>' +
    '<ellipse cx="15" cy="5" rx="2" ry="2.8"/>';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // Creates an element. Text is always set with textContent, never innerHTML,
  // so user-supplied or loaded text can never inject markup (XSS protection).
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function pawIcon() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'paw-icon');
    svg.innerHTML = PAW_PATH; // constant string defined above, not user input
    return svg;
  }

  function money(n) { return 'R' + Number(n).toLocaleString('en-ZA'); }
  function capitalise(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ------------------------------------------------------------------------
     2. Mobile navigation toggle
     ------------------------------------------------------------------------ */
  function initNav() {
    var header = $('header');
    var nav = $('header nav');
    if (!header || !nav) return;

    var btn = el('button', {
      type: 'button', 'class': 'nav-toggle', 'aria-expanded': 'false',
      'aria-controls': 'site-nav', 'aria-label': 'Toggle navigation menu'
    });
    btn.innerHTML = '<span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span>';
    nav.id = 'site-nav';
    header.insertBefore(btn, nav);

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    }
    btn.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
  }

  /* ------------------------------------------------------------------------
     3. Scroll reveal animations and animated counters
     ------------------------------------------------------------------------ */
  function initReveal() {
    var targets = $$('.location-card, .team-list li, .content-block h2, .gallery li, .tabs, .accordion');
    targets.forEach(function (t) { t.classList.add('reveal'); });
    if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
      targets.forEach(function (t) { t.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    targets.forEach(function (t) { io.observe(t); });
  }

  // Marks newly created nodes (e.g. animal cards) so they fade in too.
  function revealNodes(nodes) {
    nodes.forEach(function (n, i) {
      n.classList.add('reveal');
      n.style.transitionDelay = Math.min(i * 60, 360) + 'ms';
      requestAnimationFrame(function () { requestAnimationFrame(function () { n.classList.add('is-visible'); }); });
      // clear the stagger delay afterwards so hover effects stay instant
      setTimeout(function () { n.style.transitionDelay = ''; }, 1200);
    });
  }

  function initCounters() {
    var counters = $$('[data-count]');
    if (!counters.length) return;

    function setFinal(c) { c.textContent = c.getAttribute('data-count') + (c.getAttribute('data-suffix') || ''); }
    if (!('IntersectionObserver' in window) || prefersReducedMotion()) { counters.forEach(setFinal); return; }

    function run(c) {
      var target = parseInt(c.getAttribute('data-count'), 10);
      var suffix = c.getAttribute('data-suffix') || '';
      var start = null, duration = 1400;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        c.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step); else setFinal(c);
      }
      requestAnimationFrame(step);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { c.textContent = '0' + (c.getAttribute('data-suffix') || ''); io.observe(c); });
  }

  /* ------------------------------------------------------------------------
     4. Tabs and accordion
     ------------------------------------------------------------------------ */
  function initTabs() {
    $$('[data-tabs]').forEach(function (root) {
      var tabs = $$('[role="tab"]', root);
      var panels = $$('[role="tabpanel"]', root);
      if (!tabs.length) return;

      function select(index, focus) {
        tabs.forEach(function (t, i) {
          var on = i === index;
          t.setAttribute('aria-selected', String(on));
          t.tabIndex = on ? 0 : -1;
          if (on && focus) t.focus();
        });
        panels.forEach(function (p, i) { p.hidden = i !== index; });
      }
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { select(i, false); });
        t.addEventListener('keydown', function (e) {
          var n = tabs.length, next = null;
          if (e.key === 'ArrowRight') next = (i + 1) % n;
          else if (e.key === 'ArrowLeft') next = (i - 1 + n) % n;
          else if (e.key === 'Home') next = 0;
          else if (e.key === 'End') next = n - 1;
          if (next !== null) { e.preventDefault(); select(next, true); }
        });
      });
      select(0, false);
    });
  }

  function initAccordion() {
    $$('[data-accordion]').forEach(function (root) {
      var triggers = $$('.accordion-trigger', root);
      triggers.forEach(function (btn) {
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        if (!panel) return;
        panel.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
        btn.addEventListener('click', function () {
          var open = btn.getAttribute('aria-expanded') === 'true';
          // only one panel open at a time
          triggers.forEach(function (other) {
            var p = document.getElementById(other.getAttribute('aria-controls'));
            other.setAttribute('aria-expanded', 'false');
            if (p) p.hidden = true;
          });
          if (!open) { btn.setAttribute('aria-expanded', 'true'); panel.hidden = false; }
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
     5. Animal data loading (AJAX with fallback)
     ------------------------------------------------------------------------ */
  var animalsPromise = null;
  function loadAnimals() {
    if (animalsPromise) return animalsPromise;
    animalsPromise = fetch(CONFIG.animalsUrl, { headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.animals)) throw new Error('Unexpected data shape');
        return data.animals;
      })
      .catch(function () { return CONFIG.fallbackAnimals; });
    return animalsPromise;
  }

  /* ------------------------------------------------------------------------
     6. Services page: dynamic listings, search, filter, sort, modal
     ------------------------------------------------------------------------ */
  function initServices() {
    var list = $('#animal-list');
    if (!list) return;

    var searchEl = $('#animal-search');
    var speciesEl = $('#animal-species');
    var sortEl = $('#animal-sort');
    var countEl = $('#animal-count');
    var emptyEl = $('#animal-empty');
    var all = [];

    var modal = buildModal();

    function renderCard(a) {
      var li = el('li', { 'class': a.status === 'pending' ? 'is-pending' : '', 'data-id': a.id });
      var h3 = el('h3');
      h3.appendChild(pawIcon());
      h3.appendChild(document.createTextNode(' ' + a.name));
      var meta = el('p', { 'class': 'animal-meta' }, [
        el('span', { 'class': 'tag', text: capitalise(a.species) }),
        el('span', { 'class': 'tag', text: a.ageLabel }),
        el('span', { 'class': 'tag', text: capitalise(a.sex) })
      ]);
      var summary = el('p', { text: a.summary });
      var actions = el('div', { 'class': 'animal-actions' });
      var more = el('button', { type: 'button', 'class': 'btn-link', 'aria-haspopup': 'dialog' });
      more.textContent = 'Learn more about ' + a.name;
      more.addEventListener('click', function () { modal.open(a); });
      var enq = el('a', { href: 'enquiry.html?animal=' + encodeURIComponent(a.id), 'class': 'btn-link' });
      enq.textContent = a.status === 'pending' ? 'Join the waiting list' : 'Enquire about ' + a.name;
      actions.appendChild(more);
      actions.appendChild(enq);
      [h3, meta, summary, actions].forEach(function (n) { li.appendChild(n); });
      return li;
    }

    function apply() {
      var q = searchEl ? searchEl.value.trim().toLowerCase() : '';
      var sp = speciesEl ? speciesEl.value : 'all';
      var sort = sortEl ? sortEl.value : 'name-asc';

      var results = all.filter(function (a) {
        var hay = (a.name + ' ' + a.species + ' ' + a.sex + ' ' + a.summary + ' ' + a.details).toLowerCase();
        return (sp === 'all' || a.species === sp) && (!q || hay.indexOf(q) !== -1);
      });
      results.sort(function (a, b) {
        if (sort === 'age-asc') return a.ageYears - b.ageYears || a.name.localeCompare(b.name);
        if (sort === 'age-desc') return b.ageYears - a.ageYears || a.name.localeCompare(b.name);
        if (sort === 'name-desc') return b.name.localeCompare(a.name);
        return a.name.localeCompare(b.name);
      });

      list.textContent = '';
      var cards = results.map(renderCard);
      cards.forEach(function (c) { list.appendChild(c); });
      revealNodes(cards);

      if (countEl) {
        countEl.textContent = results.length === 1 ? '1 animal found' : results.length + ' animals found';
      }
      if (emptyEl) emptyEl.hidden = results.length !== 0;
    }

    [searchEl, speciesEl, sortEl].forEach(function (c) {
      if (!c) return;
      c.addEventListener('input', apply);
      c.addEventListener('change', apply);
    });

    list.setAttribute('aria-busy', 'true');
    loadAnimals().then(function (animals) {
      all = animals.slice();
      list.setAttribute('aria-busy', 'false');
      apply();
    });
  }

  // Accessible modal built on the native <dialog> element.
  function buildModal() {
    var dlg = el('dialog', { 'class': 'modal', 'aria-labelledby': 'modal-title' });
    var closeBtn = el('button', { type: 'button', 'class': 'modal-close', 'aria-label': 'Close dialog' });
    closeBtn.innerHTML = '&times;';
    var body = el('div', { 'class': 'modal-body' });
    dlg.appendChild(closeBtn);
    dlg.appendChild(body);
    document.body.appendChild(dlg);

    function close() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
    closeBtn.addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); }); // backdrop click

    var lastFocus = null;
    dlg.addEventListener('close', function () { if (lastFocus && lastFocus.focus) lastFocus.focus(); });

    return {
      open: function (a) {
        lastFocus = document.activeElement;
        body.textContent = '';
        if (a.image) {
          body.appendChild(el('img', { src: a.image, alt: a.imageAlt || a.name, width: '600', height: '600', 'class': 'modal-img' }));
        }
        body.appendChild(el('h2', { id: 'modal-title', text: a.name }));
        body.appendChild(el('p', { 'class': 'animal-meta' }, [
          el('span', { 'class': 'tag', text: capitalise(a.species) }),
          el('span', { 'class': 'tag', text: a.ageLabel }),
          el('span', { 'class': 'tag', text: capitalise(a.sex) }),
          el('span', { 'class': 'tag ' + (a.status === 'pending' ? 'tag-pending' : 'tag-available'), text: a.status === 'pending' ? 'Adoption pending' : 'Available' })
        ]));
        body.appendChild(el('p', { text: a.details }));
        body.appendChild(el('p', { 'class': 'modal-fee', text: 'Adoption fee: ' + money(a.fee) + ' (includes vaccination and sterilisation).' }));
        var cta = el('a', { href: 'enquiry.html?animal=' + encodeURIComponent(a.id), 'class': 'btn btn-primary' });
        cta.textContent = a.status === 'pending' ? 'Join the waiting list' : 'Enquire about ' + a.name;
        body.appendChild(cta);
        if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
        closeBtn.focus();
      }
    };
  }

  /* ------------------------------------------------------------------------
     7. Gallery lightbox
     ------------------------------------------------------------------------ */
  function initGallery() {
    var links = $$('.gallery a');
    if (!links.length) return;

    var dlg = el('dialog', { 'class': 'lightbox', 'aria-label': 'Image viewer' });
    var img = el('img', { alt: '' });
    var cap = el('p', { 'class': 'lightbox-caption' });
    var prev = el('button', { type: 'button', 'class': 'lightbox-nav lightbox-prev', 'aria-label': 'Previous image' });
    var next = el('button', { type: 'button', 'class': 'lightbox-nav lightbox-next', 'aria-label': 'Next image' });
    var close = el('button', { type: 'button', 'class': 'modal-close', 'aria-label': 'Close image viewer' });
    prev.innerHTML = '&#8249;'; next.innerHTML = '&#8250;'; close.innerHTML = '&times;';
    var fig = el('figure', {}, [img, cap]);
    [close, prev, fig, next].forEach(function (n) { dlg.appendChild(n); });
    document.body.appendChild(dlg);

    var index = 0, lastFocus = null;
    function show(i) {
      index = (i + links.length) % links.length;
      var a = links[index];
      var thumb = $('img', a);
      img.src = a.getAttribute('href');
      img.alt = thumb ? thumb.alt : '';
      cap.textContent = a.getAttribute('data-caption') || (thumb ? thumb.alt : '');
    }
    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      close.focus();
    }
    function shut() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }

    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) { e.preventDefault(); open(i); });
    });
    prev.addEventListener('click', function () { show(index - 1); });
    next.addEventListener('click', function () { show(index + 1); });
    close.addEventListener('click', shut);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) shut(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
    dlg.addEventListener('close', function () { if (lastFocus && lastFocus.focus) lastFocus.focus(); });
  }

  /* ------------------------------------------------------------------------
     8. Contact page map (Leaflet + OpenStreetMap)
     ------------------------------------------------------------------------ */
  function initMap() {
    var box = $('#map');
    if (!box) return;
    if (!window.L) {
      box.textContent = '';
      box.appendChild(el('p', { 'class': 'map-fallback', text: 'The interactive map could not be loaded. Please use the "View on OpenStreetMap" links above.' }));
      return;
    }
    var shelter = [-26.0968, 28.1056];
    var foster = [-26.0937, 28.0062];
    var map = L.map(box, { scrollWheelZoom: false }).setView([-26.095, 28.055], 11);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(map);

    function pin(coords, title, lines) {
      var wrap = el('div', {}, [el('strong', { text: title }), el('br')].concat(lines.reduce(function (acc, l) {
        acc.push(document.createTextNode(l), el('br')); return acc;
      }, [])));
      L.marker(coords).addTo(map).bindPopup(wrap);
    }
    pin(shelter, 'Main shelter', ['12 Baobab Street, Bramley', 'Mon\u2013Sat, 09:00\u201316:00']);
    pin(foster, 'Foster care office', ['45 Jacaranda Avenue, Randburg', 'Tue\u2013Fri, 10:00\u201315:00']);
    map.fitBounds([shelter, foster], { padding: [40, 40] });
  }

  /* ------------------------------------------------------------------------
     9. Form validation framework
     ------------------------------------------------------------------------ */
  var RULES = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    name: /^[A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F\s'.\-]*$/,
    phone: /^(\+27|0)[1-9][0-9]{8}$/ // South African numbers, after spaces/dashes are stripped
  };

  function validateField(field) {
    var v = field.value.trim();
    var type = field.getAttribute('data-validate');
    var label = field.getAttribute('data-label') || 'This field';

    if (field.tagName === 'SELECT') return field.required && !field.value ? 'Please choose an option.' : '';
    if (field.required && !v) return label + ' is required.';
    if (!v) return '';

    var min = parseInt(field.getAttribute('minlength'), 10);
    var max = parseInt(field.getAttribute('maxlength'), 10);
    if (min && v.length < min) return label + ' must be at least ' + min + ' characters (currently ' + v.length + ').';
    if (max && v.length > max) return label + ' must be no more than ' + max + ' characters.';

    if (type === 'name' && !RULES.name.test(v)) return 'Please use letters, spaces, apostrophes, full stops or hyphens only.';
    if (type === 'email' && !RULES.email.test(v)) return 'Please enter a valid email address, e.g. name@example.com.';
    if (type === 'phone') {
      var digits = v.replace(/[\s\-()]/g, '');
      if (!RULES.phone.test(digits)) return 'Please enter a valid South African number, e.g. 082 555 0123 or +27 82 555 0123.';
    }
    return '';
  }

  function showError(field, msg) {
    var err = document.getElementById(field.id + '-error');
    if (err) err.textContent = msg;
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  function validateForm(form) {
    var firstBad = null, ok = true;
    $$('[data-validate], [required]', form).forEach(function (f) {
      if (f.disabled || f.closest('[hidden]')) { showError(f, ''); return; }
      var msg = validateField(f);
      showError(f, msg);
      if (msg) { ok = false; if (!firstBad) firstBad = f; }
    });
    if (firstBad) firstBad.focus();
    return ok;
  }

  function wireLiveValidation(form) {
    $$('input, select, textarea', form).forEach(function (f) {
      if (!f.id || !document.getElementById(f.id + '-error')) return;
      var touched = false;
      f.addEventListener('blur', function () { touched = true; showError(f, validateField(f)); });
      f.addEventListener('input', function () { if (touched) showError(f, validateField(f)); });
      f.addEventListener('change', function () { if (touched) showError(f, validateField(f)); });
    });
    // live character counters
    $$('textarea[maxlength]', form).forEach(function (ta) {
      var out = document.getElementById(ta.id + '-count');
      if (!out) return;
      function update() { out.textContent = ta.value.length + ' / ' + ta.getAttribute('maxlength'); }
      ta.addEventListener('input', update); update();
    });
  }

  function isBot(form) {
    var hp = $('.hp input', form);
    return !!(hp && hp.value);
  }

  /* ------------------------------------------------------------------------
     10. Enquiry form (AJAX submission and tailored response)
     ------------------------------------------------------------------------ */
  function initEnquiryForm() {
    var form = $('#enquiry-form');
    if (!form) return;
    form.noValidate = true; // our own messages replace the browser's pop-ups
    wireLiveValidation(form);

    var typeEl = $('#enquiry-type');
    var animalWrap = $('#animal-field');
    var animalEl = $('#animal');
    var response = $('#form-response');
    var submitBtn = $('button[type="submit"]', form);
    var animals = [];

    function syncAnimalField() {
      var show = typeEl.value === 'adoption';
      animalWrap.hidden = !show;
      animalEl.disabled = !show;
    }
    typeEl.addEventListener('change', syncAnimalField);

    loadAnimals().then(function (list) {
      animals = list;
      list.forEach(function (a) {
        var label = a.name + ' (' + a.species + ', ' + a.ageLabel + (a.status === 'pending' ? ', adoption pending' : '') + ')';
        animalEl.appendChild(el('option', { value: a.id, text: label }));
      });
      // Arriving from an "Enquire about X" link on the services page
      var wanted = new URLSearchParams(window.location.search).get('animal');
      if (wanted && list.some(function (a) { return a.id === wanted; })) {
        typeEl.value = 'adoption';
        syncAnimalField();
        animalEl.value = wanted;
      }
    });
    syncAnimalField();

    function buildResponse(data) {
      var box = el('div', { 'class': 'response-card', role: 'status' });
      var first = data.name.split(/\s+/)[0];
      box.appendChild(el('h2', { text: 'Thank you, ' + first + '!' }));
      var t = data.type;

      if (t === 'adoption') {
        var a = animals.filter(function (x) { return x.id === data.animal; })[0];
        if (a) {
          if (a.status === 'pending') {
            box.appendChild(el('p', { text: a.name + ' currently has an adoption pending, so we have added you to the waiting list. We will contact you at ' + data.email + ' if ' + a.name + ' becomes available again.' }));
          } else {
            box.appendChild(el('p', { text: 'Good news: ' + a.name + ' is available for adoption.' }));
          }
          box.appendChild(el('p', { text: 'Adoption fee: ' + money(a.fee) + '. This covers vaccination, sterilisation and a health check. Your home check and a meet-and-greet with ' + a.name + ' come next.' }));
        } else {
          var avail = animals.filter(function (x) { return x.status === 'available'; });
          box.appendChild(el('p', { text: 'We currently have ' + avail.length + ' animals available for adoption. Fees are ' + money(300) + ' for rabbits, ' + money(750) + ' for cats and ' + money(950) + ' for dogs, including vaccination and sterilisation.' }));
        }
      } else if (t === 'volunteering') {
        box.appendChild(el('p', { text: 'Volunteering is free, and we currently have openings in dog walking, shelter cleaning and weekend adoption events.' }));
        box.appendChild(el('p', { text: 'Our next volunteer orientation is on the first Saturday of the month at the main shelter. Sipho, our Volunteer Coordinator, will confirm your place by email.' }));
      } else if (t === 'sponsorship') {
        box.appendChild(el('p', { text: 'Sponsorship is available at three monthly levels:' }));
        var ul = el('ul');
        CONFIG.sponsorTiers.forEach(function (tier) {
          ul.appendChild(el('li', { text: tier.name + ': ' + money(tier.amount) + ' per month, which ' + tier.perk + '.' }));
        });
        box.appendChild(ul);
        box.appendChild(el('p', { text: 'We will email you our banking details and a donation receipt. Availability is open, as there is no limit to the number of sponsors.' }));
      } else {
        box.appendChild(el('p', { text: 'We have received your enquiry and a member of the team will reply within two working days.' }));
      }
      box.appendChild(el('p', { 'class': 'response-small', text: 'A confirmation will be sent to ' + data.email + '.' }));
      return box;
    }

    function send(payload) {
      var action = form.getAttribute('action') || '';
      if (!action || action.indexOf(CONFIG.demoEndpointToken) !== -1) {
        // Demo mode: no real endpoint configured yet, so simulate the round trip.
        return new Promise(function (resolve) { setTimeout(function () { resolve({ ok: true, demo: true }); }, 900); });
      }
      return fetch(action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('Server responded with ' + res.status);
        return { ok: true };
      });
    }

    function showBanner(kind, text) {
      response.textContent = '';
      response.appendChild(el('div', { 'class': 'alert alert-' + kind, role: kind === 'error' ? 'alert' : 'status', text: text }));
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      response.textContent = '';
      if (!validateForm(form)) {
        showBanner('error', 'Please fix the highlighted fields and try again.');
        return;
      }
      if (isBot(form)) { return; } // honeypot filled: silently drop

      var data = {
        name: $('#full-name').value.trim(),
        email: $('#email').value.trim(),
        phone: $('#phone').value.trim(),
        type: typeEl.value,
        animal: typeEl.value === 'adoption' ? animalEl.value : '',
        message: $('#message').value.trim()
      };

      submitBtn.disabled = true;
      var original = submitBtn.textContent;
      submitBtn.textContent = 'Sending\u2026';
      form.setAttribute('aria-busy', 'true');

      send(data).then(function () {
        response.textContent = '';
        response.appendChild(buildResponse(data));
        form.reset();
        $$('[aria-invalid]', form).forEach(function (f) { f.removeAttribute('aria-invalid'); });
        $$('.field-error', form).forEach(function (s) { s.textContent = ''; });
        syncAnimalField();
        var cnt = $('#message-count'); if (cnt) cnt.textContent = '0 / 1000';
        response.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
      }).catch(function () {
        showBanner('error', 'Sorry, we could not send your enquiry just now. Please check your connection and try again, or email shelter@ubuntupaws.org.za.');
      }).then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = original;
        form.removeAttribute('aria-busy');
      });
    });
  }

  /* ------------------------------------------------------------------------
     11. Contact form (compiles an email)
     ------------------------------------------------------------------------ */
  function initContactForm() {
    var form = $('#contact-form');
    if (!form) return;
    form.noValidate = true;
    wireLiveValidation(form);
    var out = $('#email-preview');

    function compose(data) {
      var typeLabel = $('#msg-type option:checked').textContent;
      var to = CONFIG.recipients[data.type] || CONFIG.recipients.general;
      var subject = '[' + typeLabel + '] ' + data.subject;
      var lines = [
        'Name: ' + data.name,
        'Email: ' + data.email,
        'Phone: ' + (data.phone || 'not provided'),
        'Message type: ' + typeLabel,
        '',
        data.message
      ];
      var body = lines.join('\r\n');
      var href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      return { to: to, subject: subject, body: body, href: href };
    }

    function render(mail) {
      out.textContent = '';
      out.hidden = false;
      var card = el('div', { 'class': 'response-card', role: 'status' });
      card.appendChild(el('h3', { text: 'Your email is ready to send' }));
      card.appendChild(el('p', { text: 'We have put your details together as an email. Check it below, then choose how to send it.' }));
      var dl = el('dl', { 'class': 'email-summary' });
      [['To', mail.to], ['Subject', mail.subject]].forEach(function (row) {
        dl.appendChild(el('dt', { text: row[0] }));
        dl.appendChild(el('dd', { text: row[1] }));
      });
      card.appendChild(dl);
      card.appendChild(el('pre', { 'class': 'email-body', text: mail.body }));
      var actions = el('div', { 'class': 'animal-actions' });
      var send = el('a', { href: mail.href, 'class': 'btn btn-primary' });
      send.textContent = 'Open in my email app';
      var copy = el('button', { type: 'button', 'class': 'btn btn-secondary' });
      copy.textContent = 'Copy email text';
      copy.addEventListener('click', function () {
        var text = 'To: ' + mail.to + '\nSubject: ' + mail.subject + '\n\n' + mail.body;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { copy.textContent = 'Copied!'; },
            function () { copy.textContent = 'Copy failed'; });
        } else { copy.textContent = 'Copy not supported'; }
      });
      actions.appendChild(send);
      actions.appendChild(copy);
      card.appendChild(actions);
      out.appendChild(card);
      out.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      out.hidden = true;
      if (!validateForm(form)) return;
      if (isBot(form)) return;
      render(compose({
        name: $('#name').value.trim(),
        email: $('#email').value.trim(),
        phone: $('#phone').value.trim(),
        type: $('#msg-type').value,
        subject: $('#subject').value.trim(),
        message: $('#message').value.trim()
      }));
    });
  }

  /* ------------------------------------------------------------------------
     12. Start-up
     ------------------------------------------------------------------------ */
  function init() {
    initNav();
    initReveal();
    initCounters();
    initTabs();
    initAccordion();
    initServices();
    initGallery();
    initMap();
    initEnquiryForm();
    initContactForm();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // exposed for the automated checks in the README (not used by the site itself)
  window.__paws = { validateField: validateField, RULES: RULES };
})();
