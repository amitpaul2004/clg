/**
 * ═══════════════════════════════════════════════════════
 *  CYBERPUNK PROFILE PAGE — profile.js
 *  Tabs · MongoDB API Sync · Modals · Form Persistence
 * ═══════════════════════════════════════════════════════
 */

const CyberProfile = (() => {
  'use strict';

  const API_BASE = (window.location.protocol === 'file:' || window.location.port !== '8080')
    ? 'http://localhost:8080'
    : '';

  const STORAGE_KEY = 'cybermarket_user_data';

  let userData = {
    displayName: 'NEXUS_RUNNER',
    handle: '@nexus_runner_77',
    email: 'nexus@darknet.io',
    bio: 'Rogue netrunner. Data liberation specialist. The sprawl is my playground.',
    location: 'Neo-Tokyo, Sector 7G',
    website: 'https://nexus-runner.darknet.io',
    notifications: {
      orderUpdates: true,
      priceDrops: true,
      newMessages: true,
      marketing: false,
      channel: 'email',
      schedule: 'realtime'
    },
    security: {
      twoFactor: true
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

  /**
   * Helper to get JWT auth header.
   */
  function getAuthHeader() {
    const token = localStorage.getItem('cybermarket_auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * Load data from MongoDB API or LocalStorage.
   */
  async function loadData() {
    try {
      const token = localStorage.getItem('cybermarket_auth_token');
      if (token) {
        const res = await fetch(`${API_BASE}/api/user/profile`, {
          headers: { ...getAuthHeader() }
        });
        if (res.ok) {
          const apiUser = await res.json();
          userData = { ...userData, ...apiUser };
        }
      } else {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          userData = { ...userData, ...JSON.parse(stored) };
        }
      }
    } catch (e) {
      console.warn('API error, loading from local cache:', e);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) userData = { ...userData, ...JSON.parse(stored) };
    }
    populateData();
  }

  /**
   * Save current userData to LocalStorage cache.
   */
  function saveLocalCache() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (e) {}
  }

  /**
   * Initialize tab switching across all 4 tabs.
   */
  function initTabs() {
    const tabs = document.querySelectorAll('.cyber-tab');
    const panels = document.querySelectorAll('.cyber-tab-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetPanel = tab.getAttribute('data-tab');

        tabs.forEach(t => t.classList.remove('cyber-tab--active'));
        panels.forEach(p => p.classList.remove('cyber-tab-panel--active'));

        tab.classList.add('cyber-tab--active');
        const panel = document.getElementById(targetPanel);
        if (panel) {
          panel.classList.add('cyber-tab-panel--active');
          panel.style.animation = 'none';
          panel.offsetHeight;
          panel.style.animation = '';
        }
      });
    });
  }

  /**
   * Initialize toggle switches across Profile, Security, Notifications.
   */
  function initToggles() {
    const toggles = document.querySelectorAll('.cyber-toggle input');

    toggles.forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const settingName = e.target.getAttribute('data-setting');
        const isEnabled = e.target.checked;

        if (settingName === 'two-factor') {
          if (isEnabled) {
            // Prevent immediate toggle, open setup modal instead
            e.target.checked = false;
            const modal = document.getElementById('setup-2fa-modal');
            if (modal) modal.classList.remove('hidden');
            return;
          } else {
            userData.security.twoFactor = false;
            // Instantly save to backend when turning off
            const token = localStorage.getItem('cybermarket_auth_token');
            if (token) {
              fetch(`${API_BASE}/api/user/security`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ twoFactor: false })
              }).catch(() => {});
            }
            CyberApp.showToast('2FA DISABLED', 'error');
          }
        } else if (settingName && userData.notifications) {
          const keyMap = {
            'order-updates': 'orderUpdates',
            'price-drops': 'priceDrops',
            'new-messages': 'newMessages',
            'marketing': 'marketing'
          };
          const key = keyMap[settingName] || settingName;
          userData.notifications[key] = isEnabled;
        }

        saveLocalCache();

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
   * Initialize form save buttons for Profile, Notifications, and Billing Address.
   */
  function initSaveButtons() {
    const saveBtns = document.querySelectorAll('[data-action="save"]');

    saveBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const originalText = btn.textContent;

        btn.textContent = '$ SAVING TO MONGODB...';
        btn.disabled = true;
        btn.style.opacity = '0.7';

        const panelId = btn.closest('.cyber-tab-panel')?.id;

        try {
          if (panelId === 'tab-profile') {
            await saveProfileInfo();
          } else if (panelId === 'tab-notifications') {
            await saveNotifications();
          } else if (panelId === 'tab-billing') {
            await saveBillingAddress();
          } else {
            saveLocalCache();
          }

          btn.textContent = '✓ SAVED';
          btn.style.opacity = '1';
          btn.style.boxShadow = 'var(--shadow-neon-lg)';

          setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
            btn.style.boxShadow = '';
            CyberApp.showToast('DATASET PERSISTED TO MONGODB', 'success');
          }, 1200);

        } catch (err) {
          btn.textContent = originalText;
          btn.disabled = false;
          CyberApp.showToast('Failed to save to MongoDB', 'error');
        }
      });
    });
  }

  /**
   * Save Profile Information via PUT /api/user/profile.
   */
  async function saveProfileInfo() {
    const displayName = document.getElementById('display-name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const location = document.getElementById('location')?.value.trim();
    const website = document.getElementById('website')?.value.trim();
    const bio = document.getElementById('bio')?.value.trim();

    userData.displayName = displayName || userData.displayName;
    userData.email = email || userData.email;
    userData.location = location || userData.location;
    userData.website = website || userData.website;
    userData.bio = bio || userData.bio;

    saveLocalCache();
    updateUIElements();

    const token = localStorage.getItem('cybermarket_auth_token');
    if (token) {
      await fetch(`${API_BASE}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ displayName, email, location, website, bio })
      });
    }
  }

  /**
   * Save Notifications Preferences via PUT /api/user/notifications.
   */
  async function saveNotifications() {
    const channelSelect = document.getElementById('notify-channel');
    const scheduleSelect = document.getElementById('notify-schedule');

    if (channelSelect) userData.notifications.channel = channelSelect.value;
    if (scheduleSelect) userData.notifications.schedule = scheduleSelect.value;

    saveLocalCache();

    const token = localStorage.getItem('cybermarket_auth_token');
    if (token) {
      await fetch(`${API_BASE}/api/user/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(userData.notifications)
      });
    }
  }

  /**
   * Save Billing Address via PUT /api/user/billing.
   */
  async function saveBillingAddress() {
    const street = document.getElementById('billing-street')?.value.trim();
    const city = document.getElementById('billing-city')?.value.trim();
    const zip = document.getElementById('billing-zip')?.value.trim();

    userData.billing.address = { street, city, zip };
    saveLocalCache();

    const token = localStorage.getItem('cybermarket_auth_token');
    if (token) {
      await fetch(`${API_BASE}/api/user/billing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(userData.billing.address)
      });
    }
  }

  /**
   * Update hero heading and avatar handle in real time.
   */
  function updateUIElements() {
    const heroName = document.querySelector('.cyber-glitch[data-text]');
    if (heroName) {
      heroName.setAttribute('data-text', userData.displayName);
      heroName.textContent = userData.displayName;
    }
  }

  /**
   * Initialize Password Form (Security Tab) via PUT /api/user/password.
   */
  function initPasswordForm() {
    const form = document.getElementById('password-form');
    if (!form) return;

    // Password visibility toggle (eye buttons)
    document.querySelectorAll('.password-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;

        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';

        // Swap icon
        const icon = btn.querySelector('i, svg');
        if (icon) {
          icon.setAttribute('data-lucide', isHidden ? 'eye-off' : 'eye');
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        // Visual feedback
        btn.style.color = isHidden ? 'var(--color-accent)' : 'var(--color-muted-foreground)';
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const currentPw = form.querySelector('[name="current-password"]');
      const newPw = form.querySelector('[name="new-password"]');
      const confirmPw = form.querySelector('[name="confirm-password"]');

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

      if (!valid) return;

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = '$ UPDATING PASSKEY...';

      try {
        const token = localStorage.getItem('cybermarket_auth_token');
        if (token) {
          const res = await fetch(`${API_BASE}/api/user/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ currentPassword: currentPw.value, newPassword: newPw.value })
          });
          const data = await res.json();
          if (!res.ok) {
            showFieldError(currentPw, data.error || 'Password update failed');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
          }
        }

        CyberApp.showToast('SECURITY PASSKEY UPDATED IN MONGODB', 'success');
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      } catch (err) {
        CyberApp.showToast('Server error updating password', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
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
   * Initialize session termination buttons (Security Tab).
   */
  function initSessionActions() {
    document.querySelectorAll('[data-action="terminate-session"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('tr');
        if (row) {
          row.style.opacity = '0.3';
          row.style.textDecoration = 'line-through';
          btn.disabled = true;
          btn.textContent = 'TERMINATED';
          CyberApp.showToast('Active session revoked', 'info');
        }
      });
    });

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
        CyberApp.showToast('All other sessions revoked', 'success');
      });
    }
  }

  /**
   * Initialize Add Payment Method and Link Account Modals.
   */
  function initModals() {
    // Add Payment Modal
    const addPaymentBtn = document.getElementById('add-payment-btn');
    const paymentModal = document.getElementById('add-payment-modal');
    const cancelPaymentBtn = document.getElementById('cancel-payment-btn');
    const paymentForm = document.getElementById('add-payment-form');

    if (addPaymentBtn && paymentModal) {
      addPaymentBtn.addEventListener('click', () => paymentModal.classList.remove('hidden'));
      cancelPaymentBtn?.addEventListener('click', () => paymentModal.classList.add('hidden'));

      paymentForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.getElementById('payment-type').value;
        const identifier = document.getElementById('payment-identifier').value.trim();
        const holder = document.getElementById('payment-holder').value.trim();
        const expiry = document.getElementById('payment-expiry').value.trim();

        const last4 = identifier.slice(-4) || '9988';
        const cardObj = { type, last4, expiry, name: holder, primary: false };

        const submitBtn = paymentForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader" class="animate-spin" style="width:14px;height:14px;"></i> SAVING...';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const token = localStorage.getItem('cybermarket_auth_token');
        if (token) {
          fetch(`${API_BASE}/api/user/billing/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(cardObj)
          })
          .then(res => res.json())
          .then(data => {
            if (data.cards) {
              userData.billing.cards = data.cards;
              saveLocalCache();
              renderPaymentMethods(userData.billing.cards);
            }
          })
          .catch(() => CyberApp.showToast('Failed to add payment method to MongoDB', 'error'))
          .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            paymentModal.classList.add('hidden');
            paymentForm.reset();
            CyberApp.showToast('PAYMENT METHOD ADDED TO ACCOUNT', 'success');
            if (typeof lucide !== 'undefined') lucide.createIcons();
          });
        } else {
          userData.billing.cards.push(cardObj);
          saveLocalCache();
          renderPaymentMethods(userData.billing.cards);
          
          paymentModal.classList.add('hidden');
          paymentForm.reset();
          CyberApp.showToast('PAYMENT METHOD ADDED (LOCAL)', 'success');
        }

      });
    }

    // Link Account Modal
    const linkAccountBtn = document.getElementById('link-account-btn');
    const linkModal = document.getElementById('link-account-modal');
    const cancelLinkBtn = document.getElementById('cancel-link-btn');
    const linkForm = document.getElementById('link-account-form');

    if (linkAccountBtn && linkModal) {
      linkAccountBtn.addEventListener('click', () => linkModal.classList.remove('hidden'));
      cancelLinkBtn?.addEventListener('click', () => linkModal.classList.add('hidden'));

      linkForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const platform = document.getElementById('link-platform').value;
        const handle = document.getElementById('link-handle').value.trim();
        if (!handle) return;

        const token = localStorage.getItem('cybermarket_auth_token');
        try {
          const resp = await fetch(`${API_BASE}/api/user/linked-accounts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ platform, handle })
          });
          const data = await resp.json();
          if (!resp.ok) {
            CyberApp.showToast(data.error || 'FAILED TO LINK ACCOUNT', 'error');
            return;
          }

          // Re-render badges from server response
          if (data.linkedAccounts) {
            renderLinkedAccounts(data.linkedAccounts);
          } else {
            // Fallback: just insert the badge
            insertAccountBadge(platform, handle);
          }
          linkModal.classList.add('hidden');
          linkForm.reset();
          CyberApp.showToast('DATANET ACCOUNT LINKED SUCCESSFULLY', 'success');
        } catch (err) {
          // Offline fallback: just add badge locally
          insertAccountBadge(platform, handle);
          linkModal.classList.add('hidden');
          linkForm.reset();
          CyberApp.showToast('ACCOUNT LINKED (LOCAL)', 'info');
        }
      });
    }

    // Disconnect linked accounts (event delegation)
    const accountsContainer = document.getElementById('linked-accounts-container');
    if (accountsContainer) {
      accountsContainer.addEventListener('click', async (e) => {
        const btn = e.target.closest('.disconnect-account-btn');
        if (!btn) return;
        const badge = btn.closest('.linked-account-badge');
        if (!badge) return;

        const platform = badge.getAttribute('data-account') || '';
        const handle = badge.getAttribute('data-handle') || '';

        // Animate removal
        badge.style.transition = 'opacity 300ms, transform 300ms';
        badge.style.opacity = '0';
        badge.style.transform = 'scale(0.8)';

        // Call DELETE API
        const token = localStorage.getItem('cybermarket_auth_token');
        try {
          await fetch(`${API_BASE}/api/user/linked-accounts/${encodeURIComponent(platform)}?handle=${encodeURIComponent(handle)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch (err) {
          // Offline — still remove visually
        }

        setTimeout(() => badge.remove(), 300);
        CyberApp.showToast(`${platform.toUpperCase()} ACCOUNT DISCONNECTED`, 'error');
      });
    }

    // 2FA Setup Modal
    const setup2FAModal = document.getElementById('setup-2fa-modal');
    const cancel2FABtn = document.getElementById('cancel-2fa-btn');
    const setup2FAForm = document.getElementById('setup-2fa-form');
    const methodSelect = document.getElementById('2fa-method');
    const contactLabel = document.getElementById('2fa-contact-label');
    const contactInput = document.getElementById('2fa-contact');

    if (setup2FAModal && setup2FAForm) {
      const step1 = document.getElementById('setup-2fa-step1');
      const step2 = document.getElementById('setup-2fa-step2');
      const verifyMethodText = document.getElementById('verify-method-text');
      const verify2FAForm = document.getElementById('verify-2fa-form');
      const back2FABtn = document.getElementById('back-2fa-btn');

      // Helper to reset modal to step 1
      const resetModal = () => {
        setup2FAModal.classList.add('hidden');
        setup2FAForm.reset();
        if (verify2FAForm) verify2FAForm.reset();
        if (step1) step1.classList.remove('hidden');
        if (step2) step2.classList.add('hidden');
      };

      cancel2FABtn?.addEventListener('click', resetModal);

      methodSelect?.addEventListener('change', (e) => {
        if (e.target.value === 'email') {
          contactLabel.textContent = 'Email Address';
          contactInput.placeholder = 'runner@darknet.io';
          contactInput.type = 'email';
        } else {
          contactLabel.textContent = 'Phone Number';
          contactInput.placeholder = '+1 555-0198';
          contactInput.type = 'text';
        }
      });

      // Step 1: Send OTP
      setup2FAForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const method = methodSelect.value;
        const contact = contactInput.value.trim();

        if (!contact) return;

        const token = localStorage.getItem('cybermarket_auth_token');
        try {
          // Send request for OTP
          const resp = await fetch(`${API_BASE}/api/user/security/otp/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ method, contact })
          });
          const data = await resp.json();
          if (!resp.ok) {
            CyberApp.showToast(data.error || 'FAILED TO SEND OTP', 'error');
            return;
          }

          CyberApp.showToast(data.message || 'OTP SENT', 'info');

          // Switch to Step 2
          if (verifyMethodText) verifyMethodText.textContent = method === 'email' ? 'email' : 'phone';
          if (step1) step1.classList.add('hidden');
          if (step2) step2.classList.remove('hidden');
        } catch (err) {
          CyberApp.showToast('Server error sending OTP', 'error');
        }
      });

      // Step 2: Back button
      back2FABtn?.addEventListener('click', () => {
        if (step2) step2.classList.add('hidden');
        if (step1) step1.classList.remove('hidden');
        if (verify2FAForm) verify2FAForm.reset();
      });

      // Step 2: Verify OTP
      if (verify2FAForm) {
        verify2FAForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const code = document.getElementById('2fa-code').value.trim();
          const method = methodSelect.value;
          const contact = contactInput.value.trim();
          
          if (!code || code.length !== 6) {
            CyberApp.showToast('ENTER 6-DIGIT CODE', 'error');
            return;
          }

          const token = localStorage.getItem('cybermarket_auth_token');
          try {
            const resp = await fetch(`${API_BASE}/api/user/security/otp/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ code, method, contact })
            });
            const data = await resp.json();
            
            if (!resp.ok) {
              CyberApp.showToast(data.error || 'INVALID OTP CODE', 'error');
              return;
            }

            userData.security = data.security;
            saveLocalCache();

            // Visually turn toggle on
            const toggle = document.querySelector('input[data-setting="two-factor"]');
            if (toggle) {
              toggle.checked = true;
              const label = toggle.closest('.toggle-row')?.querySelector('.toggle-label');
              if (label) {
                const statusEl = label.querySelector('.toggle-status');
                if (statusEl) {
                  statusEl.textContent = 'ENABLED';
                  statusEl.style.color = 'var(--color-accent)';
                }
              }
            }

            resetModal();
            CyberApp.showToast('2FA ENABLED SUCCESSFULLY', 'success');
          } catch (err) {
            CyberApp.showToast('Server error verifying OTP', 'error');
          }
        });
      }
    }

    // Backdrop click to close modals (updated to include 2FA)
    [paymentModal, linkModal, setup2FAModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.classList.add('hidden');
        });
      }
    });
  }

  /**
   * Map platform name to a Lucide icon name.
   */
  function platformIcon(platform) {
    const icons = {
      discord: 'message-circle',
      github: 'github',
      matrix: 'globe',
      telegram: 'send',
      twitter: 'twitter'
    };
    return icons[platform] || 'shield';
  }

  /**
   * Insert a single linked account badge into the container.
   */
  function insertAccountBadge(platform, handle) {
    const container = document.getElementById('linked-accounts-container');
    const linkBtn = document.getElementById('link-account-btn');
    if (!container) return;

    const badge = document.createElement('div');
    badge.className = 'linked-account-badge flex items-center gap-2 px-4 py-2 border border-[var(--color-border)] bg-[var(--color-muted)]';
    badge.setAttribute('data-account', platform);
    badge.setAttribute('data-handle', handle);
    badge.style.clipPath = 'polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))';
    badge.innerHTML = `
      <i data-lucide="${platformIcon(platform)}" style="width:16px;height:16px;stroke-width:1.5;color:var(--color-accent-tertiary);"></i>
      <span style="font-family: var(--font-label); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em;">${handle}</span>
      <span class="cyber-badge cyber-badge--tertiary" style="margin-left:0.5rem;">Connected</span>
      <button class="disconnect-account-btn" title="Disconnect account" style="margin-left:0.5rem; background:none; border:none; color:var(--color-destructive); cursor:pointer; font-size:1rem; line-height:1; padding:2px 4px; opacity:0.7; transition:opacity 150ms;">&times;</button>
    `;
    container.insertBefore(badge, linkBtn);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  /**
   * Render all linked accounts from MongoDB data.
   */
  function renderLinkedAccounts(accounts) {
    const container = document.getElementById('linked-accounts-container');
    if (!container) return;
    const linkBtn = document.getElementById('link-account-btn');

    // Remove existing badges (keep the + Link Account button)
    container.querySelectorAll('.linked-account-badge').forEach(b => b.remove());

    // Insert each account
    if (accounts && accounts.length > 0) {
      accounts.forEach(acc => {
        insertAccountBadge(acc.platform, acc.handle);
      });
    }
  }

  /**
   * Populate inputs across all 4 tabs with state.
   */
  function populateData() {
    updateUIElements();

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
    if (userData.notifications) {
      const toggles = {
        'order-updates': userData.notifications.orderUpdates,
        'price-drops': userData.notifications.priceDrops,
        'new-messages': userData.notifications.newMessages,
        'marketing': userData.notifications.marketing,
        'two-factor': userData.security?.twoFactor
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
    }

    // Billing Address
    if (userData.billing?.address) {
      const streetInput = document.getElementById('billing-street');
      const cityInput = document.getElementById('billing-city');
      const zipInput = document.getElementById('billing-zip');
      if (streetInput) streetInput.value = userData.billing.address.street || '';
      if (cityInput) cityInput.value = userData.billing.address.city || '';
      if (zipInput) zipInput.value = userData.billing.address.zip || '';
    }
    
    // Payment Methods
    if (userData.billing?.cards) {
      renderPaymentMethods(userData.billing.cards);
    }

    // Transactions Table
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

    // Linked Accounts from MongoDB
    if (userData.linkedAccounts) {
      renderLinkedAccounts(userData.linkedAccounts);
    }
    
    // Active Sessions from MongoDB
    if (userData.activeSessions) {
      renderSessions(userData.activeSessions);
    }
  }

  /**
   * Helper for relative time
   */
  function timeAgo(dateStr) {
    if (!dateStr) return 'Now';
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'Now';
    const intervals = { year: 31536000, month: 2592000, day: 86400, hour: 3600, minute: 60 };
    for (const [unit, secs] of Object.entries(intervals)) {
      const i = Math.floor(seconds / secs);
      if (i >= 1) return `${i} ${unit}${i > 1 ? 's' : ''} ago`;
    }
    return 'Now';
  }

  /**
   * Render dynamic active sessions table and attach revoke events.
   */
  function renderSessions(sessions) {
    const tbody = document.getElementById('sessions-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    sessions.forEach(session => {
      const tr = document.createElement('tr');
      if (session.isCurrent) tr.className = 'current-session';
      
      tr.innerHTML = `
        <td>
          <div class="flex items-center gap-2">
            <i data-lucide="${session.icon || 'monitor'}" style="width:14px;height:14px;stroke-width:1.5;color:var(--color-${session.isCurrent ? 'accent' : 'muted-foreground'});"></i>
            ${session.device}
          </div>
        </td>
        <td>${session.location}</td>
        <td style="font-family:var(--font-label); font-size:0.75rem;">${session.ip}</td>
        <td>
          ${session.isCurrent ? `
          <span class="flex items-center gap-1.5">
            <span class="cyber-notification-dot"></span>
            Now
          </span>
          ` : timeAgo(session.lastActive)}
        </td>
        <td>
          ${session.isCurrent 
            ? `<span class="cyber-badge">Current</span>`
            : `<button class="cyber-btn cyber-btn--sm cyber-btn--outline revoke-btn" data-id="${session._id}" style="padding:0.25rem 0.625rem; min-height: 28px;">Revoke</button>`
          }
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Revoke Individual Session
    document.querySelectorAll('.revoke-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const sessionId = btn.getAttribute('data-id');
        const token = localStorage.getItem('cybermarket_auth_token');
        
        btn.innerHTML = '<i data-lucide="loader" class="animate-spin" style="width:14px;height:14px;"></i>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        try {
          const resp = await fetch(`${API_BASE}/api/user/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (resp.ok) {
            const data = await resp.json();
            userData.activeSessions = data.activeSessions;
            saveLocalCache();
            renderSessions(userData.activeSessions);
            CyberApp.showToast('SESSION TERMINATED', 'success');
          }
        } catch (err) {
          CyberApp.showToast('FAILED TO TERMINATE SESSION', 'error');
        }
      });
    });

    // Terminate All Others
    const terminateAllBtn = document.getElementById('terminate-all-btn');
    if (terminateAllBtn) {
      // Remove old listeners by cloning
      const newBtn = terminateAllBtn.cloneNode(true);
      terminateAllBtn.parentNode.replaceChild(newBtn, terminateAllBtn);
      
      newBtn.addEventListener('click', async () => {
        const token = localStorage.getItem('cybermarket_auth_token');
        newBtn.innerHTML = '<i data-lucide="loader" class="animate-spin" style="width:14px;height:14px;"></i> TERMINATING...';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        try {
          const resp = await fetch(`${API_BASE}/api/user/sessions`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (resp.ok) {
            const data = await resp.json();
            userData.activeSessions = data.activeSessions;
            saveLocalCache();
            renderSessions(userData.activeSessions);
            CyberApp.showToast('ALL OTHER SESSIONS TERMINATED', 'success');
          }
        } catch (err) {
          CyberApp.showToast('FAILED TO TERMINATE SESSIONS', 'error');
        } finally {
          newBtn.innerHTML = '<i data-lucide="skull" style="width:14px;height:14px;stroke-width:1.5;"></i> Terminate All Others';
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }
      });
    }
  }

  /**
   * Initialize Password Form and visibility toggles
   */
  function initPasswordForm() {
    const passwordForm = document.getElementById('password-form');
    
    // Setup visibility toggles
    document.querySelectorAll('.password-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = btn.querySelector('i');
        
        if (input && icon) {
          if (input.type === 'password') {
            input.type = 'text';
            icon.setAttribute('data-lucide', 'eye-off');
            btn.style.color = 'var(--color-accent)';
          } else {
            input.type = 'password';
            icon.setAttribute('data-lucide', 'eye');
            btn.style.color = 'var(--color-muted-foreground)';
          }
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }
      });
    });

    if (passwordForm) {
      passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (newPassword !== confirmPassword) {
          CyberApp.showToast('PASSWORDS DO NOT MATCH', 'error');
          return;
        }

        const btn = passwordForm.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="loader" class="animate-spin" style="width:14px;height:14px;"></i> PROCESSING...';
        btn.disabled = true;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        try {
          const token = localStorage.getItem('cybermarket_auth_token');
          const resp = await fetch(`${API_BASE}/api/user/password`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
          });
          const data = await resp.json();
          
          if (!resp.ok) {
            CyberApp.showToast(data.error || 'UPDATE FAILED', 'error');
          } else {
            CyberApp.showToast('PASSWORD UPDATED SUCCESSFULLY', 'success');
            passwordForm.reset();
          }
        } catch (err) {
          CyberApp.showToast('SERVER CONNECTION LOST', 'error');
        } finally {
          btn.innerHTML = originalText;
          btn.disabled = false;
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }
      });
    }
  }

  /**
   * Initialize profile page.
   */
  function init() {
    loadData();
    initTabs();
    initToggles();
    initSaveButtons();
    initPasswordForm();
    initSessionActions();
    initModals();
  }

  return { init, userData };

  /**
   * Render dynamic payment methods cards.
   */
  function renderPaymentMethods(cards) {
    const container = document.getElementById('payment-methods-container');
    if (!container) return;

    container.innerHTML = '';
    
    cards.forEach(card => {
      const isCrypto = card.type === 'CRYPTO';
      const div = document.createElement('div');
      div.className = 'cyber-payment-card';
      if (isCrypto) div.style.borderColor = 'var(--color-accent-secondary)';

      div.innerHTML = `
        <div class="flex justify-between items-start">
          <span style="font-family: var(--font-heading); font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; color: ${isCrypto ? 'var(--color-accent-secondary)' : 'var(--color-foreground)'};">${card.type}</span>
          ${card.primary ? '<span class="cyber-badge">Primary</span>' : (isCrypto ? '<span class="cyber-badge cyber-badge--secondary">Wallet</span>' : '<span class="cyber-badge cyber-badge--tertiary">Active</span>')}
        </div>
        <div class="cyber-payment-card-number" style="${isCrypto ? 'font-size:0.8125rem;' : ''}">
          ${isCrypto ? 'WALLET_0x...' + card.last4 : '•••• •••• •••• ' + card.last4}
        </div>
        <div class="flex justify-between items-end">
          <div>
            <div class="cyber-payment-card-label">${isCrypto ? 'Network' : 'Card Holder'}</div>
            <div class="cyber-payment-card-value">${isCrypto ? 'ETH Mainnet' : card.name}</div>
          </div>
          <div>
            <div class="cyber-payment-card-label">${isCrypto ? 'Status' : 'Expires'}</div>
            <div class="cyber-payment-card-value" style="${isCrypto ? 'color: var(--color-accent);' : ''}">${isCrypto ? 'Active' : card.expiry}</div>
          </div>
        </div>
      `;
      container.appendChild(div);
    });
  }
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', CyberProfile.init);
