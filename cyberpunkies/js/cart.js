/**
 * Shopping Cart Logic
 */

const CyberCart = (function() {

  function getCategoryColor(category) {
    if (category === 'hardware') return 'var(--color-accent-tertiary)';
    if (category === 'wetware') return 'var(--color-accent-secondary)';
    if (category === 'armaments') return 'var(--color-destructive)';
    return 'var(--color-accent)';
  }

  function getCategoryIcon(category) {
    if (category === 'hardware') return 'cpu';
    if (category === 'wetware') return 'activity';
    if (category === 'armaments') return 'crosshair';
    return 'disc';
  }

  function renderCart() {
    const items = CyberApp.getCartItems();
    const itemsList = document.querySelector('.flex-1.space-y-4');
    
    if (!items || items.length === 0) {
      checkEmptyState();
      return;
    }

    let html = '';
    items.forEach(item => {
      const color = getCategoryColor(item.category);
      const icon = getCategoryIcon(item.category);
      
      html += `
        <div class="cyber-card p-4 flex flex-col sm:flex-row items-center gap-4 hover:border-[var(--color-accent)] transition-all cart-item" data-id="${item.id}">
          <div class="w-24 h-24 shrink-0 overflow-hidden border border-[var(--color-border)] rounded-sm">
            <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover">
          </div>
          <div class="flex-1 w-full text-left">
            <h3 class="text-lg font-bold uppercase tracking-wider mb-1" style="font-family: var(--font-heading); color: var(--color-foreground);">${item.title}</h3>
            <span class="text-xs" style="color: ${color}; font-family: var(--font-label);"><i data-lucide="${icon}" class="inline w-3 h-3 mr-1"></i>${item.category}</span>
          </div>
          <div class="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0">
            <div class="flex items-center gap-2">
              <button class="qty-minus cyber-btn cyber-btn--sm cyber-btn--outline" style="padding: 0 0.5rem; min-width: 28px;">-</button>
              <span class="item-qty font-bold text-sm text-center" style="font-family: var(--font-heading); width: 24px;">${item.qty}</span>
              <button class="qty-plus cyber-btn cyber-btn--sm cyber-btn--outline" style="padding: 0 0.5rem; min-width: 28px;">+</button>
            </div>
            <div class="text-right sm:w-24">
              <span class="item-price whitespace-nowrap ml-2" style="color: var(--color-accent); font-family: var(--font-heading); font-weight: bold;">Ȼ ${item.price.toLocaleString()}</span>
            </div>
            <button class="text-[var(--color-destructive)] hover:text-white transition-colors remove-btn" title="Remove">
              <i data-lucide="trash-2" style="width:18px;height:18px;"></i>
            </button>
          </div>
        </div>
      `;
    });

    itemsList.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();

    updateTotals();
  }

  function updateTotals() {
    const items = CyberApp.getCartItems();
    let subtotal = 0;
    let totalItems = 0;

    items.forEach(item => {
      subtotal += (item.qty * item.price);
      totalItems += item.qty;
    });

    const fee = totalItems > 0 ? 450 : 0;
    const total = subtotal + fee;

    const itemCountEl = document.getElementById('cart-item-count');
    if (itemCountEl) itemCountEl.textContent = `Subtotal (${totalItems} items)`;
    
    const subtotalEl = document.getElementById('cart-subtotal');
    if (subtotalEl) subtotalEl.textContent = `Ȼ ${subtotal.toLocaleString()}`;
    
    const feeEl = document.getElementById('cart-fee');
    if (feeEl) feeEl.textContent = `Ȼ ${fee.toLocaleString()}`;
    
    const totalEl = document.getElementById('cart-total');
    if (totalEl) totalEl.textContent = `Ȼ ${total.toLocaleString()}`;

    // App.js handles badges on state change, but we call it just to be safe
    if (CyberApp.updateCartBadge) CyberApp.updateCartBadge();
  }

  function init() {
    renderCart();

    // Event Delegation for clicks
    const itemsList = document.querySelector('.flex-1.space-y-4');
    
    itemsList.addEventListener('click', (e) => {
      const itemEl = e.target.closest('.cart-item');
      if (!itemEl) return;
      
      const id = itemEl.dataset.id;
      let items = CyberApp.getCartItems();
      const itemIdx = items.findIndex(i => i.id === id);
      
      if (itemIdx === -1) return;

      if (e.target.closest('.qty-plus')) {
        items[itemIdx].qty++;
        CyberApp.setCartItems(items);
        itemEl.querySelector('.item-qty').textContent = items[itemIdx].qty;
        updateTotals();
      } 
      else if (e.target.closest('.qty-minus')) {
        if (items[itemIdx].qty > 1) {
          items[itemIdx].qty--;
          CyberApp.setCartItems(items);
          itemEl.querySelector('.item-qty').textContent = items[itemIdx].qty;
          updateTotals();
        } else {
          // Trigger remove
          removeItem(itemEl, id, items);
        }
      }
      else if (e.target.closest('.remove-btn')) {
        removeItem(itemEl, id, items);
      }
    });
  }

  function removeItem(itemEl, id, items) {
    items = items.filter(i => i.id !== id);
    CyberApp.setCartItems(items);
    
    itemEl.style.transition = 'all 0.3s ease-in-out';
    itemEl.style.transform = 'translateX(100%)';
    itemEl.style.opacity = '0';
    
    setTimeout(() => {
      itemEl.remove();
      updateTotals();
      CyberApp.showToast('ITEM REMOVED', 'warning');
      checkEmptyState();
    }, 300);
  }

  function checkEmptyState() {
    const items = CyberApp.getCartItems();
    if (items.length > 0) return;

    const itemsList = document.querySelector('.flex-1.space-y-4');
    itemsList.innerHTML = `
      <div class="cyber-card p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <i data-lucide="shopping-cart" style="width:48px;height:48px;color:var(--color-muted-foreground);margin-bottom:1rem;"></i>
        <h3 class="text-xl font-bold uppercase tracking-wider mb-2" style="font-family: var(--font-heading); color: var(--color-foreground);">Cart is empty</h3>
        <p class="text-sm text-muted-foreground mb-6" style="font-family: var(--font-body);">Your cyber-deck hasn't secured any hardware yet.</p>
        <a href="products.html" class="cyber-btn cyber-btn--outline">
          <i data-lucide="package" style="width:16px;height:16px;"></i> Browse Catalog
        </a>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    const summaryCard = document.querySelector('.lg\\:w-1\\/3');
    if (summaryCard) {
      summaryCard.style.opacity = '0.5';
      summaryCard.style.pointerEvents = 'none';
    }
    
    // reset totals
    updateTotals();
  }

  function checkout() {
    const items = CyberApp.getCartItems();
    if (items.length === 0) return;

    CyberApp.showToast('INITIATING TRANSACTION...', 'info');

    setTimeout(() => {
      CyberApp.showToast('DECRYPTING CREDITS...', 'warning');
      
      setTimeout(() => {
        CyberApp.showToast('PURCHASE SUCCESSFUL', 'success');
        
        CyberApp.setCartItems([]);
        const domItems = document.querySelectorAll('.cart-item');
        domItems.forEach(item => item.remove());
        
        updateTotals();
        checkEmptyState();
        
      }, 1500);
    }, 800);
  }

  return { init, checkout };
})();

// Auto-init if on cart page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('page-cart')) {
    CyberCart.init();
  }
});
