/**
 * ═══════════════════════════════════════════════════════
 *  CYBERPUNK APP SHELL — app.js
 *  Sidebar toggle · Active page · Disconnect modal · Shortcuts
 * ═══════════════════════════════════════════════════════
 */

const CyberApp = (() => {
  'use strict';

  let sidebarOpen = false;
  let cartItems = JSON.parse(localStorage.getItem('cyberCart')) || [];
  let cartTotal = cartItems.reduce((sum, item) => sum + item.qty, 0);

  let wishlistItems = JSON.parse(localStorage.getItem('cyberWishlist')) || [];

  function saveWishlist() {
    localStorage.setItem('cyberWishlist', JSON.stringify(wishlistItems));
  }

  function getWishlistItems() {
    return wishlistItems;
  }
  
  function setWishlistItems(items) {
    wishlistItems = items;
    saveWishlist();
  }

  function saveCart() {
    localStorage.setItem('cyberCart', JSON.stringify(cartItems));
    cartTotal = cartItems.reduce((sum, item) => sum + item.qty, 0);
    updateCartBadge();
  }

  function getCartItems() {
    return cartItems;
  }

  function setCartItems(items) {
    cartItems = items;
    saveCart();
  }

  function updateCartBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
      badge.textContent = cartTotal;
      if (cartTotal > 0) {
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    });
  }

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
      // Escape closes sidebar / any open modal
      if (e.key === 'Escape') {
        closeSidebar();
        const modals = ['disconnect-modal', 'add-payment-modal', 'link-account-modal'];
        modals.forEach(id => {
          const el = document.getElementById(id);
          if (el && !el.classList.contains('hidden')) {
            el.classList.add('hidden');
          }
        });
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
      info: 'var(--color-accent-tertiary)',
      warning: 'var(--color-accent-secondary)'
    };

    const icons = {
      success: '✓',
      error: '✗',
      info: 'ℹ',
      warning: '⚠'
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
   * Initialize Disconnect Modal & System Disconnect flow.
   */
  function initDisconnect() {
    const disconnectBtn = document.getElementById('disconnect-btn');
    const modal = document.getElementById('disconnect-modal');
    const overlay = document.getElementById('disconnected-overlay');
    const cancelBtn = document.getElementById('cancel-disconnect-btn');
    const confirmBtn = document.getElementById('confirm-disconnect-btn');
    const reconnectBtn = document.getElementById('reconnect-btn');

    if (!disconnectBtn || !modal || !overlay) return;

    // Open disconnect confirmation modal
    disconnectBtn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.remove('hidden');
      closeSidebar();
    });

    // Close modal on cancel button
    cancelBtn?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    // Confirm disconnect action -> Redirect to Login Page
    confirmBtn?.addEventListener('click', () => {
      modal.classList.add('hidden');
      localStorage.removeItem('cybermarket_auth_token');
      showToast('SESSION TERMINATED // REDIRECTING TO LOGIN...', 'error');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 800);
    });

    // Re-connect session action
    reconnectBtn?.addEventListener('click', () => {
      overlay.classList.add('hidden');
      showToast('NEURAL LINK ESTABLISHED // WELCOME BACK', 'success');
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    });

    // Close modal if background overlay clicked
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
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

    // Init badges
    updateCartBadge();
    initWishlistIcons();

    // Disconnect flow
    initDisconnect();

    // Keyboard shortcuts
    initKeyboardShortcuts();

    // Close sidebar on window resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024 && sidebarOpen) {
        closeSidebar();
      }
    });
  }

  function addToCart(btnElement) {
    if (!btnElement) return;

    // Parse product info
    const card = btnElement.closest('.cyber-card');
    if (!card) return; // Fail safe

    const title = card.querySelector('h3').textContent;
    const priceEl = card.querySelector('span[style*="color: var(--color-accent)"]');
    const priceStr = priceEl ? priceEl.textContent : '0';
    const price = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
    const category = card.dataset.category || 'misc';
    const img = card.querySelector('img');
    const imgSrc = img ? img.src : '';
    const id = title.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Add to storage
    const existing = cartItems.find(i => i.id === id);
    if (!existing) {
      cartItems.push({ id, title, price, category, image: imgSrc, qty: 1 });
    } else {
      existing.qty++;
    }
    saveCart();
    showToast('ADDED TO CART', 'success');

    // Trigger badge animation
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(b => {
      b.style.animation = 'none';
      b.offsetHeight;
      b.style.animation = 'toast-in 0.3s ease-out';
    });

    const container = btnElement.parentElement;
    
    // Create Quantity Selector Wrapper
    const qtyWrapper = document.createElement('div');
    qtyWrapper.className = 'flex items-center gap-2';
    
    let baseColorClass = 'cyber-btn--glitch';
    if (btnElement.classList.contains('cyber-btn--tertiary')) baseColorClass = 'cyber-btn--tertiary';
    if (btnElement.classList.contains('cyber-btn--destructive')) baseColorClass = 'cyber-btn--destructive';
    if (btnElement.classList.contains('cyber-btn--secondary')) baseColorClass = 'cyber-btn--secondary';

    qtyWrapper.innerHTML = `
      <button class="cyber-btn cyber-btn--sm ${baseColorClass} qty-minus" style="padding: 0 0.5rem; min-width: 28px;">-</button>
      <span class="qty-val font-bold text-sm text-center" style="font-family: var(--font-heading); color: var(--color-foreground); width: 24px;">1</span>
      <button class="cyber-btn cyber-btn--sm ${baseColorClass} qty-plus" style="padding: 0 0.5rem; min-width: 28px;">+</button>
    `;

    let qty = 1;
    const minusBtn = qtyWrapper.querySelector('.qty-minus');
    const plusBtn = qtyWrapper.querySelector('.qty-plus');
    const valSpan = qtyWrapper.querySelector('.qty-val');

    minusBtn.onclick = (e) => {
      e.stopPropagation();
      qty--;
      
      if (qty === 0) {
        cartItems = cartItems.filter(i => i.id !== id);
        container.replaceChild(btnElement, qtyWrapper);
      } else {
        const item = cartItems.find(i => i.id === id);
        if (item) item.qty = qty;
        valSpan.textContent = qty;
      }
      saveCart();
    };

    plusBtn.onclick = (e) => {
      e.stopPropagation();
      qty++;
      const item = cartItems.find(i => i.id === id);
      if (item) item.qty = qty;
      valSpan.textContent = qty;
      saveCart();
    };

    container.replaceChild(qtyWrapper, btnElement);
  }

  function toggleWishlist(btnElement) {
    if (!btnElement) return;
    
    const card = btnElement.closest('.cyber-card');
    if (!card) return;

    const title = card.querySelector('h3').textContent;
    const priceEl = card.querySelector('span[style*="color: var(--color-accent)"]');
    const priceStr = priceEl ? priceEl.textContent : '0';
    const price = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
    const category = card.dataset.category || 'misc';
    const img = card.querySelector('img');
    const imgSrc = img ? img.src : '';
    const id = title.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const icon = btnElement.querySelector('.wishlist-icon');
    const existingIdx = wishlistItems.findIndex(i => i.id === id);

    if (existingIdx >= 0) {
      // Remove
      wishlistItems.splice(existingIdx, 1);
      if (icon) {
        icon.style.fill = 'transparent';
        icon.style.color = 'var(--color-muted-foreground)';
      }
      showToast('REMOVED FROM WISHLIST', 'warning');
    } else {
      // Add
      wishlistItems.push({ id, title, price, category, image: imgSrc });
      if (icon) {
        icon.style.fill = 'var(--color-destructive)';
        icon.style.color = 'var(--color-destructive)';
      }
      showToast('ADDED TO WISHLIST', 'success');
    }
    
    saveWishlist();
  }

  function initWishlistIcons() {
    const btns = document.querySelectorAll('.wishlist-toggle-btn');
    btns.forEach(btn => {
      const card = btn.closest('.cyber-card');
      const title = card.querySelector('h3').textContent;
      const id = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      const icon = btn.querySelector('.wishlist-icon');
      if (wishlistItems.some(i => i.id === id)) {
        if (icon) {
          icon.style.fill = 'var(--color-destructive)';
          icon.style.color = 'var(--color-destructive)';
        }
      }
    });
  }

  return { init, toggleSidebar, closeSidebar, showToast, setActivePage, addToCart, getCartItems, setCartItems, updateCartBadge, getWishlistItems, setWishlistItems, toggleWishlist };
})();
