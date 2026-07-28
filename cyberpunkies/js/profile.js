/**
 * ═══════════════════════════════════════════════════════
 *  CYBERPUNK PROFILE PAGE — profile.js
 *  Tabs · Form validation · LocalStorage Persistence · Toggles
 * ═══════════════════════════════════════════════════════
 */

const CyberProfile = (() => {
  'use strict';

  const STORAGE_KEY = 'cybermarket_user_data';

  // ── Default User Data ───────────────────────────────
  const defaultUserData = {
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
        { id: 1, device: 'Chrome / Windows 11', location: 'Neo-Tokyo', ip: '192.168.1.xxx', lastActive: '2 min ago', current: true, active: true },
        { id: 2, device: 'Firefox / Linux', location: 'Sector 9K', ip: '10.0.42.xxx', lastActive: '3 hours ago', current: false, active: true },
        { id: 3, device: 'Mobile / Android', location: 'The Sprawl', ip: '172.16.0.xxx', lastActive: '1 day ago', current: false, active: true }
      ]
    },
    billing: {
      address: {
        street: 'Block 7G, Neon Heights Tower',
        city: 'Neo-Tokyo',
        zip: 'NT-77042'
      },
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

  let userData = {};

  /**
   * Load data from LocalStorage or initialize with defaults.
   */
  function loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        userData = JSON.parse(stored);
      } else {
        userData = JSON.parse(JSON.stringify(defaultUserData));
        saveData();
      }
    } catch (e) {
      console.warn('LocalStorage unavailable, using default memory state:', e);
      userData = JSON.parse(JSON.stringify(defaultUserData));
    }
  }

  /**
   * Save current userData to LocalStorage.
   */
  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (e) {
      console.error('Failed to save to LocalStorage:', e);
    }
  }

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

        if (settingName === 'two-factor') {
          userData.security.twoFactor = isEnabled;
        } else if (settingName && userData.notifications.hasOwnProperty(settingName)) {
          userData.notifications[settingName] = isEnabled;
        }

        saveData();

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

        // Save current form inputs to state
        saveCurrentFormInputs();

        // Simulate save process
        btn.textContent = '$ SAVING TO DATASTORE...';
        btn.disabled = true;
        btn.style.opacity = '0.7';

        setTimeout(() => {
          btn.textContent = '✓ SAVED';
          btn.style.opacity = '1';
          btn.style.boxShadow = 'var(--shadow-neon-lg)';

          setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
            btn.style.boxShadow = '';
            CyberApp.showToast('Changes persisted to Datastore', 'success');
          }, 1200);
        }, 600);
      });
    });
  }

  /**
   * Read form fields and update state + LocalStorage.
   */
  function saveCurrentFormInputs() {
    // Profile info form
    const nameInput = document.getElementById('display-name');
    const emailInput = document.getElementById('email');
    const locationInput = document.getElementById('location');
    const websiteInput = document.getElementById('website');
    const bioInput = document.getElementById('bio');

    if (nameInput) userData.displayName = nameInput.value.trim();
    if (emailInput) userData.email = emailInput.value.trim();
    if (locationInput) userData.location = locationInput.value.trim();
    if (websiteInput) userData.website = websiteInput.value.trim();
    if (bioInput) userData.bio = bioInput.value.trim();

    // Delivery settings
    const channelSelect = document.getElementById('notify-channel');
    const scheduleSelect = document.getElementById('notify-schedule');

    if (channelSelect) userData.notifications.channel = channelSelect.value;
    if (scheduleSelect) userData.notifications.schedule = scheduleSelect.value;

    // Billing address
    const streetInput = document.getElementById('billing-street');
    const cityInput = document.getElementById('billing-city');
    const zipInput = document.getElementById('billing-zip');

    if (streetInput || cityInput || zipInput) {
      userData.billing.address = {
        street: streetInput ? streetInput.value.trim() : userData.billing.address.street,
        city: cityInput ? cityInput.value.trim() : userData.billing.address.city,
        zip: zipInput ? zipInput.value.trim() : userData.billing.address.zip
      };
    }

    saveData();
    updateUIElements();
  }

  /**
   * Update hero section and live UI elements from state.
   */
  function updateUIElements() {
    const heroName = document.querySelector('.cyber-glitch[data-text]');
    if (heroName) {
      heroName.setAttribute('data-text', userData.displayName);
      heroName.textContent = userData.displayName;
    }
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
        CyberApp.showToast('Security credentials updated in Datastore', 'success');
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
    document.querySelectorAll('[data-action="terminate-session"]').forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('tr');
        if (row) {
          row.style.opacity = '0.3';
          row.style.textDecoration = 'line-through';
          btn.disabled = true;
          btn.textContent = 'TERMINATED';

          // Mark session inactive in state
          if (userData.security.sessions[index + 1]) {
            userData.security.sessions[index + 1].active = false;
            saveData();
          }

          CyberApp.showToast('Session revoked & logged out', 'info');
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

        userData.security.sessions.forEach(sess => {
          if (!sess.current) sess.active = false;
        });
        saveData();

        CyberApp.showToast('All other active sessions revoked', 'success');
      });
    }
  }

  /**
   * Populate profile page inputs with data from LocalStorage.
   */
  function populateData() {
    // Hero & Profile inputs
    const heroName = document.querySelector('.cyber-glitch[data-text]');
    if (heroName) {
      heroName.setAttribute('data-text', userData.displayName);
      heroName.textContent = userData.displayName;
    }

    const nameInput = document.getElementById('display-name');
    const emailInput = document.getElementById('email');
    const locationInput = document.getElementById('location');
    const websiteInput = document.getElementById('website');
    const bioInput = document.getElementById('bio');

    if (nameInput) nameInput.value = userData.displayName || '';
    if (emailInput) emailInput.value = userData.email || '';
    if (locationInput) locationInput.value = userData.location || '';
    if (websiteInput) websiteInput.value = userData.website || '';
    if (bioInput) bioInput.value = userData.bio || '';

    // Notification Toggles & Dropdowns
    const toggles = {
      'order-updates': userData.notifications.orderUpdates,
      'price-drops': userData.notifications.priceDrops,
      'new-messages': userData.notifications.newMessages,
      'marketing': userData.notifications.marketing,
      'two-factor': userData.security.twoFactor
    };

    Object.entries(toggles).forEach(([key, val]) => {
      const toggleEl = document.querySelector(`input[data-setting="${key}"]`);
      if (toggleEl) {
        toggleEl.checked = Boolean(val);
        const label = toggleEl.closest('.toggle-row')?.querySelector('.toggle-label');
        if (label) {
          const statusEl = label.querySelector('.toggle-status');
          if (statusEl) {
            statusEl.textContent = val ? 'ENABLED' : 'DISABLED';
            statusEl.style.color = val ? 'var(--color-accent)' : 'var(--color-muted-foreground)';
          }
        }
      }
    });

    const channelSelect = document.getElementById('notify-channel');
    const scheduleSelect = document.getElementById('notify-schedule');

    if (channelSelect && userData.notifications.channel) channelSelect.value = userData.notifications.channel;
    if (scheduleSelect && userData.notifications.schedule) scheduleSelect.value = userData.notifications.schedule;

    // Billing address
    const streetInput = document.getElementById('billing-street');
    const cityInput = document.getElementById('billing-city');
    const zipInput = document.getElementById('billing-zip');

    if (streetInput && userData.billing?.address) streetInput.value = userData.billing.address.street || '';
    if (cityInput && userData.billing?.address) cityInput.value = userData.billing.address.city || '';
    if (zipInput && userData.billing?.address) zipInput.value = userData.billing.address.zip || '';

    // Transactions table
    const tbody = document.getElementById('transactions-body');
    if (tbody && userData.billing?.transactions) {
      tbody.innerHTML = userData.billing.transactions.map(tx => {
        const isComplete = tx.status === 'complete';
        return `
          <tr>
            <td style="color: var(--color-accent)">${tx.id}</td>
            <td>${tx.date}</td>
            <td>${tx.item}</td>
            <td>${tx.amount}</td>
            <td><span class="cyber-badge${isComplete ? '' : ' cyber-badge--tertiary'}">${tx.status}</span></td>
          </tr>
        `;
      }).join('');
    }
  }

  /**
   * Reset data to default (utility method).
   */
  function resetData() {
    userData = JSON.parse(JSON.stringify(defaultUserData));
    saveData();
    populateData();
    CyberApp.showToast('Datastore reset to factory defaults', 'info');
  }

  /**
   * Initialize the profile page.
   */
  function init() {
    loadData();
    populateData();
    initTabs();
    initToggles();
    initSaveButtons();
    initPasswordForm();
    initSessionActions();
  }

  return { init, userData, resetData };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', CyberProfile.init);
