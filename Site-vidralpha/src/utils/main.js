// ═══════════════════════════════════════════════════════════════
//  VIDRALPHA — MICROINTERACTIONS & BEHAVIOR
//  Conceito: "Vidro Líquido"
// ═══════════════════════════════════════════════════════════════

'use strict';

// ─── NAVBAR SCROLL BEHAVIOR ─────────────────────────────────
const initNavbar = () => {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  let lastScroll = 0;
  let ticking = false;

  const updateNavbar = () => {
    const scrollY = window.scrollY;

    if (scrollY > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Hide on scroll down, show on scroll up
    if (scrollY > lastScroll && scrollY > 200) {
      navbar.style.transform = 'translateY(-100%)';
    } else {
      navbar.style.transform = 'translateY(0)';
    }

    lastScroll = scrollY;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateNavbar);
      ticking = true;
    }
  }, { passive: true });
};

// ─── MOBILE MENU ─────────────────────────────────────────────
const initMobileMenu = () => {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const closeBtn   = document.getElementById('mobileClose');
  const mobileLinks = document.querySelectorAll('.navbar__mobile-link');

  if (!hamburger || !mobileMenu) return;

  const openMenu = () => {
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
    hamburger.setAttribute('aria-expanded', 'true');
  };
  const closeMenu = () => {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
    hamburger.setAttribute('aria-expanded', 'false');
  };

  hamburger.addEventListener('click', openMenu);
  closeBtn?.addEventListener('click', closeMenu);
  mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

  // Close on backdrop click
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) closeMenu();
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
};

// ─── SCROLL REVEAL (Intersection Observer) ───────────────────
const initScrollReveal = () => {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.revealDelay || '0';
        el.style.animationDelay = delay + 'ms';
        el.classList.add('animate-fadeup');
        observer.unobserve(el);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px'
  });

  els.forEach(el => observer.observe(el));
};

// ─── CURSOR GLOW EFFECT ───────────────────────────────────────
const initCursorGlow = () => {
  const glow = document.createElement('div');
  glow.id = 'cursor-glow';
  Object.assign(glow.style, {
    position: 'fixed',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,214,0,0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: '9999',
    transform: 'translate(-50%, -50%)',
    transition: 'opacity 0.3s ease',
    opacity: '0',
  });
  document.body.appendChild(glow);

  let mouseX = 0, mouseY = 0;
  let glowX = 0, glowY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    glow.style.opacity = '1';
  });

  document.addEventListener('mouseleave', () => {
    glow.style.opacity = '0';
  });

  const animateGlow = () => {
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    glow.style.left = glowX + 'px';
    glow.style.top  = glowY + 'px';
    requestAnimationFrame(animateGlow);
  };
  animateGlow();
};

// ─── MAGNETIC BUTTON EFFECT ───────────────────────────────────
const initMagneticButtons = () => {
  const btns = document.querySelectorAll('.btn-cta, [data-magnetic]');

  btns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width  / 2;
      const y = e.clientY - rect.top  - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.transition = 'transform 0.1s linear, box-shadow 0.25s ease, filter 0.25s ease';
    });
  });
};

// ─── COUNTER ANIMATION ────────────────────────────────────────
const initCounters = () => {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const duration = 1800;
      const start = Date.now();

      const easeOut = (t) => 1 - Math.pow(1 - t, 3);

      const tick = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.round(easeOut(progress) * target);
        el.textContent = prefix + value.toLocaleString('pt-BR') + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      };

      tick();
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
};

// ─── ACTIVE NAV LINKS (Scroll Spy) ───────────────────────────
const initScrollSpy = () => {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.navbar__link[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.40 });

  sections.forEach(s => observer.observe(s));
};

// ─── SMOOTH SCROLL FOR ANCHOR LINKS ──────────────────────────
const initSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
};

// ─── OPTION SELECTOR (Sizes, Variants) ───────────────────────
const initOptionSelectors = () => {
  document.querySelectorAll('.options-group').forEach(group => {
    const btns = group.querySelectorAll('.option-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
  });
};

// ─── TABS ─────────────────────────────────────────────────────
const initTabs = () => {
  document.querySelectorAll('[data-tabs]').forEach(tabContainer => {
    const triggers = tabContainer.querySelectorAll('[data-tab]');
    const panels   = tabContainer.querySelectorAll('[data-panel]');

    triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const target = trigger.dataset.tab;

        triggers.forEach(t => t.classList.toggle('active', t.dataset.tab === target));
        panels.forEach(p => {
          p.hidden = p.dataset.panel !== target;
          if (p.dataset.panel === target) {
            p.style.animation = 'fadeIn 0.3s ease forwards';
          }
        });
      });
    });
  });
};

// ─── GLASS TILT EFFECT (cards) ───────────────────────────────
const initGlassTilt = () => {
  const cards = document.querySelectorAll('[data-tilt]');
  const MAX = 8; // max degrees

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `
        perspective(800px)
        rotateX(${-y * MAX}deg)
        rotateY(${x * MAX}deg)
        translateY(-4px)
      `;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s linear';
    });
  });
};

// ─── ADD TO CART BUTTON FEEDBACK ─────────────────────────────
const initCartButtons = () => {
  document.querySelectorAll('[data-cart-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const original = btn.innerHTML;
      btn.innerHTML = '✓ Adicionado!';
      btn.style.background = 'var(--color-success)';
      btn.style.color = 'white';
      btn.disabled = true;

      setTimeout(() => {
        btn.innerHTML = original;
        btn.style.background = '';
        btn.style.color = '';
        btn.disabled = false;
      }, 2000);
    });
  });
};

// ─── STICKY CTA (hidden until scrolled) ──────────────────────
const initStickyCTA = () => {
  const sticky = document.getElementById('sticky-cta');
  if (!sticky) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      sticky.style.opacity = entry.isIntersecting ? '0' : '1';
      sticky.style.pointerEvents = entry.isIntersecting ? 'none' : 'all';
    });
  }, { threshold: 0.5 });

  const hero = document.querySelector('.hero');
  if (hero) observer.observe(hero);
};

// ─── INIT ALL ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initScrollReveal();
  initCounters();
  initScrollSpy();
  initSmoothScroll();
  initOptionSelectors();
  initTabs();
  initGlassTilt();
  initCartButtons();
  initStickyCTA();

  // Only on desktop (performance)
  if (window.matchMedia('(pointer: fine)').matches) {
    initCursorGlow();
    initMagneticButtons();
  }

  console.log('%c🪟 VIDRALPHA Design System v1.0', 'color: #FFD600; font-weight: bold; font-size: 14px; background: #0D0F1C; padding: 8px 16px; border-radius: 4px;');
});
