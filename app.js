/* ═══════════════════════════════════════════════════════════════
   Connection Crew · Mobile Mart × BNI
   An interactive scratch-card presentation experience.
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ────────────────────────── Data ────────────────────────── */

/*
  Profile photos: drop square images into a /pfp/ folder using the filenames
  below (pfp/presenter-01.jpg … pfp/presenter-06.jpg). Until a photo exists,
  the card gracefully falls back to the presenter's initials.
*/
const PRESENTERS = [
  {
    name: 'Sudheesh M',
    company: 'Mobile Mart',
    category: 'Mobile Sales and Service',
    email: 'mobilemartcochin@gmail.com',
    phone: '8089058180',
    image: 'connection_crew_page-0001.jpg',
    photo: 'presenter-01.png',
  },
  {
    name: 'Rahul R Kumar',
    company: 'Archon Solutions',
    category: 'ERP Solution',
    email: 'rahul.r@aspl.be',
    phone: '8137977477',
    image: 'connection_crew_page-0002.jpg',
    photo: 'presenter-02.png',
  },
  {
    name: 'Al-Nishan Shahul',
    company: 'Almiya Future Energies Pvt Ltd',
    category: 'Solar Energy',
    email: 'alnishan@gmail.com',
    phone: '7559833373',
    image: 'connection_crew_page-0003.jpg',
    photo: 'presenter-03.png',
  },
  {
    name: 'Shynu Kumar',
    company: 'Edifice',
    category: 'Residential Construction',
    email: 'shynukumar@gmail.com',
    phone: '9400460066',
    image: 'connection_crew_page-0004.jpg',
    photo: 'presenter-04.png',
  },
  {
    name: 'Sreeja Ajith',
    company: 'Tyrex by Tyre Guru',
    category: 'Tyre Sales / Replacement',
    email: 'cochinventures@gmail.com',
    phone: '9895465592',
    image: 'connection_crew_page-0005.jpg',
    photo: 'presenter-05.png',
  },
  {
    name: 'Sudharshan M',
    company: 'Cellular World',
    category: 'Systems / Laptops',
    email: 'sudhu@cellularworld.co.in',
    phone: '9645003395',
    image: 'connection_crew_page-0006.jpg',
    photo: 'presenter-06.png',
  },
];

const MIN_SCRATCH_DISTANCE = 40; // px of pointer travel that counts as a real scratch (a tap won't trigger)
const CONFETTI_COLORS = ['#cf2030', '#e8b84b', '#111114', '#f3c8cc', '#8f1019', '#f5d58e']; // no pure white — invisible on the white canvas

/* ────────────────────────── State ────────────────────────── */

const state = {
  presentedCount: 0,
  activeIndex: -1,
  closing: false,
  logoImage: null,
  scratchLock: false,
};

const $ = (sel) => document.querySelector(sel);

const els = {
  intro: $('#intro'),
  beginBtn: $('#begin-btn'),
  stage: $('#stage'),
  grid: $('#card-grid'),
  progressCount: $('#progress-count'),
  overlay: $('#overlay'),
  overlayImage: $('#overlay-image'),
  overlayName: $('#overlay-name'),
  overlayCompany: $('#overlay-company'),
  overlayCategory: $('#overlay-category'),
  overlayEmail: $('#overlay-email'),
  overlayPhone: $('#overlay-phone'),
  overlayKicker: $('#overlay-kicker'),
  closeBtn: $('#close-btn'),
  finale: $('#finale'),
  replayBtn: $('#replay-btn'),
  confettiLayer: $('#confetti-layer'),
};

/* ────────────────────────── Helpers ────────────────────────── */

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ────────────────────────── Foil painter ────────────────────────── */

