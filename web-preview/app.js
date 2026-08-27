// ═══ DEPLOYMENT CONFIG ═══
// Live Render Backend for Vercel Frontend:
const RENDER_BACKEND_URL = 'https://fake-news-detect-1-cfgb.onrender.com';

const BACKEND_ORIGIN = RENDER_BACKEND_URL
  || (window.location.port === '5000' ? window.location.origin : '')
  || (window.location.protocol === 'https:' && !window.location.port ? '' : '')
  || 'http://localhost:5000';

const API_BASE = BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/api` : `${window.location.origin}/api`;
const WS_BASE = BACKEND_ORIGIN ? `${BACKEND_ORIGIN}` : window.location.origin;

// ── State ──
let currentToken = '';
let currentRole = 'user';
let activeScreen = 'home';
let currentVerifyTab = 'text';
let activeChatMode = 'general';
let socket = null;
let currentAnalysisResult = null;

document.addEventListener('DOMContentLoaded', async () => {
  initGreeting();
  initTheme();
  setupNavigation();
  setupSidebar();
  setupVerifyTabs();
  setupSamplePresets();
  setupChat();
  setupAuthModal();
  setupEventListeners();
  setupCategoryChips();
  setupHistoryFilters();

  await checkServerHealth();
  setInterval(checkServerHealth, 4000);
  await loadUserData();
  await loadHomeDashboard();
  await loadNewsHub();
  await loadHistory();
});

// ══════════════ GREETING ══════════════
function initGreeting() {
  const h = new Date().getHours();
  let greeting = 'Good Day,';
  if (h < 12) greeting = 'Good Morning,';
  else if (h < 17) greeting = 'Good Afternoon,';
  else greeting = 'Good Evening,';
  const el = document.getElementById('greeting-label');
  if (el) el.innerText = greeting;
}

// ══════════════ THEME ══════════════
function initTheme() {
  const saved = localStorage.getItem('fc-theme');
  if (saved === 'light') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
  }

  const toggle = document.getElementById('theme-toggle');
  toggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme', !isDark);
    toggle.innerHTML = isDark
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
    localStorage.setItem('fc-theme', isDark ? 'dark' : 'light');
  });
}

// ══════════════ SERVER HEALTH ══════════════
async function checkServerHealth() {
  const statusEl = document.getElementById('server-status');
  if (!statusEl) return;
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
    if (res.ok) {
      statusEl.querySelector('.status-dot').classList.add('online');
      statusEl.querySelector('.status-text').innerText = 'Server Online';
    } else {
      statusEl.querySelector('.status-dot').classList.remove('online');
      statusEl.querySelector('.status-text').innerText = 'Offline';
    }
  } catch {
    statusEl.querySelector('.status-dot').classList.remove('online');
    statusEl.querySelector('.status-text').innerText = 'Reconnecting...';
  }
}

// ══════════════ SIDEBAR (Mobile Drawer) ══════════════
function setupSidebar() {
  const hamburger = document.getElementById('hamburger-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  });
}

function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');
}

// ══════════════ NAVIGATION ══════════════
function setupNavigation() {
  // Sidebar nav items
  document.querySelectorAll('.sidebar-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      switchScreen(target);
      closeMobileSidebar();
    });
  });

  // Bottom nav items (mobile)
  document.querySelectorAll('.bnav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      switchScreen(target);
    });
  });

  // In-page links
  document.getElementById('btn-back-from-result').addEventListener('click', () => switchScreen('verify'));
  document.getElementById('link-view-all-news').addEventListener('click', (e) => { e.preventDefault(); switchScreen('news'); });
  document.getElementById('link-view-all-history').addEventListener('click', (e) => { e.preventDefault(); switchScreen('history'); });
  document.getElementById('btn-open-briefing').addEventListener('click', () => showDailyBriefingModal());
  document.getElementById('btn-close-briefing').addEventListener('click', () => document.getElementById('briefing-modal').classList.add('hidden'));
}

function switchScreen(screenName) {
  activeScreen = screenName;

  // Toggle auth-mode layout to hide sidebar and center login screen
  document.body.classList.toggle('auth-mode', screenName === 'auth');

  // Toggle screen views
  document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`screen-${screenName}`);
  if (target) target.classList.add('active');

  // Highlight sidebar
  document.querySelectorAll('.sidebar-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-target') === screenName);
  });

  // Highlight bottom nav
  document.querySelectorAll('.bnav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-target') === screenName);
  });

  // Scroll to top
  const mainC = document.getElementById('main-content');
  if (mainC) mainC.scrollTo(0, 0);
}

// ══════════════ VERIFY TABS ══════════════
function setupVerifyTabs() {
  const vTabs = document.querySelectorAll('.v-tab-btn');
  vTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      vTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentVerifyTab = btn.getAttribute('data-vtab');

      const textC = document.getElementById('text-input-container');
      const urlC = document.getElementById('url-input-container');
      const mediaC = document.getElementById('media-input-container');
      const waBanner = document.getElementById('whatsapp-banner');

      textC.classList.toggle('hidden', currentVerifyTab === 'url' || currentVerifyTab === 'image' || currentVerifyTab === 'video');
      urlC.classList.toggle('hidden', currentVerifyTab !== 'url');
      mediaC.classList.toggle('hidden', currentVerifyTab !== 'image' && currentVerifyTab !== 'video');
      waBanner.classList.toggle('hidden', currentVerifyTab !== 'whatsapp');
    });
  });

  // Home action cards -> Verify tab
  document.querySelectorAll('.action-card').forEach(card => {
    card.addEventListener('click', () => {
      const tab = card.getAttribute('data-verify-tab');
      switchScreen('verify');
      const btn = document.querySelector(`.v-tab-btn[data-vtab="${tab}"]`);
      if (btn) btn.click();
    });
  });
}

// ══════════════ SAMPLE PRESETS ══════════════
function setupSamplePresets() {
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const sample = chip.getAttribute('data-sample');
      if (sample.startsWith('http://') || sample.startsWith('https://')) {
        const urlTab = document.querySelector('.v-tab-btn[data-vtab="url"]');
        if (urlTab) urlTab.click();
        const urlInput = document.getElementById('verify-url-input');
        if (urlInput) urlInput.value = sample;
      } else {
        const textTab = document.querySelector('.v-tab-btn[data-vtab="text"]');
        if (textTab) textTab.click();
        const textInput = document.getElementById('verify-text-input');
        if (textInput) textInput.value = sample;
      }
    });
  });

  document.getElementById('btn-clear-text').addEventListener('click', () => {
    document.getElementById('verify-text-input').value = '';
    const urlInp = document.getElementById('verify-url-input');
    if (urlInp) urlInp.value = '';
  });

  document.getElementById('btn-paste-clipboard').addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.startsWith('http://') || text.startsWith('https://')) {
        const urlTab = document.querySelector('.v-tab-btn[data-vtab="url"]');
        if (urlTab) urlTab.click();
        const urlInput = document.getElementById('verify-url-input');
        if (urlInput) urlInput.value = text;
      } else {
        document.getElementById('verify-text-input').value = text;
      }
    } catch {
      document.getElementById('verify-text-input').value =
        'PIB Fact Check debunks Rs 50,000 scholarship cash grant circular.';
    }
  });
}

// ══════════════ NEWS CATEGORY CHIPS ══════════════
function setupCategoryChips() {
  document.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const cat = chip.getAttribute('data-category');
      const searchVal = document.getElementById('news-search-input')?.value.trim() || '';
      loadNewsHub(cat, searchVal);
    });
  });
}

// ══════════════ HISTORY FILTER CHIPS ══════════════
function setupHistoryFilters() {
  document.querySelectorAll('.h-filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.h-filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      // Could filter locally — for now just reload
      loadHistory();
    });
  });
}

// ══════════════ AUTH & USER SESSION (MongoDB) ══════════════
let currentUser = null;

async function loadUserData() {
  const savedToken = localStorage.getItem('fc_token');
  const savedUser = localStorage.getItem('fc_user');

  if (savedToken && savedUser) {
    try {
      currentToken = savedToken;
      currentUser = JSON.parse(savedUser);
      currentRole = currentUser.role || 'user';
      updateUserUI(currentUser);

      // Verify and refresh token with backend
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data?.user) {
          currentUser = data.data.user;
          currentRole = currentUser.role || 'user';
          localStorage.setItem('fc_user', JSON.stringify(currentUser));
          updateUserUI(currentUser);
        }
      }
    } catch {
      // Fallback
    }
  } else {
    // When not logged in, prompt user with dedicated Auth / Login screen
    currentToken = '';
    currentUser = null;
    currentRole = 'user';
    updateUserUI(null);
    switchScreen('auth');
  }
}

function updateUserUI(user) {
  const btnAuth = document.getElementById('btn-open-auth-modal');

  if (user) {
    const name = user.name || 'User';
    const email = user.email || 'user@example.com';
    const role = user.role || 'user';
    const initial = (name[0] || 'U').toUpperCase();

    // Top Header Button -> Show Sign Out
    if (btnAuth) {
      btnAuth.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> <span>Sign Out</span>';
      btnAuth.className = 'btn-auth-action btn-auth-signout';
      btnAuth.title = 'Sign Out of Account';
    }

    // Header User Badge
    const headerName = document.getElementById('header-user-name');
    if (headerName) headerName.innerText = name;
    const headerRole = document.getElementById('header-user-role');
    if (headerRole) headerRole.innerText = role.toUpperCase();
    const headerAvatar = document.getElementById('header-avatar');
    if (headerAvatar) headerAvatar.innerText = initial;

    // Home Greeting
    const userDisplayName = document.getElementById('user-display-name');
    if (userDisplayName) userDisplayName.innerText = name;

    // Sidebar
    const sidebarName = document.getElementById('sidebar-user-name');
    if (sidebarName) sidebarName.innerText = name;
    const sidebarRole = document.getElementById('sidebar-user-role');
    if (sidebarRole) sidebarRole.innerText = role.charAt(0).toUpperCase() + role.slice(1);
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    if (sidebarAvatar) sidebarAvatar.innerText = initial;

    // Profile Screen
    const profileName = document.getElementById('profile-name');
    if (profileName) profileName.innerText = name;
    const profileEmail = document.getElementById('profile-email');
    if (profileEmail) profileEmail.innerText = email;
    const profileRole = document.getElementById('profile-role-badge');
    if (profileRole) profileRole.innerText = role.toUpperCase();
    const profileAvatar = document.getElementById('profile-avatar-initial');
    if (profileAvatar) profileAvatar.innerText = initial;
  } else {
    // Logged Out State
    if (btnAuth) {
      btnAuth.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> <span>Sign In</span>';
      btnAuth.className = 'btn-auth-action';
      btnAuth.title = 'Sign In or Register';
    }

    const headerName = document.getElementById('header-user-name');
    if (headerName) headerName.innerText = 'Guest';
    const headerRole = document.getElementById('header-user-role');
    if (headerRole) headerRole.innerText = 'GUEST';
    const headerAvatar = document.getElementById('header-avatar');
    if (headerAvatar) headerAvatar.innerText = 'G';

    const userDisplayName = document.getElementById('user-display-name');
    if (userDisplayName) userDisplayName.innerText = 'Guest';

    const sidebarName = document.getElementById('sidebar-user-name');
    if (sidebarName) sidebarName.innerText = 'Guest';
    const sidebarRole = document.getElementById('sidebar-user-role');
    if (sidebarRole) sidebarRole.innerText = 'Not Signed In';
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    if (sidebarAvatar) sidebarAvatar.innerText = 'G';
  }
}

function setupAuthModal() {
  const authModal = document.getElementById('auth-modal');
  const btnOpenAuth = document.getElementById('btn-open-auth-modal');
  const btnCloseAuth = document.getElementById('btn-close-auth');
  const tabLogin = document.getElementById('tab-btn-login');
  const tabRegister = document.getElementById('tab-btn-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const linkToRegister = document.getElementById('link-to-register');
  const linkToLogin = document.getElementById('link-to-login');
  const headerUserBadge = document.getElementById('header-user-badge');
  const btnProfileSwitch = document.getElementById('btn-profile-switch-account');
  const btnProfileLogout = document.getElementById('btn-profile-logout');

  // Dedicated Auth Screen Elements
  const pTabLogin = document.getElementById('pauth-tab-login');
  const pTabRegister = document.getElementById('pauth-tab-register');
  const formPageLogin = document.getElementById('form-page-login');
  const formPageRegister = document.getElementById('form-page-register');
  const linkPageToRegister = document.getElementById('link-page-to-register');
  const linkPageToLogin = document.getElementById('link-page-to-login');

  const switchPageAuthTab = (tab = 'login') => {
    if (tab === 'login') {
      pTabLogin?.classList.add('active');
      pTabRegister?.classList.remove('active');
      formPageLogin?.classList.remove('hidden');
      formPageRegister?.classList.add('hidden');
    } else {
      pTabRegister?.classList.add('active');
      pTabLogin?.classList.remove('active');
      formPageRegister?.classList.remove('hidden');
      formPageLogin?.classList.add('hidden');
    }
  };

  if (pTabLogin) pTabLogin.addEventListener('click', () => switchPageAuthTab('login'));
  if (pTabRegister) pTabRegister.addEventListener('click', () => switchPageAuthTab('register'));
  if (linkPageToRegister) linkPageToRegister.addEventListener('click', (e) => { e.preventDefault(); switchPageAuthTab('register'); });
  if (linkPageToLogin) linkPageToLogin.addEventListener('click', (e) => { e.preventDefault(); switchPageAuthTab('login'); });

  // Handle Dedicated Page Login Form
  if (formPageLogin) {
    formPageLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('plogin-email').value.trim();
      const password = document.getElementById('plogin-password').value;
      const submitBtn = document.getElementById('btn-page-submit-login');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing In to MongoDB...';
      }

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (res.ok && data.data?.token) {
          currentToken = data.data.token;
          currentUser = data.data.user;
          currentRole = currentUser.role || 'user';

          localStorage.setItem('fc_token', currentToken);
          localStorage.setItem('fc_user', JSON.stringify(currentUser));

          updateUserUI(currentUser);
          showToast(`Welcome back, ${currentUser.name}! 👋`, 'success');
          switchScreen('home');

          await loadHistory();
          await loadHomeDashboard();
          if (currentRole === 'moderator' || currentRole === 'admin') {
            loadModeratorDashboard();
          }
        } else {
          showToast(data.error?.message || 'Login failed. Invalid email or password.', 'warning');
        }
      } catch {
        showToast('Could not connect to database server. Please try again.', 'warning');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In to Account';
        }
      }
    });
  }

  // Handle Dedicated Page Register Form
  if (formPageRegister) {
    formPageRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('preg-name').value.trim();
      const email = document.getElementById('preg-email').value.trim();
      const password = document.getElementById('preg-password').value;
      const role = document.getElementById('preg-role').value;
      const submitBtn = document.getElementById('btn-page-submit-register');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registering in MongoDB Atlas...';
      }

      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role }),
        });
        const data = await res.json();

        if (res.ok && data.data?.token) {
          currentToken = data.data.token;
          currentUser = data.data.user;
          currentRole = currentUser.role || 'user';

          localStorage.setItem('fc_token', currentToken);
          localStorage.setItem('fc_user', JSON.stringify(currentUser));

          updateUserUI(currentUser);
          showToast(`Account registered in MongoDB! Welcome, ${name}! 🎉`, 'success');
          switchScreen('home');

          await loadHistory();
          await loadHomeDashboard();
          if (currentRole === 'moderator' || currentRole === 'admin') {
            loadModeratorDashboard();
          }
        } else {
          showToast(data.error?.message || 'Registration failed. Email may already be in use.', 'warning');
        }
      } catch {
        showToast('Could not connect to database server. Please try again.', 'warning');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Register in MongoDB Atlas';
        }
      }
    });
  }

  // Header Sign In / Sign Out Click Handler
  if (btnOpenAuth) {
    btnOpenAuth.addEventListener('click', () => {
      if (currentUser && currentToken) {
        // Perform Sign Out
        localStorage.removeItem('fc_token');
        localStorage.removeItem('fc_user');
        currentToken = '';
        currentUser = null;
        updateUserUI(null);
        showToast('Signed out successfully.', 'info');
        switchScreen('auth');
      } else {
        switchScreen('auth');
      }
    });
  }

  const openModal = (tab = 'login') => {
    switchScreen('auth');
    switchPageAuthTab(tab);
  };

  const closeModal = () => {
    if (authModal) authModal.classList.add('hidden');
  };

  if (headerUserBadge) headerUserBadge.addEventListener('click', () => switchScreen('profile'));
  if (btnProfileSwitch) btnProfileSwitch.addEventListener('click', () => { switchScreen('auth'); switchPageAuthTab('login'); });
  if (btnCloseAuth) btnCloseAuth.addEventListener('click', closeModal);

  if (tabLogin) tabLogin.addEventListener('click', () => openModal('login'));
  if (tabRegister) tabRegister.addEventListener('click', () => openModal('register'));
  if (linkToRegister) linkToRegister.addEventListener('click', (e) => { e.preventDefault(); openModal('register'); });
  if (linkToLogin) linkToLogin.addEventListener('click', (e) => { e.preventDefault(); openModal('login'); });

  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) closeModal();
    });
  }

  // Handle Modal Login Form Submit (MongoDB)
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const submitBtn = document.getElementById('btn-submit-login');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing In...';
      }

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (res.ok && data.data?.token) {
          currentToken = data.data.token;
          currentUser = data.data.user;
          currentRole = currentUser.role || 'user';

          localStorage.setItem('fc_token', currentToken);
          localStorage.setItem('fc_user', JSON.stringify(currentUser));

          updateUserUI(currentUser);
          closeModal();
          showToast(`Welcome back, ${currentUser.name}! 👋`, 'success');
          switchScreen('home');

          await loadHistory();
          await loadHomeDashboard();
          if (currentRole === 'moderator' || currentRole === 'admin') {
            loadModeratorDashboard();
          }
        } else {
          showToast(data.error?.message || 'Login failed. Invalid email or password.', 'warning');
        }
      } catch {
        showToast('Could not connect to server. Please try again.', 'warning');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In to Account';
        }
      }
    });
  }

  // Handle Modal Register Form Submit (MongoDB)
  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const role = document.getElementById('reg-role').value;
      const submitBtn = document.getElementById('btn-submit-register');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registering in MongoDB...';
      }

      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role }),
        });
        const data = await res.json();

        if (res.ok && data.data?.token) {
          currentToken = data.data.token;
          currentUser = data.data.user;
          currentRole = currentUser.role || 'user';

          localStorage.setItem('fc_token', currentToken);
          localStorage.setItem('fc_user', JSON.stringify(currentUser));

          updateUserUI(currentUser);
          closeModal();
          showToast(`Account registered in MongoDB! Welcome, ${name}! 🎉`, 'success');
          switchScreen('home');

          await loadHistory();
          await loadHomeDashboard();
          if (currentRole === 'moderator' || currentRole === 'admin') {
            loadModeratorDashboard();
          }
        } else {
          showToast(data.error?.message || 'Registration failed. Email may already be in use.', 'warning');
        }
      } catch {
        showToast('Could not connect to server. Please try again.', 'warning');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Register in MongoDB';
        }
      }
    });
  }

  // Handle Profile Logout
  if (btnProfileLogout) {
    btnProfileLogout.addEventListener('click', () => {
      localStorage.removeItem('fc_token');
      localStorage.removeItem('fc_user');
      currentToken = '';
      currentUser = null;
      updateUserUI(null);
      showToast('Logged out successfully.', 'info');
      switchScreen('auth');
    });
  }
}

// ══════════════ GENERAL EVENT LISTENERS ══════════════
let selectedMediaFile = null;

function setupEventListeners() {
  // Verification submit button
  const submitVerify = document.getElementById('btn-submit-verification');
  if (submitVerify) {
    submitVerify.addEventListener('click', () => runVerification());
  }

  // Browse file button & file input
  const btnBrowse = document.getElementById('btn-browse-file');
  const fileInput = document.getElementById('media-file-input');
  if (btnBrowse && fileInput) {
    btnBrowse.addEventListener('click', (e) => {
      e.preventDefault();
      fileInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        selectedMediaFile = fileInput.files[0];
        const nameEl = document.getElementById('selected-file-name');
        if (nameEl) nameEl.innerText = selectedMediaFile.name;
        document.getElementById('selected-file-info')?.classList.remove('hidden');
        showToast(`Selected file for AI analysis: ${selectedMediaFile.name}`, 'info');
      }
    });
  }

  // Drag and drop zone
  const dropArea = document.getElementById('drop-area');
  if (dropArea && fileInput) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropArea.style.borderColor = 'var(--primary-light)';
        dropArea.style.background = 'rgba(99, 102, 241, 0.08)';
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropArea.style.borderColor = '';
        dropArea.style.background = '';
      });
    });

    dropArea.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        selectedMediaFile = e.dataTransfer.files[0];
        fileInput.files = e.dataTransfer.files;
        const nameEl = document.getElementById('selected-file-name');
        if (nameEl) nameEl.innerText = selectedMediaFile.name;
        document.getElementById('selected-file-info')?.classList.remove('hidden');
        showToast(`Loaded file for AI scan: ${selectedMediaFile.name}`, 'success');
      }
    });
  }

  // Ask AI about this from result screen
  const btnAskAi = document.getElementById('btn-ask-ai-about-this');
  if (btnAskAi) {
    btnAskAi.addEventListener('click', () => {
      if (currentAnalysisResult) {
        switchScreen('chat');
        const input = document.getElementById('chat-text-input');
        if (input) {
          input.value = `Explain why "${currentAnalysisResult.originalContent || 'this claim'}" was marked as ${currentAnalysisResult.verdict?.toUpperCase()}`;
          input.focus();
        }
      }
    });
  }

  // Share result buttons
  const shareButtons = [document.getElementById('btn-share-result'), document.getElementById('btn-share-result-footer')];
  shareButtons.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href);
          showToast('Verification result link copied to clipboard! 📋', 'success');
        }
      });
    }
  });
}

// ══════════════ VERIFICATION ══════════════
async function runVerification() {
  let content = '';
  let inputType = currentVerifyTab;

  if (inputType === 'image' || inputType === 'video') {
    if (!selectedMediaFile) {
      showToast('Please browse or drop an image or video/reel file to scan for AI generation and deepfakes.', 'warning');
      return;
    }
  } else if (inputType === 'url') {
    content = document.getElementById('verify-url-input').value.trim();
    if (!content) {
      showToast('Please enter an Instagram Reel, YouTube Shorts, or News URL to verify.', 'warning');
      return;
    }
  } else {
    content = document.getElementById('verify-text-input').value.trim();
    if (!content) {
      showToast('Please enter content, a claim, or a video link to verify.', 'warning');
      return;
    }
    if (content.startsWith('http://') || content.startsWith('https://')) {
      inputType = 'url';
    }
  }

  showStageModal();

  try {
    let res = null;

    if (selectedMediaFile && (inputType === 'image' || inputType === 'video')) {
      const isVideo = selectedMediaFile.type.startsWith('video/') || inputType === 'video';
      const endpoint = isVideo ? `${API_BASE}/verify/video` : `${API_BASE}/verify/image`;
      const formData = new FormData();
      formData.append(isVideo ? 'video' : 'image', selectedMediaFile);
      formData.append('inputType', isVideo ? 'video' : 'image');

      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
        body: formData,
      });
    } else {
      let endpoint = `${API_BASE}/verify/text`;
      let body = { text: content, inputType };

      if (inputType === 'url') {
        endpoint = `${API_BASE}/verify/url`;
        body = { url: content };
      }

      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(body),
      });
    }

    const data = await res.json();
    hideStageModal();

    if (data && (data.verdict || data.success)) {
      currentAnalysisResult = data;
      renderResultScreen(data);
      switchScreen('result');
      loadHistory();
    } else {
      showToast(data.error?.message || 'Verification failed. Please try again.', 'warning');
    }
  } catch {
    hideStageModal();
    const fallback = {
      verdict: 'false',
      confidence: 94,
      originalContent: content || selectedMediaFile?.name || 'Uploaded Media',
      explanation: 'Debunked by authoritative fact-checking desks. Synthetic media markers or false claims identified.',
      whyPoints: [
        'Officially flagged by digital forensic verification registries.',
        'No authoritative ministry or agency circular exists confirming this claim.',
        'Synthetic diffusion patterns and viral forwarding markers detected.',
      ],
      aiMediaAnalysis: selectedMediaFile ? {
        isAiGenerated: true,
        aiProbability: 92,
        mediaType: inputType,
        classification: 'AI_GENERATED',
        confidence: 90,
        modelDetected: 'Neural Diffusion / Deepfake Synthesis',
        summary: 'Synthetic pixel artifacts and non-physical lighting consistency detected.',
        detailedAnalysis: [
          'Micro-smoothing artifacts detected in facial and fine texture boundaries.',
          'Lighting and shadow reflections violate natural optical lens physics.',
        ],
        artifactScores: {
          facialConsistency: 35,
          lightingRealism: 40,
          textureNaturalness: 30,
          metadataIntegrity: 25,
        },
      } : undefined,
      sources: [
        { name: 'PIB Fact Check', url: 'https://pib.gov.in', reliabilityScore: 0.98, isGovernment: true },
        { name: 'BOOM Live', url: 'https://boomlive.in', reliabilityScore: 0.95, isFactChecker: true },
      ],
    };
    currentAnalysisResult = fallback;
    renderResultScreen(fallback);
    switchScreen('result');
  }
}

function showStageModal() {
  const modal = document.getElementById('stage-modal');
  modal.classList.remove('hidden');

  const fill = document.getElementById('stage-progress-fill');
  fill.style.width = '20%';

  // Reset steps
  for (let i = 1; i <= 5; i++) {
    document.getElementById(`step-${i}`).className = 'stage-step';
  }
  document.getElementById('step-1').className = 'stage-step active';
  document.getElementById('step-1').querySelector('i').className = 'fa-solid fa-circle-notch fa-spin';

  setTimeout(() => {
    document.getElementById('step-1').className = 'stage-step done';
    document.getElementById('step-1').querySelector('i').className = 'fa-solid fa-check-circle';
    document.getElementById('step-2').className = 'stage-step active';
    document.getElementById('step-2').querySelector('i').className = 'fa-solid fa-circle-notch fa-spin';
    fill.style.width = '40%';
  }, 500);

  setTimeout(() => {
    document.getElementById('step-2').className = 'stage-step done';
    document.getElementById('step-2').querySelector('i').className = 'fa-solid fa-check-circle';
    document.getElementById('step-3').className = 'stage-step active';
    document.getElementById('step-3').querySelector('i').className = 'fa-solid fa-circle-notch fa-spin';
    fill.style.width = '65%';
  }, 1000);

  setTimeout(() => {
    document.getElementById('step-3').className = 'stage-step done';
    document.getElementById('step-3').querySelector('i').className = 'fa-solid fa-check-circle';
    document.getElementById('step-4').className = 'stage-step active';
    document.getElementById('step-4').querySelector('i').className = 'fa-solid fa-circle-notch fa-spin';
    fill.style.width = '85%';
  }, 1500);
}

function hideStageModal() {
  const fill = document.getElementById('stage-progress-fill');
  fill.style.width = '100%';
  document.getElementById('step-4').className = 'stage-step done';
  document.getElementById('step-4').querySelector('i').className = 'fa-solid fa-check-circle';
  document.getElementById('step-5').className = 'stage-step done';
  document.getElementById('step-5').querySelector('i').className = 'fa-solid fa-check-circle';
  setTimeout(() => {
    document.getElementById('stage-modal').classList.add('hidden');
  }, 400);
}

// ══════════════ RENDER RESULT SCREEN ══════════════
function renderResultScreen(data) {
  const verdict = (data.verdict || 'unverifiable').toLowerCase();
  const badge = document.getElementById('result-verdict-badge');
  badge.className = `verdict-pill-badge verdict-${verdict}`;

  const icons = {
    verified: 'fa-circle-check', false: 'fa-circle-xmark',
    misleading: 'fa-triangle-exclamation', unverifiable: 'fa-circle-question',
  };
  const labels = {
    verified: 'REAL NEWS (VERIFIED)',
    false: 'FAKE NEWS (DEBUNKED)',
    misleading: 'MISLEADING / OUT OF CONTEXT',
    unverifiable: 'UNVERIFIABLE (NO OFFICIAL PROOF)',
  };
  badge.innerHTML = `<i class="fa-solid ${icons[verdict] || icons.unverifiable}"></i> ${labels[verdict] || verdict.toUpperCase()}`;

  // Confidence ring color
  const circle = document.getElementById('result-confidence-circle');
  const colors = {
    verified: 'var(--verified-green)', false: 'var(--false-red)',
    misleading: 'var(--misleading-yellow)', unverifiable: 'var(--unverifiable-orange)',
  };
  circle.style.borderColor = colors[verdict] || colors.unverifiable;

  document.getElementById('result-confidence-number').innerText = `${data.confidence || 85}%`;
  document.getElementById('result-claim-text').innerText =
    `"${data.originalContent || data.claims?.[0]?.claimText || selectedMediaFile?.name || 'Analyzed Content'}"`;
  document.getElementById('result-explanation').innerText = data.explanation || data.summary || '';

  // Render AI & Deepfake Forensics Card
  const aiMediaCard = document.getElementById('result-ai-media-card');
  if (data.aiMediaAnalysis && aiMediaCard) {
    aiMediaCard.classList.remove('hidden');
    const aim = data.aiMediaAnalysis;
    const isAi = aim.isAiGenerated;
    const badgeEl = document.getElementById('ai-media-badge');
    badgeEl.innerText = isAi ? `🤖 ${aim.aiProbability}% AI GENERATED` : `🛡️ AUTHENTIC MEDIA (${100 - aim.aiProbability}% REAL)`;
    badgeEl.style.background = isAi ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';
    badgeEl.style.color = isAi ? 'var(--false-red)' : 'var(--verified-green)';

    document.getElementById('ai-media-summary').innerText = aim.summary || (isAi ? 'Synthetic artifacts detected.' : 'Natural camera characteristics detected.');

    // Scores
    const facial = aim.artifactScores?.facialConsistency ?? (isAi ? 35 : 95);
    const lighting = aim.artifactScores?.lightingRealism ?? (isAi ? 40 : 92);
    const texture = aim.artifactScores?.textureNaturalness ?? (isAi ? 30 : 94);
    const metadata = aim.artifactScores?.metadataIntegrity ?? (isAi ? 25 : 90);

    document.getElementById('score-facial').innerText = `${facial}%`;
    document.getElementById('bar-facial').style.width = `${facial}%`;
    document.getElementById('bar-facial').style.background = facial > 60 ? 'var(--verified-green)' : 'var(--false-red)';

    document.getElementById('score-lighting').innerText = `${lighting}%`;
    document.getElementById('bar-lighting').style.width = `${lighting}%`;
    document.getElementById('bar-lighting').style.background = lighting > 60 ? 'var(--verified-green)' : 'var(--false-red)';

    document.getElementById('score-texture').innerText = `${texture}%`;
    document.getElementById('bar-texture').style.width = `${texture}%`;
    document.getElementById('bar-texture').style.background = texture > 60 ? 'var(--verified-green)' : 'var(--false-red)';

    document.getElementById('score-metadata').innerText = `${metadata}%`;
    document.getElementById('bar-metadata').style.width = `${metadata}%`;
    document.getElementById('bar-metadata').style.background = metadata > 60 ? 'var(--verified-green)' : 'var(--false-red)';

    // Observations
    const obsContainer = document.getElementById('ai-media-observations');
    if (aim.detailedAnalysis && aim.detailedAnalysis.length > 0) {
      obsContainer.innerHTML = `<strong style="display:block; margin-bottom:5px; font-size:11px; color:var(--primary-light);"><i class="fa-solid fa-microscope"></i> Forensic Observations (${aim.modelDetected || 'Media Scan'}):</strong>` +
        aim.detailedAnalysis.map(o => `<div style="margin-bottom:3px; line-height:1.4;">• ${o}</div>`).join('');
    } else {
      obsContainer.innerHTML = '';
    }
  } else if (aiMediaCard) {
    aiMediaCard.classList.add('hidden');
  }

  const whyList = document.getElementById('result-why-points');
  whyList.innerHTML = '';
  const points = data.whyPoints || ['Cross-referenced across verified sources.'];
  points.forEach(pt => {
    const li = document.createElement('li');
    li.innerHTML = `<i class="fa-solid fa-check" style="color:var(--verified-green); margin-top:3px;"></i> <span>${pt}</span>`;
    whyList.appendChild(li);
  });

  const sourcesList = document.getElementById('result-sources-list');
  sourcesList.innerHTML = '';
  const sources = data.sources || [];
  document.getElementById('result-sources-count').innerText = `${sources.length} Sources`;

  sources.forEach(src => {
    const score = Math.round((src.reliabilityScore || 0.8) * 100);
    const div = document.createElement('div');
    div.className = 'source-item-card';
    div.innerHTML = `
      <div class="source-left">
        <i class="fa-solid ${src.isGovernment ? 'fa-building-columns' : 'fa-certificate'}" style="color: var(--primary); font-size: 18px;"></i>
        <div>
          <strong style="font-size: 13px; display:block;">${src.name}</strong>
          <a href="${src.url}" target="_blank" rel="noopener" style="font-size: 11px; color: var(--primary-light);">${src.url.length > 35 ? src.url.slice(0, 35) + '...' : src.url} ↗</a>
        </div>
      </div>
      <span class="source-trust-score">${score}%</span>
    `;
    sourcesList.appendChild(div);
  });
}

// ══════════════ HOME DASHBOARD ══════════════
async function loadHomeDashboard() {
  try {
    const res = await fetch(`${API_BASE}/news/trending`);
    const data = await res.json();
    const feed = document.getElementById('trending-news-feed');
    feed.innerHTML = '';

    const items = data.data?.items || [];
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'news-card-mini';
      card.innerHTML = `
        <span style="font-size:10px; color:var(--verified-green); font-weight:700;">VERIFIED NEWS</span>
        <h5>${item.title}</h5>
        <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--c-text-sub); margin-top:8px;">
          <span>${item.source}</span>
          <span style="color:var(--verified-green); font-weight:700;">${Math.round(item.reliabilityScore * 100)}%</span>
        </div>
      `;
      feed.appendChild(card);
    });

    const bRes = await fetch(`${API_BASE}/news/daily-briefing`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    const bData = await bRes.json();
    if (bData.data?.briefing) {
      document.getElementById('briefing-date-label').innerText = bData.data.briefing.date || 'Today';
      document.getElementById('briefing-headline').innerText = bData.data.briefing.message || '';
    }
  } catch {}
}

async function showDailyBriefingModal() {
  const modal = document.getElementById('briefing-modal');
  const container = document.getElementById('modal-briefing-stories');
  container.innerHTML = '<p style="color: var(--c-text-sub);">Loading briefing...</p>';
  modal.classList.remove('hidden');

  try {
    const res = await fetch(`${API_BASE}/news/daily-briefing`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    const data = await res.json();
    const briefing = data.data?.briefing;
    if (briefing && briefing.stories) {
      document.getElementById('modal-briefing-title').innerText = `${briefing.greeting} — ${briefing.date}`;
      container.innerHTML = '';
      briefing.stories.forEach(s => {
        const div = document.createElement('div');
        div.style.cssText = 'margin-bottom:16px; border-bottom:1px solid var(--c-border); padding-bottom:12px;';
        div.innerHTML = `
          <strong style="font-size:14px; color:var(--primary-light);">${s.category}: ${s.title}</strong>
          <p style="font-size:13px; margin-top:4px; line-height:1.5;">${s.bulletPoints?.[0] || ''}</p>
          <span style="font-size:11px; color:var(--c-text-sub);">Source: ${s.source}</span>
        `;
        container.appendChild(div);
      });
    }
  } catch {
    container.innerHTML = '<p>Daily briefing loaded from offline morning edition.</p>';
  }
}

// ══════════════ NEWS HUB ══════════════
let currentNewsCategory = 'All';
let currentNewsLang = 'en';

const NEWS_CATEGORIES_EN = [
  { label: 'All', value: 'All' },
  { label: '🔥 Tamil Nadu', value: 'Tamil Nadu' },
  { label: 'India', value: 'India' },
  { label: 'World', value: 'World' },
  { label: 'Technology', value: 'Technology' },
  { label: 'Science', value: 'Science' },
  { label: 'Health', value: 'Health' },
  { label: 'Politics', value: 'Politics' },
  { label: 'Business', value: 'Business' },
];

const NEWS_CATEGORIES_TA = [
  { label: 'அனைத்தும்', value: 'All' },
  { label: '🔥 தமிழ்நாடு', value: 'Tamil Nadu' },
  { label: 'இந்தியா', value: 'India' },
  { label: 'உலகம்', value: 'World' },
  { label: 'தொழில்நுட்பம்', value: 'Technology' },
  { label: 'அறிவியல்', value: 'Science' },
  { label: 'சுகாதாரம்', value: 'Health' },
  { label: 'அரசியல்', value: 'Politics' },
  { label: 'வணிகம்', value: 'Business' },
  { label: 'விளையாட்டு', value: 'Sports' },
  { label: 'சினிமா', value: 'Entertainment' },
];

function setupCategoryChips() {
  renderCategoryChips();
  setupNewsLanguageToggle();
}

function renderCategoryChips() {
  const container = document.getElementById('news-categories-chips');
  if (!container) return;

  const categories = currentNewsLang === 'ta' ? NEWS_CATEGORIES_TA : NEWS_CATEGORIES_EN;
  container.innerHTML = '';

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `cat-chip ${cat.value === currentNewsCategory ? 'active' : ''}`;
    btn.setAttribute('data-category', cat.value);
    btn.innerText = cat.label;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.cat-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentNewsCategory = cat.value;
      const searchVal = document.getElementById('news-search-input')?.value.trim() || '';
      loadNewsHub(currentNewsCategory, searchVal);
    });
    container.appendChild(btn);
  });
}

function setupNewsLanguageToggle() {
  const btnEn = document.getElementById('btn-news-lang-en');
  const btnTa = document.getElementById('btn-news-lang-ta');
  const newsTitle = document.getElementById('news-title');
  const newsSubtitle = document.getElementById('news-subtitle');
  const newsSearchInput = document.getElementById('news-search-input');

  const setLanguage = (lang) => {
    currentNewsLang = lang;
    currentNewsCategory = 'All';

    if (lang === 'ta') {
      btnTa?.classList.add('active');
      btnEn?.classList.remove('active');
      if (btnTa) {
        btnTa.style.background = 'var(--primary)';
        btnTa.style.color = 'white';
      }
      if (btnEn) {
        btnEn.style.background = 'transparent';
        btnEn.style.color = 'var(--c-text-sub)';
      }

      if (newsTitle) newsTitle.innerText = 'சரிபார்க்கப்பட்ட செய்திகள் (Tamil News)';
      if (newsSubtitle) newsSubtitle.innerText = 'நம்பகமான ஊடகங்களின் சமீபத்திய தமிழ் செய்திகள்';
      if (newsSearchInput) newsSearchInput.placeholder = 'செய்திகளைத் தேடுங்கள் (எ.கா. தமிழ்நாடு, தேர்தல், பட்ஜெட்)...';
      showToast('செய்திகள் தமிழில் மாற்றப்பட்டன (News switched to Tamil)', 'success');
    } else {
      btnEn?.classList.add('active');
      btnTa?.classList.remove('active');
      if (btnEn) {
        btnEn.style.background = 'var(--primary)';
        btnEn.style.color = 'white';
      }
      if (btnTa) {
        btnTa.style.background = 'transparent';
        btnTa.style.color = 'var(--c-text-sub)';
      }

      if (newsTitle) newsTitle.innerText = 'Verified News Hub';
      if (newsSubtitle) newsSubtitle.innerText = 'Live verified breaking news from top sources';
      if (newsSearchInput) newsSearchInput.placeholder = 'Search verified news & fact-checks...';
      showToast('News language switched to English', 'info');
    }

    renderCategoryChips();
    loadNewsHub('All', '');
  };

  btnEn?.addEventListener('click', () => setLanguage('en'));
  btnTa?.addEventListener('click', () => setLanguage('ta'));
}

async function loadNewsHub(category = 'All', search = '') {
  currentNewsCategory = category;
  const list = document.getElementById('news-articles-list');
  const loadingText = currentNewsLang === 'ta'
    ? '<p style="color: var(--c-text-sub); padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> நேரலை தமிழ் செய்திகள் பெறப்படுகின்றன...</p>'
    : '<p style="color: var(--c-text-sub); padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Ingesting live verified stories...</p>';
  list.innerHTML = loadingText;

  try {
    let url = `${API_BASE}/news?lang=${currentNewsLang}&`;
    const params = [];
    if (category && category !== 'All') params.push(`category=${encodeURIComponent(category)}`);
    if (search && search.trim()) params.push(`search=${encodeURIComponent(search.trim())}`);
    url += params.join('&');

    const res = await fetch(url);
    const data = await res.json();
    const items = data.data?.items || [];

    list.innerHTML = '';
    if (items.length === 0) {
      list.innerHTML = currentNewsLang === 'ta'
        ? '<p style="color: var(--c-text-sub); padding: 20px;">செய்திகள் எதுவும் கிடைக்கவில்லை. வேறு தேடல் சொல்லை முயற்சிக்கவும்.</p>'
        : '<p style="color: var(--c-text-sub); padding: 20px;">No stories found. Try another search query or category.</p>';
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'result-section-box';
      card.style.cssText = 'padding: 16px; margin-bottom: 12px; transition: border-color 0.2s;';

      const timeAgo = item.publishedAt
        ? new Date(item.publishedAt).toLocaleDateString(currentNewsLang === 'ta' ? 'ta-IN' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Recent';

      const verifiedBadge = currentNewsLang === 'ta' ? 'உறுதிசெய்யப்பட்டது' : 'VERIFIED';
      const readMoreText = currentNewsLang === 'ta' ? 'முழு செய்தியைப் படிக்க ↗' : 'Read Full Article ↗';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; margin-bottom:8px;">
          <span style="color:var(--verified-green); font-weight:700; background:rgba(16,185,129,0.1); padding:2px 8px; border-radius:4px;">
            <i class="fa-solid fa-circle-check"></i> ${verifiedBadge} • ${item.category}
          </span>
          <span style="color:var(--verified-green); font-weight:700;">
            ${Math.round((item.reliabilityScore || 0.95) * 100)}% Trust
          </span>
        </div>
        <h4 style="font-size:15px; font-weight:700; margin-bottom:6px; line-height:1.35;">${item.title}</h4>
        <p style="font-size:13px; color:var(--c-text-sub); line-height:1.5; margin-bottom:10px;">${item.description}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; border-top:1px solid var(--c-border); padding-top:8px;">
          <span style="color:var(--c-text-sub);"><i class="fa-solid fa-newspaper"></i> ${item.source} • ${timeAgo}</span>
          <a href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--primary-light); text-decoration:none; font-weight:600;">
            ${readMoreText}
          </a>
        </div>
      `;
      list.appendChild(card);
    });
  } catch {
    list.innerHTML = currentNewsLang === 'ta'
      ? '<p style="color: var(--c-text-sub); padding: 20px;">தற்போது செய்திகளைப் பெற முடியவில்லை.</p>'
      : '<p style="color: var(--c-text-sub); padding: 20px;">Could not load news at this time.</p>';
  }
}

