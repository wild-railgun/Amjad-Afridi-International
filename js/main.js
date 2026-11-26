/**
 * main.js — shared behaviour for every page of this site.
 * Plain vanilla JS, no dependencies. Each feature only runs if its markup exists on the page.
 *
 *  0. Site config (js/config.js) 6. Portfolio filters
 *  1. Page-load fade-in
 *  2. Sticky navbar on scroll  7. Lightbox (arrows / Esc / focus return)
 *  3. Mobile menu              8. Contact form validation
 *  4. Scroll-reveal            9. FAQ accordion
 *  5. Testimonials slider     10. Stat counters, image fallbacks, videos, footer year
 */
(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Page-load fade-in ------------------------------------------- */
  document.documentElement.classList.add('js');
  window.addEventListener('DOMContentLoaded', () => document.body.classList.add('is-loaded'));

  /* 2. Sticky navbar: adds .is-scrolled once the page moves --------- */
  function initNavbar() {
    const header = $('.site-header');
    if (!header) return;
    const update = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* 3. Mobile menu (hamburger) ------------------------------------- */
  function initMenu() {
    const toggle = $('.nav-toggle');
    const nav = $('#site-nav');
    if (!toggle || !nav) return;

    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
    };

    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    // Close on link click, on Esc, and when resizing up to desktop.
    $$('a', nav).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 900px)').addEventListener('change', (mq) => { if (mq.matches) setOpen(false); });
  }

  /* 4. Scroll-reveal via IntersectionObserver ---------------------- */
  function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el) => io.observe(el));
  }

  /* 5. Testimonials slider ----------------------------------------- */
  function initSlider() {
    $$('[data-slider]').forEach((slider) => {
      const track = $('.slider-track', slider);
      const slides = $$('.slide', slider);
      const dotsWrap = $('.slider-dots', slider);
      if (!track || slides.length < 2) return;
      let index = 0;
      let timer = null;

      const dots = slides.map((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'slider-dot';
        b.setAttribute('aria-label', `Show testimonial ${i + 1} of ${slides.length}`);
        b.addEventListener('click', () => { go(i); restart(); });
        dotsWrap && dotsWrap.appendChild(b);
        return b;
      });

      function go(i) {
        index = (i + slides.length) % slides.length;
        track.style.transform = `translateX(-${index * 100}%)`;
        slides.forEach((s, n) => s.setAttribute('aria-hidden', String(n !== index)));
        dots.forEach((d, n) => d.setAttribute('aria-current', String(n === index)));
      }
      const start = () => { if (!reduceMotion) timer = setInterval(() => go(index + 1), 6500); };
      const stop = () => clearInterval(timer);
      const restart = () => { stop(); start(); };

      $('[data-slider-prev]', slider)?.addEventListener('click', () => { go(index - 1); restart(); });
      $('[data-slider-next]', slider)?.addEventListener('click', () => { go(index + 1); restart(); });
      slider.addEventListener('mouseenter', stop);
      slider.addEventListener('mouseleave', start);
      slider.addEventListener('focusin', stop);
      slider.addEventListener('focusout', start);
      slider.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') go(index - 1);
        if (e.key === 'ArrowRight') go(index + 1);
      });
      go(0);
      start();
    });
  }

  /* 6. Portfolio filters ------------------------------------------- */
  function initFilters() {
    const buttons = $$('[data-filter]');
    const items = $$('[data-category]');
    if (!buttons.length || !items.length) return;
    const status = $('#filter-status');

    buttons.forEach((btn) => btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      let shown = 0;
      items.forEach((item) => {
        const match = filter === 'all' || item.dataset.category === filter;
        item.hidden = !match;
        if (match) { shown++; item.classList.add('is-visible'); }
      });
      if (status) status.textContent = `Showing ${shown} ${shown === 1 ? 'image' : 'images'}`;
    }));
  }

  /* 7. Lightbox ---------------------------------------------------- */
  function initLightbox() {
    const triggers = $$('[data-lightbox]');
    if (!triggers.length) return;

    // Build the lightbox once and append to <body>.
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Image viewer');
    box.hidden = true;
    box.innerHTML = `
      <button type="button" class="lightbox-close" aria-label="Close image viewer">&times;</button>
      <button type="button" class="lightbox-prev" aria-label="Previous image">&#8592;</button>
      <figure class="lightbox-figure">
        <img class="lightbox-img" alt="">
        <figcaption class="lightbox-caption"></figcaption>
      </figure>
      <button type="button" class="lightbox-next" aria-label="Next image">&#8594;</button>`;
    document.body.appendChild(box);

    const img = $('.lightbox-img', box);
    const caption = $('.lightbox-caption', box);
    let list = [];
    let current = 0;
    let lastFocus = null;

    // Only navigate between images that are currently visible (respects filters).
    const visible = () => triggers.filter((t) => !t.closest('[hidden]'));

    function show(i) {
      current = (i + list.length) % list.length;
      const t = list[current];
      const thumb = $('img', t);
      img.src = t.getAttribute('href') || thumb.src;
      img.alt = thumb ? thumb.alt : '';
      caption.textContent = `${t.dataset.caption || ''}  ·  ${current + 1} / ${list.length}`;
    }
    function open(trigger) {
      list = visible();
      lastFocus = trigger;
      box.hidden = false;
      document.body.classList.add('lightbox-open');
      show(list.indexOf(trigger));
      $('.lightbox-close', box).focus();
    }
    function close() {
      box.hidden = true;
      document.body.classList.remove('lightbox-open');
      lastFocus && lastFocus.focus();
    }

    triggers.forEach((t) => t.addEventListener('click', (e) => { e.preventDefault(); open(t); }));
    $('.lightbox-close', box).addEventListener('click', close);
    $('.lightbox-prev', box).addEventListener('click', () => show(current - 1));
    $('.lightbox-next', box).addEventListener('click', () => show(current + 1));
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    document.addEventListener('keydown', (e) => {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'ArrowRight') show(current + 1);
      else if (e.key === 'Tab') {
        // Keep focus inside the dialog.
        const f = $$('button', box);
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* 8. Contact form validation (client-side only, no backend) ------ */
  function initForm() {
    const form = $('[data-validate]');
    if (!form) return;
    const success = $('.form-success');

    const rules = {
      name: (v) => v.trim().length >= 2 || 'Please enter your full name.',
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
      phone: (v) => /^[+\d][\d\s()-]{6,}$/.test(v.trim()) || 'Please enter a valid phone number (digits, spaces, + or -).',
      service: (v) => v !== '' || 'Please choose an option.',
      date: (v) => {
        if (!v) return 'Please pick a date.';
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return new Date(v + 'T00:00:00') >= today || 'Please choose a date in the future.';
      },
      message: (v) => v.trim().length >= 20 || 'Please write at least 20 characters about your project.',
    };

    function check(field) {
      const rule = rules[field.name];
      if (!rule) return true;
      const result = rule(field.value);
      const error = $(`#${field.id}-error`);
      const ok = result === true;
      field.setAttribute('aria-invalid', String(!ok));
      field.closest('.field')?.classList.toggle('has-error', !ok);
      if (error) error.textContent = ok ? '' : result;
      return ok;
    }

    $$('input, select, textarea', form).forEach((f) => {
      f.addEventListener('blur', () => { if (f.value) check(f); });
      f.addEventListener('input', () => { if (f.getAttribute('aria-invalid') === 'true') check(f); });
    });

    // Don't allow past dates in the native picker either.
    const date = $('input[type="date"]', form);
    if (date) date.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fields = $$('input, select, textarea', form).filter((f) => rules[f.name]);
      const firstBad = fields.find((f) => !check(f)) || null;
      fields.forEach(check);
      if (firstBad) { firstBad.focus(); return; }
      // Success: no data is sent anywhere — this is a demo.
      form.reset();
      fields.forEach((f) => f.removeAttribute('aria-invalid'));
      if (success) { success.hidden = false; success.focus(); }
    });
  }

  /* 9. FAQ accordion ----------------------------------------------- */
  function initAccordion() {
    $$('.accordion-trigger').forEach((btn) => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        panel.hidden = open;
      });
    });
  }

  /* 10a. Animated stat counters ------------------------------------ */
  function initCounters() {
    const nums = $$('[data-count]');
    if (!nums.length) return;
    const run = (el) => {
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      if (reduceMotion) { el.textContent = target + suffix; return; }
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min((t - t0) / 1400, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    }), { threshold: 0.5 });
    nums.forEach((n) => io.observe(n));
  }

  /* 10b. Missing images -> styled gradient placeholder -------------- */
  function initImageFallbacks() {
    const mark = (img) => {
      img.classList.add('img-missing');
      img.closest('figure, .media, a, .hero, .cta-banner')?.classList.add('has-missing-img');
    };
    $$('img').forEach((img) => {
      if (img.complete && img.naturalWidth === 0) mark(img);
      else img.addEventListener('error', () => mark(img), { once: true });
    });
  }

  /* 0. Site config (js/config.js) -----------------------------------
   * Elements carry the default text in HTML (so pages work without JS);
   * window.SITE_CONFIG overrides it everywhere at once.
   *   data-config="measurements.height"      -> textContent
   *   data-config-href="links.email"         -> href
   *   data-config-count="stats.years"        -> animated counter target   */
  function initConfig() {
    const c = window.SITE_CONFIG;
    if (!c) return;
    const get = (key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), c);
    $$('[data-config]').forEach((el) => { const v = get(el.dataset.config); if (v != null) el.textContent = v; });
    $$('[data-config-href]').forEach((el) => { const v = get(el.dataset.configHref); if (v) el.setAttribute('href', v); });
    $$('[data-config-count]').forEach((el) => {
      const v = get(el.dataset.configCount);
      if (v != null) { el.dataset.count = v; el.textContent = v + (el.dataset.suffix || ''); }
    });
  }

  /* 10d. Videos ------------------------------------------------------
   * Autoplaying (muted, looping) videos only play while on screen, and
   * never autoplay for visitors who ask for reduced motion.             */
  function initVideos() {
    const vids = $$('video[autoplay]');
    if (!vids.length) return;
    if (reduceMotion) { vids.forEach((v) => { v.removeAttribute('autoplay'); v.pause(); }); return; }
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) { v.play().catch(() => {}); } else if (!v.paused) { v.pause(); }
    }), { threshold: 0.25 });
    vids.forEach((v) => io.observe(v));
  }

  /* 10c. Footer year ------------------------------------------------ */
  function initYear() {
    $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initConfig();
    initImageFallbacks();
    initNavbar();
    initMenu();
    initReveal();
    initSlider();
    initFilters();
    initLightbox();
    initForm();
    initAccordion();
    initCounters();
    initVideos();
    initYear();
  });
})();
