/**
 * Hyphene Cookie Consent System
 * Self-contained, premium glassmorphic cookie consent banner, preferences modal, and settings trigger.
 */
(function () {
  // Prevent duplicate initialization
  if (window.__hypheneCookieConsentInitialized) return;
  window.__hypheneCookieConsentInitialized = true;

  const COOKIE_NAME = 'hyphene_cookie_consent';
  const COOKIE_EXPIRY_DAYS = 365;

  // 1. Inject Styles
  const style = document.createElement('style');
  style.textContent = `
    /* CSS Variables & Theme */
    :root {
      --cc-bg: rgba(15, 23, 42, 0.92);
      --cc-border: rgba(255, 255, 255, 0.08);
      --cc-text-main: #f8fafc;
      --cc-text-muted: #94a3b8;
      --cc-primary-gradient: linear-gradient(135deg, #3ea6e8 0%, #2f365f 100%);
      --cc-primary-hover: linear-gradient(135deg, #4fb7f9 0%, #3a4276 100%);
      --cc-btn-outline-border: rgba(255, 255, 255, 0.15);
      --cc-btn-outline-hover: rgba(255, 255, 255, 0.06);
      --cc-shadow: 0 16px 48px -12px rgba(0, 0, 0, 0.5);
      --cc-radius: 16px;
      --cc-font: 'DM Sans', system-ui, -apple-system, sans-serif;
    }

    /* Reset styles for the banner scope */
    .cc-scope *, .cc-scope *::before, .cc-scope *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: var(--cc-font);
    }

    /* Banner Container */
    .cc-banner {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 420px;
      max-width: calc(100vw - 48px);
      background: var(--cc-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--cc-border);
      border-radius: var(--cc-radius);
      padding: 24px;
      box-shadow: var(--cc-shadow);
      z-index: 99999;
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.4s ease, transform 0.4s ease;
      display: none;
    }

    .cc-banner.cc-show {
      display: block;
      opacity: 1;
      transform: translateY(0);
    }

    .cc-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--cc-text-main);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cc-description {
      font-size: 14px;
      line-height: 1.6;
      color: var(--cc-text-muted);
      margin-bottom: 20px;
    }

    .cc-description a {
      color: #3ea6e8;
      text-decoration: none;
      transition: color 0.2s;
    }

    .cc-description a:hover {
      text-decoration: underline;
      color: #4fb7f9;
    }

    .cc-btn-group {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    /* Buttons */
    .cc-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 16px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
      white-space: nowrap;
      text-decoration: none;
    }

    .cc-btn-primary {
      background: var(--cc-primary-gradient);
      color: #ffffff;
      flex: 1 1 auto;
      box-shadow: 0 4px 12px rgba(62, 166, 232, 0.2);
    }

    .cc-btn-primary:hover {
      background: var(--cc-primary-hover);
      transform: translateY(-1px);
      box-shadow: 0 8px 16px rgba(62, 166, 232, 0.3);
    }

    .cc-btn-outline {
      background: transparent;
      color: var(--cc-text-main);
      border: 1px solid var(--cc-btn-outline-border);
      flex: 1 1 auto;
    }

    .cc-btn-outline:hover {
      background: var(--cc-btn-outline-hover);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .cc-btn-link {
      background: transparent;
      color: var(--cc-text-muted);
      font-size: 13px;
      font-weight: 500;
      padding: 10px 8px;
      flex: 1 1 100%;
      text-align: center;
    }

    .cc-btn-link:hover {
      color: var(--cc-text-main);
    }

    /* Preferences Modal Wrapper */
    .cc-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(2, 6, 23, 0.65);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
      padding: 16px;
    }

    .cc-modal-overlay.cc-show {
      opacity: 1;
      pointer-events: auto;
    }

    .cc-modal {
      background: var(--cc-bg);
      border: 1px solid var(--cc-border);
      border-radius: var(--cc-radius);
      width: 100%;
      max-width: 540px;
      box-shadow: var(--cc-shadow);
      transform: scale(0.95) translateY(10px);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }

    .cc-modal-overlay.cc-show .cc-modal {
      transform: scale(1) translateY(0);
    }

    .cc-modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--cc-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .cc-modal-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--cc-text-main);
    }

    .cc-modal-close {
      background: transparent;
      border: none;
      color: var(--cc-text-muted);
      font-size: 28px;
      line-height: 1;
      cursor: pointer;
      transition: color 0.2s;
    }

    .cc-modal-close:hover {
      color: var(--cc-text-main);
    }

    .cc-modal-body {
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .cc-preference-item {
      display: flex;
      gap: 16px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--cc-border);
      border-radius: 12px;
      padding: 16px;
      transition: background-color 0.2s;
    }

    .cc-preference-item:hover {
      background-color: rgba(255, 255, 255, 0.04);
    }

    .cc-preference-info {
      flex: 1;
    }

    .cc-pref-label-container {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }

    .cc-pref-label {
      font-size: 15px;
      font-weight: 600;
      color: var(--cc-text-main);
    }

    .cc-badge-required {
      font-size: 11px;
      font-weight: 600;
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      padding: 2px 8px;
      border-radius: 9999px;
    }

    .cc-pref-desc {
      font-size: 13px;
      line-height: 1.5;
      color: var(--cc-text-muted);
    }

    /* Premium Toggle Switch */
    .cc-switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .cc-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .cc-slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background-color: rgba(255, 255, 255, 0.15);
      transition: .3s;
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .cc-slider::before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 3px;
      bottom: 3px;
      background-color: #ffffff;
      transition: .3s;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    input:checked + .cc-slider {
      background: var(--cc-primary-gradient);
    }

    input:focus-visible + .cc-slider {
      outline: 2px solid #3ea6e8;
      outline-offset: 2px;
    }

    input:checked + .cc-slider::before {
      transform: translateX(20px);
    }

    input:disabled + .cc-slider {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .cc-modal-footer {
      padding: 20px 24px;
      border-top: 1px solid var(--cc-border);
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    /* Floating Toggle Button */
    .cc-trigger {
      position: fixed;
      bottom: 24px;
      left: 24px;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: var(--cc-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--cc-border);
      box-shadow: var(--cc-shadow);
      z-index: 99998;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--cc-text-muted);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0;
      transform: scale(0.8);
      pointer-events: none;
    }

    .cc-trigger.cc-show {
      opacity: 1;
      transform: scale(1);
      pointer-events: auto;
    }

    .cc-trigger:hover {
      color: var(--cc-text-main);
      transform: translateY(-2px);
      border-color: rgba(62, 166, 232, 0.4);
      box-shadow: 0 8px 24px rgba(62, 166, 232, 0.2);
    }

    .cc-trigger svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .cc-trigger:hover svg {
      transform: rotate(15deg);
    }

    /* Tooltip */
    .cc-trigger::after {
      content: "Cookie Settings";
      position: absolute;
      left: 58px;
      background: #0f172a;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transform: translateX(-10px);
      transition: all 0.2s;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: var(--cc-shadow);
    }

    .cc-trigger:hover::after {
      opacity: 1;
      transform: translateX(0);
    }

    /* Responsive adjustments */
    @media (max-width: 480px) {
      .cc-banner {
        bottom: 16px;
        right: 16px;
        left: 16px;
        max-width: none;
        width: auto;
        padding: 16px;
      }
      .cc-btn {
        flex: 1 1 100%;
      }
      .cc-modal-footer {
        flex-direction: column;
      }
      .cc-modal-footer .cc-btn {
        width: 100%;
      }
      .cc-trigger {
        bottom: 16px;
        left: 16px;
        width: 40px;
        height: 40px;
      }
      .cc-trigger::after {
        display: none; /* Hide tooltip on small mobile */
      }
    }
  `;
  document.head.appendChild(style);

  // 2. Inject HTML Elements
  const container = document.createElement('div');
  container.className = 'cc-scope';
  container.innerHTML = `
    <!-- Cookie Banner -->
    <div id="hyphene-cookie-banner" class="cc-banner" role="region" aria-label="Cookie consent banner">
      <div class="cc-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3ea6e8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2a7 7 0 0 0-7 7c0 1.25.4 2.45 1.1 3.48"/>
          <path d="M16.24 7.76a3 3 0 0 1-4.24 4.24"/>
          <circle cx="9" cy="9" r="1" fill="currentColor"/>
          <circle cx="15" cy="15" r="1" fill="currentColor"/>
          <circle cx="10" cy="15" r="1" fill="currentColor"/>
        </svg>
        Cookie Consent
      </div>
      <div class="cc-description">
        We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. Read our <a href="/privacy">Privacy Policy</a> for more details.
      </div>
      <div class="cc-btn-group">
        <button id="cc-btn-accept" class="cc-btn cc-btn-primary">Accept All</button>
        <button id="cc-btn-decline" class="cc-btn cc-btn-outline">Decline All</button>
        <button id="cc-btn-customize" class="cc-btn cc-btn-link">Customize Preferences</button>
      </div>
    </div>

    <!-- Preferences Modal -->
    <div id="hyphene-cookie-modal-overlay" class="cc-modal-overlay" aria-hidden="true" role="dialog" aria-labelledby="cc-modal-title">
      <div class="cc-modal" id="hyphene-cookie-modal">
        <div class="cc-modal-header">
          <h2 class="cc-modal-title" id="cc-modal-title">Cookie Preferences</h2>
          <button class="cc-modal-close" id="cc-modal-close" aria-label="Close modal">&times;</button>
        </div>
        <div class="cc-modal-body">
          <!-- Essential -->
          <div class="cc-preference-item">
            <div class="cc-preference-info">
              <div class="cc-pref-label-container">
                <span class="cc-pref-label">Essential Cookies</span>
                <span class="cc-badge-required">Always Active</span>
              </div>
              <div class="cc-pref-desc">Necessary for the website to function, such as security, user session handling, and remembering consent choices.</div>
            </div>
            <label class="cc-switch">
              <input type="checkbox" id="cc-pref-essential" checked disabled>
              <span class="cc-slider"></span>
            </label>
          </div>

          <!-- Analytics -->
          <div class="cc-preference-item">
            <div class="cc-preference-info">
              <div class="cc-pref-label-container">
                <span class="cc-pref-label">Analytics & Statistics</span>
              </div>
              <div class="cc-pref-desc">Help us understand how visitors interact with the site, compile performance reports, and resolve errors to improve our platform.</div>
            </div>
            <label class="cc-switch">
              <input type="checkbox" id="cc-pref-analytics" checked>
              <span class="cc-slider"></span>
            </label>
          </div>

          <!-- Marketing -->
          <div class="cc-preference-item">
            <div class="cc-preference-info">
              <div class="cc-pref-label-container">
                <span class="cc-pref-label">Marketing & Targeting</span>
              </div>
              <div class="cc-pref-desc">Used to deliver more relevant advertisements, limit the frequency of ads shown to you, and measure campaign effectiveness.</div>
            </div>
            <label class="cc-switch">
              <input type="checkbox" id="cc-pref-marketing" checked>
              <span class="cc-slider"></span>
            </label>
          </div>
        </div>
        <div class="cc-modal-footer">
          <button id="cc-btn-save-pref" class="cc-btn cc-btn-primary">Save Preferences</button>
        </div>
      </div>
    </div>

    <!-- Floating Toggle Settings Button -->
    <button id="hyphene-cookie-trigger" class="cc-trigger" aria-label="Manage cookie preferences">
      <svg viewBox="0 0 24 24">
        <path d="M12 3a9 9 0 0 0-9 9c0 4.14 2.8 7.62 6.6 8.65.25.07.4-.15.4-.35v-1.85c0-.85-.3-1.48-.65-1.8 2.2-.25 4.5-1.1 4.5-4.9 0-1.07-.38-1.96-1-2.65.1-.25.43-1.25-.1-2.6 0 0-.82-.27-2.7 1a9.3 9.3 0 0 0-5 0c-1.88-1.27-2.7-1-2.7-1-.53 1.35-.2 2.35-.1 2.6-.62.7-1 1.58-1 2.65 0 3.78 2.28 4.65 4.48 4.9-.28.25-.53.75-.62 1.45-.55.25-1.95.68-2.82-.8-.17-.3-.54-.53-.87-.55-.65-.02-.05.4.03.55.45.2 1 .95 1.15 1.38.3.9 1.05 1.25 1.4 1.2.02.05.02.1.02.15v2.85c0 .2.15.42.4.35 3.8-1.03 6.6-4.5 6.6-8.65a9 9 0 0 0-9-9z"/>
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5zm0-4a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5zm3-3a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5z"/>
      </svg>
    </button>
  `;
  document.body.appendChild(container);

  // 3. Elements Selection
  const banner = document.getElementById('hyphene-cookie-banner');
  const modalOverlay = document.getElementById('hyphene-cookie-modal-overlay');
  const modalClose = document.getElementById('cc-modal-close');
  const triggerBtn = document.getElementById('hyphene-cookie-trigger');
  
  const btnAccept = document.getElementById('cc-btn-accept');
  const btnDecline = document.getElementById('cc-btn-decline');
  const btnCustomize = document.getElementById('cc-btn-customize');
  const btnSavePref = document.getElementById('cc-btn-save-pref');

  const prefAnalytics = document.getElementById('cc-pref-analytics');
  const prefMarketing = document.getElementById('cc-pref-marketing');

  // Helper cookie functions
  function setCookie(name, value, days) {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax' + secure;
  }

  function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  }

  // Hide the banner
  function hideBanner() {
    banner.classList.remove('cc-show');
    setTimeout(() => {
      banner.style.display = 'none';
    }, 400);
  }

  // Show preferences modal
  let previouslyFocusedElement = null;
  function openModal() {
    previouslyFocusedElement = document.activeElement;
    modalOverlay.classList.add('cc-show');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Set focus to the modal title or close button
    setTimeout(() => {
      modalClose.focus();
    }, 100);
  }

  // Close preferences modal
  function closeModal() {
    modalOverlay.classList.remove('cc-show');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    
    // Return focus
    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus();
    }
  }

  // Save consent
  function saveConsent(preferences) {
    const value = JSON.stringify(preferences);
    setCookie(COOKIE_NAME, value, COOKIE_EXPIRY_DAYS);
    
    hideBanner();
    closeModal();
    
    // Show floating settings toggle button
    triggerBtn.classList.add('cc-show');

    // Dispatch custom event for analytical/marketing tags to listen to
    const event = new CustomEvent('cookieConsentChanged', { detail: preferences });
    document.dispatchEvent(event);
  }

  // 4. Bind Action Listeners
  btnAccept.addEventListener('click', () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true
    });
  });

  btnDecline.addEventListener('click', () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false
    });
  });

  btnCustomize.addEventListener('click', () => {
    // Sync checkbox values before opening
    const current = getCookie(COOKIE_NAME);
    if (current) {
      try {
        const pref = JSON.parse(current);
        prefAnalytics.checked = !!pref.analytics;
        prefMarketing.checked = !!pref.marketing;
      } catch (e) {}
    }
    openModal();
  });

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  btnSavePref.addEventListener('click', () => {
    saveConsent({
      essential: true,
      analytics: prefAnalytics.checked,
      marketing: prefMarketing.checked
    });
  });

  triggerBtn.addEventListener('click', () => {
    // Load saved preferences into modal
    const current = getCookie(COOKIE_NAME);
    if (current) {
      try {
        const pref = JSON.parse(current);
        prefAnalytics.checked = !!pref.analytics;
        prefMarketing.checked = !!pref.marketing;
      } catch (e) {}
    }
    openModal();
  });

  // Keyboard accessibility
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('cc-show')) {
      closeModal();
    }
  });

  // Trap focus inside preferences modal
  const focusableElementsSelector = 'button, [href], input, select, textarea, [tabindex]:not([-tabindex="-1"])';
  modalOverlay.addEventListener('keydown', function(e) {
    if (e.key !== 'Tab') return;
    
    const focusableElements = modalOverlay.querySelectorAll(focusableElementsSelector);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) { // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else { // Tab
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  });

  // 5. Initialize Banner State on Page Load
  const consentCookie = getCookie(COOKIE_NAME);
  if (!consentCookie) {
    // Show banner after 1 second delay
    setTimeout(() => {
      banner.style.display = 'block';
      // Force layout calculation for transition to apply
      banner.offsetHeight; 
      banner.classList.add('cc-show');
    }, 1000);
  } else {
    // Show floating settings trigger immediately
    triggerBtn.classList.add('cc-show');
    
    // Dispatch immediate event for analytics loading scripts
    try {
      const pref = JSON.parse(consentCookie);
      const event = new CustomEvent('cookieConsentChanged', { detail: pref });
      document.dispatchEvent(event);
    } catch (e) {}
  }
})();
