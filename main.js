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
  const title = el('h1', 'slide__title');
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
  monitor.appendChild(lazyImg('slide__monitor-photo', `Foto de ${game.monitor.name}`, game.monitor.photo));

  const monitorLabel = el('span');
  monitorLabel.textContent = 'Seu monitor para este jogo será: ';
  const monitorName = el('strong');
  monitorName.textContent = game.monitor.name;
  monitorLabel.appendChild(monitorName);
  monitor.appendChild(monitorLabel);

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
async function loadSequentially(slides) {
  const container = document.getElementById('slides');

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const loading = slide.querySelector('.slide__loading');

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
  const res = await fetch('games.json');
  const games = await res.json();

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
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const i = Number(entry.target.dataset.index);
        dots.forEach((dot, di) => {
          dot.classList.toggle('dot--active', di === i);
        });
      }
    });
  }, { threshold: 0.5 });

  slides.forEach(slide => observer.observe(slide));

  // Start progressive loading
  await loadSequentially(slides);
}

init();
