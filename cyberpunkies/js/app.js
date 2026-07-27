/**
 * ═══════════════════════════════════════════════════════
 *  CYBERPUNK APP SHELL — app.js
 *  Sidebar toggle · Active page · Global shortcuts
 * ═══════════════════════════════════════════════════════
 */

const CyberApp = (() => {
  'use strict';

  let sidebarOpen = false;

  /**
   * Toggle sidebar visibility on mobile.
   */
  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (!sidebar) return;

    sidebarOpen = !sidebarOpen;

    if (sidebarOpen) {
      sidebar.classList.add('cyber-sidebar--open');
      overlay?.classList.add('cyber-sidebar-overlay--active');
      document.body.style.overflow = 'hidden';
    } else {
      sidebar.classList.remove('cyber-sidebar--open');
      overlay?.classList.remove('cyber-sidebar-overlay--active');
      document.body.style.overflow = '';
    }
  }

  /**
   * Close sidebar (used by overlay click).
   */
  function closeSidebar() {
    if (sidebarOpen) {
      toggleSidebar();
    }
  }

  /**
   * Highlight the active page in the sidebar nav.
   * @param {string} pageId - ID of the current page
   */
  function setActivePage(pageId) {
    const navItems = document.querySelectorAll('.cyber-sidebar-item');
    navItems.forEach(item => {
      item.classList.remove('cyber-sidebar-item--active');
      if (item.getAttribute('data-page') === pageId) {
        item.classList.add('cyber-sidebar-item--active');
      }
    });
  }

  /**
   * Initialize global keyboard shortcuts.
   */
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Escape closes sidebar on mobile
      if (e.key === 'Escape') {
        closeSidebar();
      }

      // Ctrl+K for search (future feature)
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        // Future: open search modal
      }
    });
  }

  /**
   * Show a toast notification.
   * @param {string} message - Message to display
   * @param {string} type - 'success' | 'error' | 'info'
   * @param {number} duration - Duration in ms (default 3000)
   */
  function showToast(message, type = 'success', duration = 3000) {
    // Remove existing toast
    const existing = document.querySelector('.cyber-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'cyber-toast';

    const colors = {
      success: 'var(--color-accent)',
      error: 'var(--color-destructive)',
      info: 'var(--color-accent-tertiary)'
    };

    const icons = {
      success: '✓',
      error: '✗',
      info: 'ℹ'
    };

    toast.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      padding: 0.875rem 1.5rem;
      background: var(--color-card);
      border: 1px solid ${colors[type]};
      color: var(--color-foreground);
      font-family: var(--font-label);
      font-size: 0.8125rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 0 10px ${colors[type]}40;
      clip-path: polygon(
        0 6px, 6px 0,
        calc(100% - 6px) 0, 100% 6px,
        100% calc(100% - 6px), calc(100% - 6px) 100%,
        6px 100%, 0 calc(100% - 6px)
      );
      animation: toast-in 200ms ease-out;
    `;

    toast.innerHTML = `
      <span style="color: ${colors[type]}; font-size: 1rem;">${icons[type]}</span>
      <span>${message}</span>
    `;

    // Add toast animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes toast-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes toast-out {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      toast.style.animation = 'toast-out 200ms ease-in forwards';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }

  /**
   * Initialize the app shell.
   * @param {string} currentPage - ID of the current page
   */
  function init(currentPage) {
    // Sidebar toggle
    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
      hamburger.addEventListener('click', toggleSidebar);
    }

    // Overlay close
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
      overlay.addEventListener('click', closeSidebar);
    }

    // Set active page
    if (currentPage) {
      setActivePage(currentPage);
    }

    // Keyboard shortcuts
    initKeyboardShortcuts();

    // Close sidebar on window resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024 && sidebarOpen) {
        closeSidebar();
      }
    });
  }

  return { init, toggleSidebar, closeSidebar, showToast, setActivePage };
})();
