const CyberWishlist = (function() {

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

  function renderWishlist() {
    const items = CyberApp.getWishlistItems();
    const grid = document.getElementById('wishlist-grid');
    
    if (!items || items.length === 0) {
      grid.className = 'flex items-center justify-center py-16 w-full';
      grid.innerHTML = `
        <div class="cyber-card p-8 text-center flex flex-col items-center justify-center max-w-md w-full">
          <i data-lucide="heart" style="width:48px;height:48px;color:var(--color-muted-foreground);margin-bottom:1rem;"></i>
          <h3 class="text-xl font-bold uppercase tracking-wider mb-2" style="font-family: var(--font-heading); color: var(--color-foreground);">No Saved Items</h3>
          <p class="text-sm text-muted-foreground mb-6" style="font-family: var(--font-body);">You haven't added any hardware to your tracking list yet.</p>
          <a href="products.html" class="cyber-btn cyber-btn--outline">
            <i data-lucide="package" style="width:16px;height:16px;"></i> Browse Catalog
          </a>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
    let html = '';
    
    items.forEach(item => {
      const color = getCategoryColor(item.category);
      const icon = getCategoryIcon(item.category);
      
      html += `
        <div class="cyber-card flex flex-col h-full group hover:border-[var(--color-accent)] transition-all duration-300 wishlist-item" data-id="${item.id}">
          <div class="relative w-full aspect-video overflow-hidden border-b border-[var(--color-border)]">
            <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <button class="absolute top-2 left-2 p-1.5 rounded-full bg-[rgba(10,10,15,0.7)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors remove-wishlist-btn z-10" title="Remove">
              <i data-lucide="trash-2" style="width:16px;height:16px;color:var(--color-destructive);"></i>
            </button>
          </div>
          <div class="p-5 flex flex-col flex-1">
            <div class="flex justify-between items-start mb-2">
              <h3 class="text-lg font-bold uppercase tracking-wider" style="font-family: var(--font-heading); color: var(--color-foreground);">${item.title}</h3>
              <span class="whitespace-nowrap ml-2" style="color: var(--color-accent); font-family: var(--font-heading); font-weight: bold;">Ȼ ${item.price.toLocaleString()}</span>
            </div>
            
            <div class="flex justify-between items-center mt-auto pt-4 border-t border-[rgba(255,255,255,0.05)]">
              <span class="text-xs" style="color: ${color}; font-family: var(--font-label);"><i data-lucide="${icon}" class="inline w-3 h-3 mr-1"></i>${item.category}</span>
              <button class="cyber-btn cyber-btn--sm cyber-btn--glitch move-to-cart-btn">
                <i data-lucide="shopping-cart" style="width:14px;height:14px;"></i> TO CART
              </button>
            </div>
          </div>
        </div>
      `;
    });

    grid.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }

  function init() {
    renderWishlist();

    const grid = document.getElementById('wishlist-grid');
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.wishlist-item');
      if (!card) return;
      const id = card.dataset.id;
      let items = CyberApp.getWishlistItems();
      const itemIdx = items.findIndex(i => i.id === id);
      if (itemIdx === -1) return;

      if (e.target.closest('.remove-wishlist-btn')) {
        items.splice(itemIdx, 1);
        CyberApp.setWishlistItems(items);
        card.style.transition = 'all 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        setTimeout(() => {
          renderWishlist();
          CyberApp.showToast('REMOVED FROM WISHLIST', 'warning');
        }, 300);
      }
      else if (e.target.closest('.move-to-cart-btn')) {
        const item = items[itemIdx];
        
        // Add to cart logic
        let cartItems = CyberApp.getCartItems();
        const existingCartIdx = cartItems.findIndex(i => i.id === id);
        if (existingCartIdx >= 0) {
          cartItems[existingCartIdx].qty++;
        } else {
          cartItems.push({ ...item, qty: 1 });
        }
        CyberApp.setCartItems(cartItems);

        // Remove from wishlist
        items.splice(itemIdx, 1);
        CyberApp.setWishlistItems(items);

        card.style.transition = 'all 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'translateY(-20px)';
        setTimeout(() => {
          renderWishlist();
          CyberApp.showToast('MOVED TO CART', 'success');
        }, 300);
      }
    });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('page-wishlist')) {
    CyberWishlist.init();
  }
});
