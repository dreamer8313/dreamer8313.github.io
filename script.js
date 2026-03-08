const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDpg1HKmiXSGJSJNc8cFVI2pKPLV7Zb-wY",
  authDomain: "lshenaeworld.firebaseapp.com",
  projectId: "lshenaeworld",
  storageBucket: "lshenaeworld.firebasestorage.app",
  messagingSenderId: "328570894168",
  appId: "1:328570894168:web:8775b1f8cd7f91951ad72d",
  measurementId: "G-5K2YDL9PFC"
};

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
  const LIKE_ACTIVE_KEY = 'homepage-like-active';
  let liked = localStorage.getItem(LIKE_ACTIVE_KEY) === 'true';
  let count = 0;
  let isSubmitting = false;

  function renderLikeState() {
    likeCount.textContent = String(count);
    likeButton.classList.toggle('is-liked', liked);
    likeButton.setAttribute('aria-pressed', liked ? 'true' : 'false');
    const label = liked ? '已点赞' : '点个赞';
    const textEl = likeButton.querySelector('.like-text');
    if (textEl) textEl.textContent = label;
  }

  renderLikeState();

  (async () => {
    try {
      const [{ initializeApp }, { getAnalytics, isSupported }, firestore] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js'),
        import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js')
      ]);

      const app = initializeApp(FIREBASE_CONFIG);

      try {
        if (await isSupported()) {
          getAnalytics(app);
        }
      } catch (analyticsError) {
        console.warn('Firebase analytics init skipped:', analyticsError);
      }

      const { getFirestore, doc, onSnapshot, runTransaction } = firestore;
      const db = getFirestore(app);
      const likeRef = doc(db, 'siteStats', 'homepage');

      onSnapshot(likeRef, snapshot => {
        count = snapshot.exists() ? Number(snapshot.data().likes || 0) : 0;
        renderLikeState();
      }, error => {
        console.error('读取点赞数失败：', error);
      });

      likeButton.addEventListener('click', async () => {
        if (liked || isSubmitting) return;

        isSubmitting = true;

        try {
          await runTransaction(db, async transaction => {
            const snapshot = await transaction.get(likeRef);
            const current = snapshot.exists() ? Number(snapshot.data().likes || 0) : 0;

            transaction.set(likeRef, {
              likes: current + 1,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          });

          liked = true;
          localStorage.setItem(LIKE_ACTIVE_KEY, 'true');
          renderLikeState();
        } catch (error) {
          console.error('提交点赞失败：', error);
        } finally {
          isSubmitting = false;
        }
      });
    } catch (error) {
      console.error('Firebase 初始化失败：', error);
    }
  })();
}
