// ─── Navbar scroll shadow ───────────────────────────────
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  navbar.style.boxShadow = window.scrollY > 10
    ? '0 2px 12px rgba(0,0,0,.10)'
    : '0 1px 4px rgba(0,0,0,.06)';
});

// ─── Tool card ripple on click ───────────────────────────
document.querySelectorAll('.tool-card').forEach(card => {
  card.addEventListener('click', e => {
    e.preventDefault();
    card.style.transform = 'scale(0.97)';
    setTimeout(() => { card.style.transform = ''; }, 160);
  });
});

// ─── Smooth hero CTA pulse ───────────────────────────────
const heroBtn = document.querySelector('.btn-hero');
if (heroBtn) {
  setInterval(() => {
    heroBtn.style.boxShadow = '0 6px 32px rgba(2,130,229,.55)';
    setTimeout(() => {
      heroBtn.style.boxShadow = '0 6px 24px rgba(2,130,229,.32)';
    }, 800);
  }, 2400);
}

// ─── Scroll-reveal animation ─────────────────────────────
const revealEls = document.querySelectorAll(
  '.tool-card, .howto-card, .compare-card, .review-card'
);

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

// Inject base styles for reveal
const style = document.createElement('style');
style.textContent = `
  .tool-card, .howto-card, .compare-card, .review-card {
    opacity: 0;
    transform: translateY(18px);
    transition: opacity .4s ease, transform .4s ease, box-shadow .15s, border-color .15s;
  }
  .tool-card:hover, .howto-card:hover, .compare-card:hover, .review-card:hover {
    transform: translateY(-3px) scale(1.02) !important;
  }
  .revealed {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
`;
document.head.appendChild(style);

revealEls.forEach((el, i) => {
  el.style.transitionDelay = `${(i % 6) * 50}ms`;
  observer.observe(el);
});
