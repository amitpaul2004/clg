/**
 * ═══════════════════════════════════════════════════════
 *  CYBERPUNK PROFILE PAGE — profile.js
 *  Tabs · Form validation · Toggles · Save feedback
 * ═══════════════════════════════════════════════════════
 */

const CyberProfile = (() => {
  'use strict';

  // ── Mock User Data ──────────────────────────────────
  const userData = {
    displayName: 'NEXUS_RUNNER',
    handle: '@nexus_runner_77',
    email: 'nexus@darknet.io',
    bio: 'Rogue netrunner. Data liberation specialist. The sprawl is my playground.',
    location: 'Neo-Tokyo, Sector 7G',
    website: 'https://nexus-runner.darknet.io',
    joinDate: '2024-03-15',
    stats: {
      orders: 47,
      wishlist: 128,
      reviews: 23,
      credits: 12750
    },
    notifications: {
      orderUpdates: true,
      priceDrops: true,
      newMessages: true,
      marketing: false,
      channel: 'email',
      schedule: 'realtime'
    },
    security: {
      twoFactor: true,
      sessions: [
        { device: 'Chrome / Windows 11', location: 'Neo-Tokyo', ip: '192.168.1.xxx', lastActive: '2 min ago', current: true },
        { device: 'Firefox / Linux', location: 'Sector 9K', ip: '10.0.42.xxx', lastActive: '3 hours ago', current: false },
        { device: 'Mobile / Android', location: 'The Sprawl', ip: '172.16.0.xxx', lastActive: '1 day ago', current: false }
      ]
    },
    billing: {
      cards: [
        { type: 'VISA', last4: '4242', expiry: '09/27', name: 'NEXUS RUNNER', primary: true },
        { type: 'CRYPTO', last4: '8888', expiry: 'N/A', name: 'WALLET_0x7f...3a', primary: false }
      ],
      transactions: [
        { id: '#TXN-0847', date: '2026-07-25', item: 'Neural Interface v3.2', amount: '-Ȼ2,450', status: 'complete' },
        { id: '#TXN-0831', date: '2026-07-20', item: 'ICE Breaker Suite', amount: '-Ȼ890', status: 'complete' },
        { id: '#TXN-0819', date: '2026-07-14', item: 'Holo-Display Module', amount: '-Ȼ1,200', status: 'processing' },
        { id: '#TXN-0802', date: '2026-07-08', item: 'Cyberdeck Mk.IV Upgrade', amount: '-Ȼ5,600', status: 'complete' },
        { id: '#TXN-0791', date: '2026-07-01', item: 'Stealth Net License', amount: '-Ȼ340', status: 'complete' }
      ]
    }
  };

  /**
   * Initialize tab switching.
   */
  function initTabs() {
    const tabs = document.querySelectorAll('.cyber-tab');
    const panels = document.querySelectorAll('.cyber-tab-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetPanel = tab.getAttribute('data-tab');

        // Deactivate all
        tabs.forEach(t => t.classList.remove('cyber-tab--active'));
        panels.forEach(p => p.classList.remove('cyber-tab-panel--active'));

        // Activate selected
        tab.classList.add('cyber-tab--active');
        const panel = document.getElementById(targetPanel);
        if (panel) {
          panel.classList.add('cyber-tab-panel--active');
          // Re-trigger fade-in animation
          panel.style.animation = 'none';
          panel.offsetHeight; // force reflow
          panel.style.animation = '';
        }
      });
    });
  }

  /**
   * Initialize toggle switches.
   */
  function initToggles() {
    const toggles = document.querySelectorAll('.cyber-toggle input');

    toggles.forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const settingName = e.target.getAttribute('data-setting');
        const isEnabled = e.target.checked;

        // Visual feedback
        const label = toggle.closest('.toggle-row')?.querySelector('.toggle-label');
        if (label) {
          const statusEl = label.querySelector('.toggle-status');
          if (statusEl) {
            statusEl.textContent = isEnabled ? 'ENABLED' : 'DISABLED';
            statusEl.style.color = isEnabled ? 'var(--color-accent)' : 'var(--color-muted-foreground)';
          }
        }
      });
    });
  }

  /**
   * Initialize form save buttons.
   */
  function initSaveButtons() {
    const saveBtns = document.querySelectorAll('[data-action="save"]');

    saveBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const originalText = btn.textContent;

        // Simulate save
        btn.textContent = '$ PROCESSING...';
        btn.disabled = true;
        btn.style.opacity = '0.7';

        setTimeout(() => {
          btn.textContent = '✓ SAVED';
          btn.style.opacity = '1';

          // Flash glow effect
          btn.style.boxShadow = 'var(--shadow-neon-lg)';

          setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
            btn.style.boxShadow = '';
            CyberApp.showToast('Changes saved to datastore', 'success');
          }, 1200);
        }, 800);
      });
    });
  }

  /**
   * Initialize password change form.
   */
  function initPasswordForm() {
    const form = document.getElementById('password-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const currentPw = form.querySelector('[name="current-password"]');
      const newPw = form.querySelector('[name="new-password"]');
      const confirmPw = form.querySelector('[name="confirm-password"]');

      // Clear previous errors
      form.querySelectorAll('.cyber-error-text').forEach(el => el.remove());
      form.querySelectorAll('.cyber-input-error').forEach(el => el.classList.remove('cyber-input-error'));

      let valid = true;

      if (!currentPw.value) {
        showFieldError(currentPw, 'Current password required');
        valid = false;
      }

      if (newPw.value.length < 8) {
        showFieldError(newPw, 'Min 8 characters required');
        valid = false;
      }

      if (newPw.value !== confirmPw.value) {
        showFieldError(confirmPw, 'Passwords do not match');
        valid = false;
      }

      if (valid) {
        CyberApp.showToast('Password updated successfully', 'success');
        form.reset();
      }
    });
  }

  /**
   * Show field-level error.
   */
  function showFieldError(inputEl, message) {
    inputEl.classList.add('cyber-input-error');
    const errorEl = document.createElement('div');
    errorEl.className = 'cyber-error-text';
    errorEl.textContent = `> ${message}`;
    inputEl.closest('.form-group')?.appendChild(errorEl);
  }

  /**
   * Initialize session termination buttons.
   */
  function initSessionActions() {
    // Individual session terminate
    document.querySelectorAll('[data-action="terminate-session"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('tr');
        if (row) {
          row.style.opacity = '0.3';
          row.style.textDecoration = 'line-through';
          btn.disabled = true;
          btn.textContent = 'TERMINATED';
          CyberApp.showToast('Session terminated', 'info');
        }
      });
    });

    // Terminate all sessions
    const terminateAll = document.getElementById('terminate-all-sessions');
    if (terminateAll) {
      terminateAll.addEventListener('click', () => {
        const rows = document.querySelectorAll('#sessions-table tbody tr:not(.current-session)');
        rows.forEach(row => {
          row.style.opacity = '0.3';
          row.style.textDecoration = 'line-through';
          const btn = row.querySelector('[data-action="terminate-session"]');
          if (btn) {
            btn.disabled = true;
            btn.textContent = 'TERMINATED';
          }
        });
        CyberApp.showToast('All other sessions terminated', 'success');
      });
    }
  }

  /**
   * Populate profile page with mock data.
   */
  function populateData() {
    // Stats
    const statEls = document.querySelectorAll('.cyber-stat-value[data-count]');
    // Stats are handled by the count-up animation in effects.js

    // Transactions table
    const tbody = document.getElementById('transactions-body');
    if (tbody) {
      tbody.innerHTML = userData.billing.transactions.map(tx => {
        const statusColor = tx.status === 'complete' ? 'var(--color-accent)' : 'var(--color-accent-tertiary)';
        return `
          <tr>
            <td style="color: var(--color-accent)">${tx.id}</td>
            <td>${tx.date}</td>
            <td>${tx.item}</td>
            <td>${tx.amount}</td>
            <td><span class="cyber-badge${tx.status === 'complete' ? '' : ' cyber-badge--tertiary'}">${tx.status}</span></td>
          </tr>
        `;
      }).join('');
    }
  }

  /**
   * Initialize the profile page.
   */
  function init() {
    initTabs();
    initToggles();
    initSaveButtons();
    initPasswordForm();
    initSessionActions();
    populateData();
  }

  return { init, userData };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', CyberProfile.init);
