/* ═══════════════════════════════════════════════════════════════
   DIT UNIVERSITY NCC  ·  MAIN UI SCRIPT
   Minimal, purposeful interactions only.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── NAV SCROLL SHADOW ──────────────────────────────────── */
  const nav = document.getElementById('mainNav');
  if (nav) {
    window.addEventListener('scroll', () =>
      nav.classList.toggle('scrolled', scrollY > 20), { passive: true });
  }

  /* ── BUTTON HOVER GLOW (follows cursor) ──────────────────── */
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      btn.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });

  /* ── MOBILE NAV ─────────────────────────────────────────── */
  const burger = document.getElementById('navBurger');
  const mobileNav = document.getElementById('mobileNav');
  burger?.addEventListener('click', () => mobileNav?.classList.toggle('open'));

  /* ── FLASH AUTO-DISMISS ─────────────────────────────────── */
  document.querySelectorAll('.flash').forEach(el => {
    setTimeout(() => {
      el.style.transition = 'opacity .4s, transform .4s';
      el.style.opacity = '0'; el.style.transform = 'translateX(24px)';
      setTimeout(() => el.remove(), 420);
    }, 3800);
  });

  /* ── COUNTER ANIMATION (stats bar) ──────────────────────── */
  function runCounter(el, end, dur = 1200) {
    let s = null;
    const step = ts => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(ease * end).toLocaleString();
      p < 1 ? requestAnimationFrame(step) : (el.textContent = end.toLocaleString());
    };
    requestAnimationFrame(step);
  }
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) {
        runCounter(e.target, +e.target.dataset.count);
        io.unobserve(e.target);
      }
    }), { threshold: .5 });
    counters.forEach(el => io.observe(el));
  }

  /* ── SUBTLE SCROLL REVEAL ────────────────────────────────── */
  const reveals = document.querySelectorAll('.reveal, .reveal-l, .stagger');
  if (reveals.length) {
    const rv = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); }
    }), { threshold: .1 });
    reveals.forEach(el => rv.observe(el));
  }

  /* ── GALLERY LIGHTBOX ───────────────────────────────────── */
  const lb    = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  document.querySelectorAll('.gal-item').forEach(item => {
    item.addEventListener('click', () => {
      const src = item.dataset.full || item.querySelector('img')?.src;
      if (lb && lbImg && src) {
        lbImg.src = src;
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    });
  });
  const closeLb = () => { lb?.classList.remove('open'); document.body.style.overflow = ''; };
  document.getElementById('lbClose')?.addEventListener('click', closeLb);
  lb?.addEventListener('click', e => e.target === lb && closeLb());
  document.addEventListener('keydown', e => e.key === 'Escape' && closeLb());

})();
