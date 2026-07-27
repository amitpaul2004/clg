/**
 * ═══════════════════════════════════════════════════════
 *  CYBERPUNK EFFECTS ENGINE — effects.js
 *  Glitch triggers · Typing animation · Scanline control
 * ═══════════════════════════════════════════════════════
 */

const CyberEffects = (() => {
  'use strict';

  // ── Reduced motion detection ──────────────────────────
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Initialize glitch effect on elements with .cyber-glitch class.
   * Randomly triggers a more intense glitch at intervals.
   */
  function initGlitch() {
    if (prefersReducedMotion) return;

    const glitchElements = document.querySelectorAll('.cyber-glitch');
    glitchElements.forEach(el => {
      // Set data-text attribute for pseudo-elements
      if (!el.getAttribute('data-text')) {
        el.setAttribute('data-text', el.textContent);
      }

      // Random intense glitch bursts
      setInterval(() => {
        el.classList.add('cyber-glitch--intense');
        setTimeout(() => {
          el.classList.remove('cyber-glitch--intense');
        }, 150 + Math.random() * 200);
      }, 3000 + Math.random() * 5000);
    });
  }

  /**
   * Typing animation for elements with .cyber-type-target class.
   * Types out the text content character by character.
   */
  function initTyping() {
    const typeTargets = document.querySelectorAll('.cyber-type-target');

    typeTargets.forEach(el => {
      const text = el.getAttribute('data-type-text') || el.textContent;
      const speed = parseInt(el.getAttribute('data-type-speed')) || 50;
      const delay = parseInt(el.getAttribute('data-type-delay')) || 500;

      el.textContent = '';
      el.style.visibility = 'visible';

      let i = 0;
      setTimeout(() => {
        const typeInterval = setInterval(() => {
          if (i < text.length) {
            el.textContent += text.charAt(i);
            i++;
          } else {
            clearInterval(typeInterval);
            // Add blinking cursor after typing completes
            el.classList.add('cyber-cursor');
          }
        }, speed);
      }, delay);
    });
  }

  /**
   * Initialize random flicker on .cyber-flicker elements.
   * Creates a subtle digital instability effect.
   */
  function initFlicker() {
    if (prefersReducedMotion) return;

    const flickerElements = document.querySelectorAll('.cyber-flicker-random');
    flickerElements.forEach(el => {
      setInterval(() => {
        el.style.opacity = '0.85';
        setTimeout(() => {
          el.style.opacity = '1';
        }, 50 + Math.random() * 100);
      }, 4000 + Math.random() * 6000);
    });
  }

  /**
   * Animate stat numbers counting up from 0.
   */
  function initCountUp() {
    const statValues = document.querySelectorAll('.cyber-stat-value[data-count]');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-count'));
          const prefix = el.getAttribute('data-prefix') || '';
          const suffix = el.getAttribute('data-suffix') || '';
          const duration = 1500;
          const startTime = performance.now();

          function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * target);
            el.textContent = prefix + current.toLocaleString() + suffix;

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          }

          requestAnimationFrame(animate);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    statValues.forEach(el => observer.observe(el));
  }

  /**
   * Add hover glow effect to interactive elements.
   */
  function initHoverGlow() {
    const glowTargets = document.querySelectorAll('[data-hover-glow]');
    glowTargets.forEach(el => {
      el.addEventListener('mouseenter', () => {
        const color = el.getAttribute('data-hover-glow') || 'accent';
        el.classList.add(`cyber-glow${color !== 'accent' ? '-' + color : ''}`);
      });
      el.addEventListener('mouseleave', () => {
        el.className = el.className.replace(/cyber-glow[^\s]*/g, '').trim();
      });
    });
  }

  /**
   * Initialize all effects.
   */
  function init() {
    initGlitch();
    initTyping();
    initFlicker();
    initCountUp();
    initHoverGlow();
  }

  return { init, initGlitch, initTyping, initFlicker, initCountUp };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', CyberEffects.init);