function paintFoil(canvas, index) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.height;

  // Base gradient — rich BNI crimson with depth
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#d9333f');
  grad.addColorStop(0.45, '#b31824');
  grad.addColorStop(1, '#7c0d15');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Diagonal satin sheen bands
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#ffffff';
  for (let i = -2; i < 8; i++) {
    ctx.save();
    ctx.translate(i * (w / 4), 0);
    ctx.rotate(-0.5);
    ctx.fillRect(0, -h, w * 0.09, h * 3);
    ctx.restore();
  }
  ctx.restore();

  // Subtle gold dot constellation
  ctx.save();
  const seed = (index + 1) * 97;
  for (let i = 0; i < 46; i++) {
    const px = ((Math.sin(seed + i * 12.9898) * 43758.5453) % 1 + 1) % 1 * w;
    const py = ((Math.sin(seed + i * 78.233) * 12543.123) % 1 + 1) % 1 * h;
    const r = 1 + (i % 3);
    ctx.globalAlpha = 0.10 + (i % 4) * 0.05;
    ctx.fillStyle = i % 3 === 0 ? '#e8b84b' : '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Centre medallion
  const cx = w / 2;
  const cy = h / 2 - h * 0.04;
  const R = Math.min(w, h) * 0.19;

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.45, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.13)';
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Draw BNI logo inside medallion when loaded, else fallback number
  if (state.logoImage && state.logoImage.complete && state.logoImage.naturalWidth) {
    const img = state.logoImage;
    const maxW = R * 1.35;
    const scale = maxW / img.naturalWidth;
    const iw = img.naturalWidth * scale;
    const ih = img.naturalHeight * scale;
    ctx.drawImage(img, cx - iw / 2, cy - ih / 2, iw, ih);
  } else {
    ctx.fillStyle = '#b31824';
    ctx.font = `700 ${R * 0.9}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(index + 1), cx, cy + 2);
  }

  // Card number chip (top-left)
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  roundedRectPath(ctx, 18, 18, 46, 30, 15);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = '700 14px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`0${index + 1}`, 41, 34);
  ctx.restore();

  // Leave the context with an identity transform so scratch strokes
  // (which work in physical canvas pixels) land exactly under the pointer
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/* ────────────────────────── Scratch mechanic ────────────────────────── */

function makeScratchable(canvas, onReveal) {
  const ctx = canvas.getContext('2d');
  const card = canvas.closest('.card');
  let scratching = false;
  let last = null;
  let revealed = false;
  let travelled = 0; // total pointer travel while scratching, in CSS px

  // Pointer position relative to the canvas box, in CSS pixels
  function localPoint(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  // Draw in CSS-pixel space with an explicit per-axis transform.
  // Immune to DPR, leftover context transforms, and canvas stretch.
  function scratchStroke(from, to) {
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width;
    const sy = canvas.height / r.height;
    ctx.save();
    ctx.setTransform(sx, 0, 0, sy, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = r.width * 0.17; // brush diameter in CSS px
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (revealed || !e.isPrimary || state.scratchLock) return;
    e.preventDefault(); // stop native drag/selection of anything beneath the foil
    state.scratchLock = true; // only one card can be scratched at a time
    scratching = true;
    canvas.dataset.touched = '1';
    card.classList.add('is-scratching'); // pin the card still so strokes stay under the pointer
    canvas.setPointerCapture(e.pointerId);
    last = { local: localPoint(e), x: e.clientX, y: e.clientY };
    scratchStroke(last.local, last.local);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!scratching || revealed) return;
    const p = { local: localPoint(e), x: e.clientX, y: e.clientY };
    scratchStroke(last.local, p.local);
    travelled += Math.hypot(p.x - last.x, p.y - last.y);
    last = p;
  });

  // Reveal the moment they let go — any genuine scratch gesture counts,
  // but a plain click/tap with no movement does not.
  const stop = () => {
    if (!scratching) return;
    scratching = false;
    state.scratchLock = false;
    card.classList.remove('is-scratching');
    if (!revealed && travelled >= MIN_SCRATCH_DISTANCE) {
      revealed = true;
      onReveal();
    }
  };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
}

/* ────────────────────────── Confetti ────────────────────────── */

function burstConfetti(originX, originY, count = 90) {
  const layer = els.confettiLayer;
  const pieces = [];

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    el.style.left = `${originX}px`;
    el.style.top = `${originY}px`;
    if (i % 4 === 0) el.style.borderRadius = '50%';
    layer.appendChild(el);
    pieces.push(el);
  }

  pieces.forEach((el) => {
    const angle = Math.random() * Math.PI * 2;
    const velocity = 220 + Math.random() * 420;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity - 260;
    const rot = (Math.random() - 0.5) * 900;
    const dur = 1.3 + Math.random() * 1.1;

    gsap.set(el, { scale: 0.6 + Math.random() * 0.9, rotation: Math.random() * 360 });
    gsap.to(el, {
      x: dx,
      duration: dur,
      ease: 'power2.out',
    });
    gsap.to(el, {
      y: dy,
      duration: dur * 0.42,
      ease: 'power2.out',
      onComplete() {
        gsap.to(el, {
          y: dy + 520 + Math.random() * 260,
          duration: dur * 0.85,
          ease: 'power1.in',
        });
      },
    });
    gsap.to(el, { rotation: `+=${rot}`, duration: dur * 1.3, ease: 'none' });
    gsap.to(el, {
      opacity: 0,
      duration: 0.5,
      delay: dur * 0.95,
      onComplete: () => el.remove(),
    });
  });
}

/* ────────────────────────── Cards ────────────────────────── */

function buildCards() {
  PRESENTERS.forEach((p, i) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.index = String(i);

    card.innerHTML = `
      <div class="card__reveal">
        <div class="card__avatar">
          <span class="card__avatar-ring"></span>
          <span class="card__avatar-initials">${initials(p.name)}</span>
          <img class="card__avatar-img" src="${p.photo}" alt="" draggable="false" onerror="this.remove()" />
        </div>
        <h3 class="card__name">${p.name}</h3>
        <p class="card__meta"><strong>${p.company}</strong><br/>${p.category}</p>
        <span class="card__badge">Presenter 0${i + 1}</span>
      </div>
      <canvas class="card__foil" aria-label="Scratch card ${i + 1}"></canvas>
      <span class="card__hint">Scratch me</span>
    `;

    els.grid.appendChild(card);

    const canvas = card.querySelector('.card__foil');
    const hint = card.querySelector('.card__hint');

    requestAnimationFrame(() => paintFoil(canvas, i));

    makeScratchable(canvas, () => revealCard(card, canvas, hint, i));
  });
}

function revealCard(card, canvas, hint, index) {
  card.classList.add('is-revealed');

  const rect = card.getBoundingClientRect();
  burstConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 80);

  const tl = gsap.timeline({
    onComplete: () => openOverlay(index),
  });

  tl.to(hint, { opacity: 0, duration: 0.2 }, 0)
    .to(canvas, { opacity: 0, duration: 0.55, ease: 'power2.out' }, 0)
    .fromTo(
      card,
      { scale: 1 },
      { scale: 1.05, duration: 0.35, ease: 'power2.out' },
      0
    )
    .to(card, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' }, 0.35)
    .set(canvas, { pointerEvents: 'none' }, 0)
    .to({}, { duration: 0.55 }); // savour the moment before the page opens
}

/* ────────────────────────── Overlay ────────────────────────── */

function openOverlay(index) {
  const p = PRESENTERS[index];
  state.activeIndex = index;

  els.overlayImage.src = p.image;
  els.overlayImage.alt = `${p.name} — presentation page`;
  els.overlayName.textContent = p.name;
  els.overlayCompany.textContent = p.company;
  els.overlayCategory.textContent = p.category;
  els.overlayEmail.querySelector('.overlay__contact-text').textContent = p.email;
  els.overlayEmail.href = `mailto:${p.email}`;
  els.overlayPhone.querySelector('.overlay__contact-text').textContent = p.phone;
  els.overlayPhone.href = `tel:${p.phone}`;

  els.overlay.setAttribute('aria-hidden', 'false');

  const panelItems = [
    els.overlayKicker,
    els.overlayName,
    els.overlayCompany,
    els.overlayCategory,
    $('.overlay__divider'),
    els.overlayEmail,
    els.overlayPhone,
  ];

  gsap.timeline()
    .set(els.overlay, { visibility: 'visible' })
    .fromTo(els.overlay, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' })
    .fromTo(
      els.overlayImage,
      { y: 46, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: 'expo.out' },
      0.12
    )
    .fromTo(
      panelItems,
      { y: 26, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.07 },
      0.28
    )
    .fromTo(
      $('.overlay__chrome'),
      { y: -18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out' },
      0.1
    );
}

function closeOverlay() {
  if (state.activeIndex === -1 || state.closing) return; // guard double-click / Escape spam
  state.closing = true;
  const index = state.activeIndex;

  gsap.timeline({
    onComplete: () => {
      gsap.set(els.overlay, { visibility: 'hidden' });
      els.overlay.setAttribute('aria-hidden', 'true');
      state.closing = false;
      markPresented(index);
    },
  })
    .to(els.overlayImage, { y: 14, opacity: 0, duration: 0.18, ease: 'power2.in' }, 0)
    .to(els.overlay, { opacity: 0, duration: 0.22, ease: 'power2.in' }, 0.04);
}

function markPresented(index) {
  if (index < 0) return;
  const card = els.grid.querySelector(`.card[data-index="${index}"]`);
  if (card && !card.classList.contains('is-presented')) {
    card.classList.add('is-presented');
    card.querySelector('.card__badge').textContent = 'Presented ✓';
    state.presentedCount++;
    els.progressCount.textContent = String(state.presentedCount);

    gsap.fromTo(card, { scale: 0.97 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.55)' });
    gsap.fromTo('#progress', { scale: 1.12 }, { scale: 1, duration: 0.55, ease: 'elastic.out(1, 0.6)' });
  }
  state.activeIndex = -1;

  if (state.presentedCount === PRESENTERS.length) {
    setTimeout(showFinale, 900);
  }
}

/* ────────────────────────── Finale ────────────────────────── */

function showFinale() {
  els.finale.setAttribute('aria-hidden', 'false');
  gsap.timeline()
    .set(els.finale, { visibility: 'visible' })
    .fromTo(els.finale, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' })
    .fromTo(
      ['.finale__logo', '.finale__title', '.finale__sub', '#replay-btn'],
      { y: 34, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.1 },
      0.15
    )
    .call(() => {
      burstConfetti(window.innerWidth * 0.5, window.innerHeight * 0.32, 140);
      setTimeout(() => burstConfetti(window.innerWidth * 0.25, window.innerHeight * 0.4, 70), 400);
      setTimeout(() => burstConfetti(window.innerWidth * 0.75, window.innerHeight * 0.4, 70), 700);
    }, null, 0.4);
}

/* ────────────────────────── Intro sequence ────────────────────────── */

function playIntro() {
  gsap.timeline()
    .fromTo('.intro__logo', { y: 24, opacity: 0, scale: 0.85 }, { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'expo.out' })
    .fromTo('.intro__eyebrow', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out' }, 0.25)
    .fromTo('.intro__title-line span', { yPercent: 110 }, { yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: 0.12 }, 0.35)
    .fromTo('#begin-btn', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out' }, 0.75)
    .fromTo('.intro__glow', { opacity: 0 }, { opacity: 1, duration: 1.6, ease: 'power1.out' }, 0);
}

function enterStage() {
  window.scrollTo(0, 0);
  gsap.timeline()
    .to(els.intro, { opacity: 0, duration: 0.55, ease: 'power2.inOut' })
    .set(els.intro, { visibility: 'hidden', display: 'none' })
    .set(els.stage, { visibility: 'visible' })
    .fromTo('.stage__header', { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out' })
    .fromTo(
      '.card',
      { y: 56, opacity: 0, scale: 0.94 },
      { y: 0, opacity: 1, scale: 1, duration: 0.95, ease: 'expo.out', stagger: 0.09 },
      '-=0.45'
    )
    .fromTo('.stage__footer', { opacity: 0 }, { opacity: 1, duration: 0.7 }, '-=0.4');
}

/* ────────────────────────── Boot ────────────────────────── */

function boot() {
  // Preload logo for the foil medallion, then paint cards
  const logo = new Image();
  logo.src = 'bni-logo-freelogovectors.net_.png';
  logo.onload = () => {
    state.logoImage = logo;
    document.querySelectorAll('.card__foil').forEach((c, i) => {
      // Repaint foil with the logo only if the card hasn't been scratched at all,
      // otherwise the repaint would wipe the user's scratch progress
      if (!c.dataset.touched && !c.closest('.card').classList.contains('is-revealed')) paintFoil(c, i);
    });
  };
  state.logoImage = null;

  // Preload presenter pages so overlay opens instantly
  PRESENTERS.forEach((p) => { const im = new Image(); im.src = p.image; });

  buildCards();
  playIntro();

  els.beginBtn.addEventListener('click', enterStage, { once: true });
  els.closeBtn.addEventListener('click', closeOverlay);
  els.replayBtn.addEventListener('click', () => window.location.reload());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && els.overlay.getAttribute('aria-hidden') === 'false') closeOverlay();
  });

  // Native drag ghosts and long-press menus would break the scratch illusion
  document.addEventListener('dragstart', (e) => e.preventDefault());
  els.grid.addEventListener('contextmenu', (e) => e.preventDefault());
}

document.addEventListener('DOMContentLoaded', boot);
