/* ═══════════════════════════════════════════════════════════════
   DIT UNIVERSITY NCC  ·  MAIN UI SCRIPT
   Animations · Interactions · Day/Night Mode
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── NAV SCROLL ─────────────────────────────────────────── */
  const nav = document.getElementById('mainNav');
  if (nav) {
    window.addEventListener('scroll', () =>
      nav.classList.toggle('scrolled', scrollY > 50), { passive: true });
  }

  /* ── MOBILE NAV ─────────────────────────────────────────── */
  const burger = document.getElementById('navBurger');
  const mobileNav = document.getElementById('mobileNav');
  burger?.addEventListener('click', () => mobileNav?.classList.toggle('open'));

  /* ── DAY / NIGHT MODE ───────────────────────────────────── */
  const modeBtn = document.getElementById('modeBtn');
  const applyMode = (m) => {
    document.body.classList.toggle('night-mode', m === 'night');
    if (window.__setSceneMode) window.__setSceneMode(m);
  };
  const savedMode = localStorage.getItem('ncc-mode') || 'day';
  applyMode(savedMode);
  modeBtn?.addEventListener('click', () => {
    const next = document.body.classList.contains('night-mode') ? 'day' : 'night';
    localStorage.setItem('ncc-mode', next);
    applyMode(next);
  });

  /* ── FLASH AUTO-DISMISS ─────────────────────────────────── */
  document.querySelectorAll('.flash').forEach(el => {
    setTimeout(() => {
      el.style.transition = 'opacity .4s, transform .4s';
      el.style.opacity = '0'; el.style.transform = 'translateX(24px)';
      setTimeout(() => el.remove(), 420);
    }, 3800);
  });

  /* ── COUNTER ANIMATION ──────────────────────────────────── */
  function runCounter(el, end, dur = 1700) {
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

  /* ── SCROLL REVEAL ──────────────────────────────────────── */
  const reveals = document.querySelectorAll('.reveal, .reveal-l');
  if (reveals.length) {
    const rv = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); }
    }), { threshold: .12 });
    reveals.forEach(el => rv.observe(el));
  }

  /* ── CADET CARD 3D TILT ─────────────────────────────────── */
  document.querySelectorAll('.cadet-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r   = card.getBoundingClientRect();
      const x   = ((e.clientX - r.left) / r.width  - .5) * 14;
      const y   = ((e.clientY - r.top)  / r.height - .5) * 14;
      card.style.transform = `translateY(-6px) rotateX(${-y}deg) rotateY(${x}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform .45s ease';
      card.style.transform = '';
      setTimeout(() => card.style.transition = '', 450);
    });
  });

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

  /* ── GSAP HERO ENTRANCE ─────────────────────────────────── */
  if (typeof gsap !== 'undefined') {
    const tl = gsap.timeline({ delay: .25 });
    tl.to('.hero-eyebrow', { opacity:1, duration:.7, ease:'power2.out' })
      .to('.hero-title',   { opacity:1, y:0, duration:.8, ease:'power3.out' }, '-=.4')
      .to('.hero-sub',     { opacity:1, y:0, duration:.6, ease:'power2.out' }, '-=.5')
      .to('.hero-badge',   { opacity:1, duration:.5 }, '-=.3')
      .to('.hero-cta',     { opacity:1, y:0, duration:.6, ease:'power2.out' }, '-=.3');
    gsap.set('.hero-title,.hero-sub,.hero-cta', { y: 26 });

    gsap.registerPlugin(ScrollTrigger);
    document.querySelectorAll('.stagger').forEach(grid => {
      gsap.from(grid.querySelectorAll(':scope > *'), {
        opacity:0, y:40, scale:.96, stagger:.09, duration:.62,
        ease:'power2.out',
        scrollTrigger:{ trigger: grid, start:'top 82%' }
      });
    });
  }

})();
