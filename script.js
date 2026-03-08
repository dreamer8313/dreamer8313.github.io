function initCarousel(container) {
  const track = container.querySelector('.carousel-track');
  const slides = Array.from(container.querySelectorAll('.slide'));
  const prevBtn = container.querySelector('.carousel-btn.prev');
  const nextBtn = container.querySelector('.carousel-btn.next');
  const dotsContainer = container.querySelector('.carousel-dots');
  const captionTargetId = container.dataset.captionTarget;
  const captionEl = captionTargetId ? document.getElementById(captionTargetId) : null;

  if (!track || slides.length === 0) return;

  let currentIndex = 0;
  let autoplayTimer = null;

  function updateCarousel(index) {
    currentIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    updateDots();
    updateCaption();
  }

  function updateCaption() {
    if (!captionEl) return;
    const activeSlide = slides[currentIndex];
    const caption = activeSlide?.dataset.caption?.trim();
    captionEl.textContent = caption || '';
    captionEl.classList.toggle('is-empty', !caption);
  }

  function createDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    slides.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.addEventListener('click', () => {
        stopAutoplay();
        updateCarousel(idx);
        startAutoplay();
      });
      dotsContainer.appendChild(dot);
    });
    updateDots();
  }

  function updateDots() {
    if (!dotsContainer) return;
    Array.from(dotsContainer.children).forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex);
    });
  }

  function nextSlide() { updateCarousel(currentIndex + 1); }
  function prevSlide() { updateCarousel(currentIndex - 1); }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(nextSlide, 4000);
  }

  function stopAutoplay() {
    if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => { stopAutoplay(); prevSlide(); startAutoplay(); });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => { stopAutoplay(); nextSlide(); startAutoplay(); });
  }

  createDots();
  updateCarousel(0);
  startAutoplay();

  window.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay(); else startAutoplay();
  });
}

document.querySelectorAll('.carousel').forEach(initCarousel);

// ── Lightbox ──────────────────────────────────────
const lightbox    = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.querySelector('.lightbox-close');

function openLightbox(src, alt) {
  lightboxImg.src = src;
  lightboxImg.alt = alt || '';
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  lightboxImg.src = '';
}

document.querySelectorAll('.pub-thumb:not(.pub-thumb-empty)').forEach(img => {
  img.addEventListener('click', () => openLightbox(img.src, img.alt));
});

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// ── Like module ───────────────────────────────────
const likeButton = document.getElementById('like-button');
const likeCount = document.getElementById('like-count');

if (likeButton && likeCount) {
  const LIKE_COUNT_KEY = 'homepage-like-count';
  const LIKE_ACTIVE_KEY = 'homepage-like-active';

  const readNumber = (key, fallback = 0) => {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) ? value : fallback;
  };

  let count = readNumber(LIKE_COUNT_KEY, 0);
  let liked = localStorage.getItem(LIKE_ACTIVE_KEY) === 'true';

  function renderLikeState() {
    likeCount.textContent = String(count);
    likeButton.classList.toggle('is-liked', liked);
    likeButton.setAttribute('aria-pressed', liked ? 'true' : 'false');
    const label = liked ? '已点赞' : '点个赞';
    const textEl = likeButton.querySelector('.like-text');
    if (textEl) textEl.textContent = label;
  }

  likeButton.addEventListener('click', () => {
    if (liked) {
      liked = false;
      count = Math.max(0, count - 1);
    } else {
      liked = true;
      count += 1;
    }

    localStorage.setItem(LIKE_COUNT_KEY, String(count));
    localStorage.setItem(LIKE_ACTIVE_KEY, liked ? 'true' : 'false');
    renderLikeState();
  });

  renderLikeState();
}
