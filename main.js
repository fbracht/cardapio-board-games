// main.js

/** Creates element with optional classes */
function el(tag, ...classes) {
  const e = document.createElement(tag);
  if (classes.length) e.className = classes.join(' ');
  return e;
}

/** Creates <img> with data-src (src applied during load) */
function lazyImg(classes, alt, dataSrc) {
  const img = el('img', classes);
  img.alt = alt;
  img.dataset.src = dataSrc;
  return img;
}

/** Creates a complete slide element */
function createSlide(game, index) {
  const slide = el('div', 'slide');
  slide.dataset.index = index;

  // Hero image
  slide.appendChild(lazyImg('slide__hero', game.name, game.heroImage));

  // Info panel
  const panel = el('div', 'slide__panel');

  // Box art (float right)
  panel.appendChild(lazyImg('slide__boxart', `Capa de ${game.name}`, game.boxArt));

  // Title
  const title = el('h2', 'slide__title');
  title.textContent = game.name;
  panel.appendChild(title);

  // Meta: duration and players
  const meta = el('p', 'slide__meta');

  const duration = el('span', 'slide__duration');
  duration.textContent = `⏱ ${game.duration}`;
  meta.appendChild(duration);
  meta.appendChild(document.createElement('br'));

  const players = el('span', 'slide__players');
  players.textContent = game.players;
  meta.appendChild(players);
  meta.appendChild(document.createElement('br'));

  const best = el('span', 'slide__best');
  best.textContent = game.bestWith;
  meta.appendChild(best);

  panel.appendChild(meta);

  // Description
  const desc = el('p', 'slide__description');
  desc.textContent = game.description;
  panel.appendChild(desc);

  // Monitor section
  const monitor = el('div', 'slide__monitor');

  const monitorPrefix = el('span', 'slide__monitor-prefix');
  monitorPrefix.textContent = 'Seu monitor para este jogo será:';
  monitor.appendChild(monitorPrefix);

  const monitorCards = el('div', 'slide__monitor-cards');
  game.monitors.forEach((m, i) => {
    if (i > 0) {
      const or = el('span', 'slide__monitor-or');
      or.textContent = 'ou';
      monitorCards.appendChild(or);
    }
    const card = el('div', 'slide__monitor-card');
    card.appendChild(lazyImg('slide__monitor-photo', `Foto de ${m.name}`, m.photo));
    const name = el('strong', 'slide__monitor-name');
    name.textContent = m.name;
    card.appendChild(name);
    monitorCards.appendChild(card);
  });
  monitor.appendChild(monitorCards);

  panel.appendChild(monitor);
  slide.appendChild(panel);

  // Loading indicator (3 pulsing dots)
  const loading = el('div', 'slide__loading');
  loading.setAttribute('aria-hidden', 'true');
  loading.appendChild(el('span'));
  loading.appendChild(el('span'));
  loading.appendChild(el('span'));
  slide.appendChild(loading);

  return slide;
}

/** Creates a progress dot */
function createDot(index, isActive) {
  const dot = document.createElement('span');
  dot.className = 'dot' + (isActive ? ' dot--active' : '');
  dot.dataset.index = index;
  return dot;
}

/** Loads one image (data-src -> src). Returns Promise. */
function loadImage(img) {
  return new Promise((resolve) => {
    const src = img.dataset.src;
    if (!src) return resolve();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // resolve even on error — don't block on missing image
    img.src = src;
  });
}

/** Loads all images of a slide */
function loadSlideImages(slide) {
  const imgs = slide.querySelectorAll('img[data-src]');
  return Promise.all([...imgs].map(loadImage));
}

/** Progressive loading: slide 1 first, then sequentially */
async function loadSequentially(slides, container) {
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const loading = slide.querySelector('.slide__loading');
    if (!loading) continue;

    loading.classList.add('is-visible');
    await loadSlideImages(slide);
    loading.classList.remove('is-visible');

    if (i === 0) {
      // Unlock scroll after first slide is ready
      container.style.overflowX = 'scroll';
    }
  }
}

/** Entry point */
async function init() {
  let games;
  try {
    const res = await fetch('games.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    games = await res.json();
  } catch (err) {
    console.error('Falha ao carregar o cardápio:', err);
    const container = document.getElementById('slides');
    const msg = document.createElement('p');
    msg.textContent = 'Não foi possível carregar o cardápio. Tente recarregar a página.';
    msg.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:2rem;font-family:sans-serif;color:#fff;background:#000;';
    container.appendChild(msg);
    return;
  }

  const container = document.getElementById('slides');
  const dotsContainer = document.getElementById('dots');

  // Generate all slides and dots
  games.forEach((game, i) => {
    container.appendChild(createSlide(game, i));
    dotsContainer.appendChild(createDot(i, i === 0));
  });

  const slides = [...container.querySelectorAll('.slide')];
  const dots = [...dotsContainer.querySelectorAll('.dot')];

  // IntersectionObserver to update active dot
  const observer = new IntersectionObserver(entries => {
    const best = entries.reduce((a, b) =>
      a.intersectionRatio >= b.intersectionRatio ? a : b
    );
    if (best.isIntersecting) {
      const i = Number(best.target.dataset.index);
      dots.forEach((dot, di) => dot.classList.toggle('dot--active', di === i));
    }
  }, { threshold: 0.5 });

  slides.forEach(slide => observer.observe(slide));

  // Start progressive loading
  await loadSequentially(slides, container);
}

init().catch(err => console.error('Erro inesperado:', err));
