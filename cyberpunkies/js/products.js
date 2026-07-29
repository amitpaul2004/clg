/**
 * Products Marketplace Logic
 */

const CyberProducts = (function() {

  let currentCategory = 'all';
  let currentSearch = '';

  function render(productItems) {
    productItems.forEach(item => {
      const category = item.getAttribute('data-category');
      
      // Get title and description for search matching
      const title = item.querySelector('h3').textContent.toLowerCase();
      const desc = item.querySelector('p').textContent.toLowerCase();
      
      const categoryMatch = (currentCategory === 'all' || currentCategory === category);
      const searchMatch = (title.includes(currentSearch) || desc.includes(currentSearch));

      if (categoryMatch && searchMatch) {
        if (item.style.display === 'none') {
          item.style.display = 'flex';
          // Slight animation re-trigger
          item.style.animation = 'none';
          item.offsetHeight; // trigger reflow
          item.style.animation = 'toast-in 0.3s ease-out forwards';
        }
      } else {
        item.style.display = 'none';
      }
    });
  }

  function init() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productItems = document.querySelectorAll('.product-item');
    const searchInput = document.getElementById('product-search');
    const toggleFiltersBtn = document.getElementById('toggle-filters-btn');
    const filtersContainer = document.getElementById('product-filters');

    if (!productItems.length) return;

    // Handle Category Filters
    if (filterBtns.length) {
      filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          currentCategory = e.target.getAttribute('data-filter');

          // Update button styles
          filterBtns.forEach(b => {
            b.classList.remove('cyber-btn--glitch');
            b.classList.add('cyber-btn--outline');
          });
          e.target.classList.remove('cyber-btn--outline');
          e.target.classList.add('cyber-btn--glitch');

          render(productItems);
        });
      });
    }

    // Handle Search Input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase().trim();
        render(productItems);
      });
    }

    // Handle Toggle Filters Button
    if (toggleFiltersBtn && filtersContainer) {
      toggleFiltersBtn.addEventListener('click', () => {
        // Toggle the hidden class (or manually toggle display)
        if (filtersContainer.style.display === 'none') {
          filtersContainer.style.display = 'flex';
          filtersContainer.style.animation = 'toast-in 0.2s ease-out forwards';
        } else {
          filtersContainer.style.display = 'none';
        }
      });
    }
  }

  return { init };
})();

// Auto-init if on products page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('page-products')) {
    CyberProducts.init();
  }
});