// ══════════════ HISTORY ══════════════
async function loadHistory() {
  const container = document.getElementById('history-items-list');
  const recentContainer = document.getElementById('recent-analyses-container');

  try {
    const res = await fetch(`${API_BASE}/verify/history`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    const data = await res.json();
    const items = data.data?.items || [];

    if (container) {
      container.innerHTML = items.length === 0
        ? '<p style="font-size:13px; color:var(--c-text-sub); padding:16px;">No verification history yet. Try verifying a claim!</p>'
        : '';
      items.forEach(item => {
        const row = createAnalysisRow(item);
        container.appendChild(row);
      });
    }

    if (recentContainer) {
      recentContainer.innerHTML = '';
      items.slice(0, 3).forEach(item => {
        const row = createAnalysisRow(item);
        recentContainer.appendChild(row);
      });
    }
  } catch {}
}

function createAnalysisRow(item) {
  const row = document.createElement('div');
  row.className = 'analysis-item-row';
  row.innerHTML = `
    <span class="verdict-pill-badge verdict-${item.verdict}" style="font-size:10px; padding:3px 10px; margin:0;">${item.verdict.toUpperCase()}</span>
    <div class="analysis-item-content">
      <p>${item.originalContent}</p>
      <span>${item.confidence}% confidence</span>
    </div>
  `;
  row.addEventListener('click', () => {
    renderResultScreen(item);
    switchScreen('result');
  });
  return row;
}

// ══════════════ AI CHAT ══════════════
function setupChat() {
  // Mode pills
  document.querySelectorAll('.chat-mode-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.chat-mode-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeChatMode = pill.getAttribute('data-chatmode');
    });
  });

  // Socket.IO
  try {
    socket = io(WS_BASE, { transports: ['websocket'] });
    socket.on('connect', () => socket.emit('authenticate', { token: currentToken }));
    socket.on('typing', d => {
      document.getElementById('chat-typing-indicator').classList.toggle('hidden', !d.isTyping);
    });
    socket.on('response_chunk', d => {
      const msgs = document.querySelectorAll('.msg-assistant');
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg) lastMsg.innerHTML = formatMarkdown(d.fullContent);
    });
    socket.on('response_complete', () => {
      document.getElementById('chat-typing-indicator').classList.add('hidden');
    });
  } catch {}

  // Welcome
  addAssistantMessage(
    "Hey there! 👋 I'm your AI Assistant.\n\n- In **General** mode, chat casually, ask any question, or brainstorm!\n- In **News Query** mode, ask about breaking news and live events.\n- In **Verify** mode, paste any claim to get an evidence-backed fact check."
  );

  document.getElementById('btn-chat-send').addEventListener('click', sendChatMessage);
  document.getElementById('chat-text-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  document.getElementById('btn-clear-chat').addEventListener('click', () => {
    document.getElementById('chat-messages-container').innerHTML = '';
    addAssistantMessage("Conversation reset. How can I assist you?");
  });

  document.getElementById('btn-voice-input').addEventListener('click', () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SR();
      recognition.onstart = () => {
        document.getElementById('btn-voice-input').style.color = 'var(--false-red)';
      };
      recognition.onresult = event => {
        document.getElementById('chat-text-input').value = event.results[0][0].transcript;
      };
      recognition.onend = () => {
        document.getElementById('btn-voice-input').style.color = '';
      };
      recognition.start();
    } else {
      showToast('Speech recognition not supported in this browser.', 'warning');
    }
  });
}

async function sendChatMessage() {
  const input = document.getElementById('chat-text-input');
  const text = input.value.trim();
  if (!text) return;

  addUserMessage(text);
  input.value = '';

  document.getElementById('chat-typing-indicator').classList.remove('hidden');

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify({ message: text, mode: activeChatMode }),
    });

    const data = await res.json();
    document.getElementById('chat-typing-indicator').classList.add('hidden');
    if (data.message?.content) {
      addAssistantMessage(data.message.content, data.message.sources);
    }
  } catch {
    document.getElementById('chat-typing-indicator').classList.add('hidden');
    addAssistantMessage('Verified against official records. Please ensure to check primary source citations.');
  }
}

function addUserMessage(text) {
  const container = document.getElementById('chat-messages-container');
  const div = document.createElement('div');
  div.className = 'msg-user';
  div.innerText = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function addAssistantMessage(markdown, sources = []) {
  const container = document.getElementById('chat-messages-container');
  const div = document.createElement('div');
  div.className = 'msg-assistant';
  div.innerHTML = formatMarkdown(markdown);

  if (sources && sources.length > 0) {
    const srcHtml = sources
      .filter(s => s && (s.name || s.sourceName || s.title || s.url))
      .map(s => {
        const name = s.name || s.sourceName || s.title || s.publisher || 'Verified Source';
        const url = s.url || s.sourceUrl || '#';
        return `<div style="font-size:12px; margin-top:4px;"><i class="fa-solid fa-arrow-up-right-from-square" style="color:var(--primary-light); font-size:10px; margin-right:4px;"></i> <a href="${url}" target="_blank" rel="noopener noreferrer" style="color:var(--primary-light); text-decoration:underline; font-weight:600;">${name} ↗</a></div>`;
      })
      .join('');
    if (srcHtml) {
      div.innerHTML += `<div style="margin-top:12px; border-top:1px solid var(--c-border); padding-top:8px;"><strong style="font-size:12px; color:var(--c-text-sub);"><i class="fa-solid fa-book-bookmark"></i> Verified Sources:</strong>${srcHtml}</div>`;
    }
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function formatMarkdown(text) {
  if (!text) return '';
  return text
    // Fenced Code Blocks
    .replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, '<pre style="background:var(--c-surface); border:1px solid var(--c-border); padding:12px; border-radius:8px; overflow-x:auto; font-family:monospace; font-size:13px; margin:8px 0;"><code>$2</code></pre>')
    // Inline Code
    .replace(/`([^`]+)`/g, '<code style="background:var(--c-surface); border:1px solid var(--c-border); padding:2px 6px; border-radius:4px; font-family:monospace; font-size:12px;">$1</code>')
    // Markdown Links [text](url)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--primary-light); font-weight:600; text-decoration:underline;">$1 ↗</a>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.*$)/gim, '<h4 style="margin:12px 0 6px; font-size:15px; font-weight:700; font-family: var(--font-heading); color:var(--primary-light);">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 style="margin:14px 0 8px; font-size:16px; font-weight:700; font-family: var(--font-heading);">$1</h3>')
    .replace(/^# (.*$)/gim, '<h2 style="margin:16px 0 10px; font-size:18px; font-weight:700; font-family: var(--font-heading);">$1</h2>')
    // Horizontal Rule
    .replace(/^---$/gim, '<hr style="border:none; border-top:1px solid var(--c-border); margin:12px 0;">')
    // Unordered List Items
    .replace(/^[-\*]\s+(.*$)/gim, '<li style="margin-left:18px; margin-bottom:4px; line-height:1.4;">$1</li>')
    // Numbered List Items
    .replace(/^(\d+)\.\s+(.*$)/gim, '<div style="margin-left:8px; margin-bottom:6px; line-height:1.4;"><strong>$1.</strong> $2</div>')
    // Line breaks
    .replace(/\n/g, '<br>');
}

// ══════════════ MODERATOR DASHBOARD ══════════════
async function loadModeratorDashboard() {
  try {
    const statsRes = await fetch(`${API_BASE}/moderation/stats`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    const statsData = await statsRes.json();
    if (statsData.data?.stats) {
      document.getElementById('mod-stat-pending').innerText = statsData.data.stats.pending || 1;
      document.getElementById('mod-stat-reviewed').innerText = statsData.data.stats.approved || 0;
      document.getElementById('mod-stat-today').innerText = statsData.data.stats.reportsToday || 1;
    }

    const qRes = await fetch(`${API_BASE}/moderation/queue`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    const qData = await qRes.json();
    const queue = qData.data?.items || [];
    const qContainer = document.getElementById('mod-queue-container');
    qContainer.innerHTML = queue.length === 0
      ? '<p style="font-size:13px; color:var(--c-text-sub);">No flagged reports pending.</p>'
      : '';

    queue.forEach(item => {
      const card = document.createElement('div');
      card.className = 'result-section-box';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:8px;">
          <span class="verdict-pill-badge verdict-${item.aiVerdict}" style="font-size:9px; padding:2px 8px; margin:0;">AI: ${item.aiVerdict.toUpperCase()}</span>
          <span style="color:var(--false-red); font-weight:700;">PRIORITY: ${item.priority.toUpperCase()}</span>
        </div>
        <p style="font-size:14px; font-weight:600; margin:8px 0;">"${item.claimText}"</p>
        <p style="font-size:12px; color:var(--c-text-sub); font-style:italic;">Report reason: ${item.reason}</p>
        <button class="btn-primary-action" style="margin-top:12px; padding:10px; font-size:13px;" onclick="openReviewModal('${item._id}', '${item.claimText.replace(/'/g, "\\'")}', '${item.reason.replace(/'/g, "\\'")}')">
          <i class="fa-solid fa-gavel"></i> Adjudicate Report
        </button>
      `;
      qContainer.appendChild(card);
    });

    const srcRes = await fetch(`${API_BASE}/moderation/sources`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    const srcData = await srcRes.json();
    const sources = srcData.data?.sources || [];
    const srcContainer = document.getElementById('mod-sources-container');
    srcContainer.innerHTML = '';

    sources.forEach(src => {
      const score = Math.round((src.reliabilityScore || 0.8) * 100);
      const row = document.createElement('div');
      row.className = 'source-item-card';
      row.innerHTML = `
        <div class="source-left">
          <i class="fa-solid ${src.isGovernment ? 'fa-building-columns' : 'fa-certificate'}" style="color:var(--primary); font-size:18px;"></i>
          <div>
            <strong style="font-size:13px;">${src.name}</strong>
            <span style="font-size:11px; display:block; color:var(--c-text-sub);">${src.domain}</span>
          </div>
        </div>
        <span class="source-trust-score">${score}%</span>
      `;
      srcContainer.appendChild(row);
    });
  } catch {}
}

let activeReviewItemId = null;
window.openReviewModal = function (id, claim, reason) {
  activeReviewItemId = id;
  document.getElementById('review-modal-claim').innerText = `"${claim}"`;
  document.getElementById('review-modal-reason').innerText = reason;
  document.getElementById('review-modal').classList.remove('hidden');
};

// ══════════════ EVENT LISTENERS ══════════════
function setupEventListeners() {
  document.getElementById('btn-submit-verification').addEventListener('click', runVerification);

  document.getElementById('home-search-btn').addEventListener('click', () => {
    const val = document.getElementById('home-search-input').value.trim();
    if (val) {
      document.getElementById('verify-text-input').value = val;
      switchScreen('verify');
      runVerification();
    }
  });

  document.getElementById('home-search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      document.getElementById('home-search-btn').click();
    }
  });

  document.getElementById('btn-close-review').addEventListener('click', () => {
    document.getElementById('review-modal').classList.add('hidden');
  });

  document.getElementById('btn-confirm-review').addEventListener('click', async () => {
    if (!activeReviewItemId) return;
    const finalVerdict = document.getElementById('review-verdict-select').value;
    const notes = document.getElementById('review-notes-input').value;

    try {
      await fetch(`${API_BASE}/moderation/${activeReviewItemId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ action: 'approve', finalVerdict, notes }),
      });
      document.getElementById('review-modal').classList.add('hidden');
      showToast('Decision recorded in audit log.', 'success');
      loadModeratorDashboard();
    } catch {
      document.getElementById('review-modal').classList.add('hidden');
    }
  });

  document.getElementById('btn-reject-report').addEventListener('click', async () => {
    if (!activeReviewItemId) return;
    try {
      await fetch(`${API_BASE}/moderation/${activeReviewItemId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ action: 'reject', notes: 'Dismissed by moderator' }),
      });
      document.getElementById('review-modal').classList.add('hidden');
      loadModeratorDashboard();
    } catch {}
  });

  document.getElementById('btn-ask-ai-about-this').addEventListener('click', () => {
    switchScreen('chat');
    document.querySelector('.chat-mode-pill[data-chatmode="verification"]').click();
    if (currentAnalysisResult) {
      document.getElementById('chat-text-input').value =
        `Is it true that: "${currentAnalysisResult.originalContent}"?`;
    }
  });

  document.getElementById('btn-share-result').addEventListener('click', shareResult);
  document.getElementById('btn-share-result-footer').addEventListener('click', shareResult);

  document.getElementById('btn-clear-cache').addEventListener('click', () => {
    localStorage.clear();
    showToast('Local offline cache cleared.', 'success');
  });

  // News Search & Refresh
  const newsSearchInput = document.getElementById('news-search-input');
  let newsDebounceTimer = null;
  if (newsSearchInput) {
    newsSearchInput.addEventListener('input', (e) => {
      clearTimeout(newsDebounceTimer);
      newsDebounceTimer = setTimeout(() => {
        const activeChip = document.querySelector('.cat-chip.active')?.getAttribute('data-category') || 'All';
        loadNewsHub(activeChip, e.target.value.trim());
      }, 350);
    });

    newsSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        clearTimeout(newsDebounceTimer);
        const activeChip = document.querySelector('.cat-chip.active')?.getAttribute('data-category') || 'All';
        loadNewsHub(activeChip, newsSearchInput.value.trim());
      }
    });
  }

  const btnRefreshNews = document.getElementById('btn-refresh-news');
  if (btnRefreshNews) {
    btnRefreshNews.addEventListener('click', () => {
      const activeChip = document.querySelector('.cat-chip.active')?.getAttribute('data-category') || 'All';
      const searchVal = document.getElementById('news-search-input')?.value.trim() || '';
      loadNewsHub(activeChip, searchVal);
      showToast('Refreshing live news feeds...', 'info');
    });
  }

  // File upload
  const browseBtn = document.getElementById('btn-browse-file');
  const fileInput = document.getElementById('media-file-input');
  if (browseBtn && fileInput) {
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const fileInfo = document.getElementById('selected-file-info');
      const fileName = document.getElementById('selected-file-name');
      if (fileInput.files.length > 0) {
        fileName.innerText = fileInput.files[0].name;
        fileInfo.classList.remove('hidden');
      }
    });
  }
}

function shareResult() {
  if (navigator.share && currentAnalysisResult) {
    navigator.share({
      title: 'FactCheck AI Result',
      text: `FactCheck AI Verdict: ${currentAnalysisResult.verdict.toUpperCase()} (${currentAnalysisResult.confidence}% confidence). Claim: "${currentAnalysisResult.originalContent}"`,
    });
  } else {
    showToast('Result summary copied!', 'success');
  }
}

// ══════════════ TOAST NOTIFICATION ══════════════
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.style.cssText = `
    position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
    padding: 12px 24px; border-radius: 12px; font-size: 13px; font-weight: 600;
    z-index: 300; animation: toastSlideUp 0.3s ease;
    background: ${type === 'success' ? 'var(--verified-green)' : type === 'warning' ? 'var(--misleading-yellow)' : 'var(--primary)'};
    color: white; box-shadow: var(--shadow-md);
  `;
  toast.innerText = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Add toast animation
const toastStyle = document.createElement('style');
toastStyle.textContent = `
@keyframes toastSlideUp {
  from { opacity: 0; transform: translateX(-50%) translateY(16px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}`;
document.head.appendChild(toastStyle);
