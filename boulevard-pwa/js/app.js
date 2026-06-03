/* =====================================================
   Boulevard Merchant PWA – Main Application
   Sections:
     1. Configuration
     2. State
     3. DOM helpers
     4. API client
     5. Auth (Login / Logout)
     6. Tab navigation
     7. Push Notifications
     8. Orders
     9. Stock Management
    10. Bootstrap
   ===================================================== */

/* ── 1. Configuration ──────────────────────────────── */

/**
 * BASE_URL: absolute URL of the Boulevard API server (production).
 */
const BASE_URL = 'https://boulevard.r-y-x.net/pwa';

const API = {
  LOGIN:    `${BASE_URL}/api/v1/merchant-pwa/login`,
  ORDERS:   `${BASE_URL}/api/v1/merchant-pwa/orders`,
  PRODUCTS: `${BASE_URL}/api/v1/merchant-pwa/products`,
  STOCK:    (id) => `${BASE_URL}/api/v1/merchant-pwa/stock/${id}`,
};

const STORAGE_KEY = 'blvd_pwa_session';

/* ── 2. State ──────────────────────────────────────── */
const state = {
  token:        null,
  merchantId:   null,
  merchantName: null,
  orders:       [],
  orderPage:    1,
  orderPageSize: 20,
  hasMoreOrders: false,
  products:     [],
  swRegistration: null,
  pushSubscription: null,
  notifications: [],   // received push messages stored in-app
  editTier: null,      // { tierId, productId } – tier currently open in the edit modal
};

/* ── 3. DOM helpers ────────────────────────────────── */
const $ = (id) => document.getElementById(id);

function show(id) { $(id)?.classList.remove('hidden'); }
function hide(id) { $(id)?.classList.add('hidden'); }

function showToast(msg, duration = 3000) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => {
    el.classList.remove('show');
    el.classList.add('hidden');
  }, duration);
}

function setVisible(id, visible) {
  visible ? show(id) : hide(id);
}

/* ── 4. API client ─────────────────────────────────── */
async function apiPost(url, body) {
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  return res.json();
}

async function apiGet(url, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const full = qs ? `${url}?${qs}` : url;
  const res = await fetch(full, {
    method:  'GET',
    headers: { 'X-Pwa-Token': state.token || '' },
  });
  return res.json();
}

async function apiPut(url, body) {
  const res = await fetch(url, {
    method:  'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Pwa-Token':  state.token || '',
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

/* ── 5. Auth ───────────────────────────────────────── */

function saveSession() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    token:        state.token,
    merchantId:   state.merchantId,
    merchantName: state.merchantName,
  }));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    if (!s.token) return false;
    state.token        = s.token;
    state.merchantId   = s.merchantId;
    state.merchantName = s.merchantName;
    return true;
  } catch (_) { return false; }
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  state.token        = null;
  state.merchantId   = null;
  state.merchantName = null;
}

function showDashboard() {
  hide('screen-login');
  $('screen-dashboard').classList.remove('hidden');
  $('screen-dashboard').classList.add('active');
  $('merchant-name').textContent = state.merchantName || '';
}

function showLogin() {
  $('screen-dashboard').classList.add('hidden');
  $('screen-dashboard').classList.remove('active');
  show('screen-login');
  $('screen-login').classList.add('active');
}

async function handleLogin(e) {
  e.preventDefault();
  const username = $('inp-username').value.trim();
  const password = $('inp-password').value;

  hide('login-error');

  if (!username || !password) {
    showError('login-error', 'Please enter your username and password.');
    return;
  }

  // Show spinner
  $('btn-login').disabled = true;
  hide('btn-login-text');
  show('btn-login-spinner');

  try {
    const resp = await apiPost(API.LOGIN, { username, password });
    if (resp.isSuccess && resp.result) {
      state.token        = resp.result.token;
      state.merchantId   = resp.result.merchantId;
      state.merchantName = resp.result.merchantName;
      saveSession();
      showDashboard();
      initDashboard();
    } else {
      showError('login-error', resp.message || 'Invalid username or password.');
    }
  } catch (err) {
    showError('login-error', 'Could not connect to the server. Please try again.');
  } finally {
    $('btn-login').disabled = false;
    show('btn-login-text');
    hide('btn-login-spinner');
  }
}

function handleLogout() {
  clearSession();
  showLogin();
  // Reset form
  $('form-login').reset();
  hide('login-error');
}

/* ── 6. Tab navigation ─────────────────────────────── */

function switchTab(tabId) {
  // Buttons
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });
  // Panels
  document.querySelectorAll('.tab-content').forEach(p => {
    p.classList.toggle('active',  p.id === tabId);
    p.classList.toggle('hidden', p.id !== tabId);
  });
  // Lazy-load data on first visit
  if (tabId === 'tab-orders'   && state.orders.length   === 0) loadOrders();
  if (tabId === 'tab-stock'    && state.products.length  === 0) loadProducts();
}

/* ── 7. Push Notifications ─────────────────────────── */

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const b64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

function updateNotifUI() {
  const subscribed = !!state.pushSubscription;
  $('notif-status-icon').className = `status-icon ${subscribed ? 'on' : 'off'}`;
  $('notif-status-label').textContent  = subscribed ? 'Notifications Enabled' : 'Notifications Off';
  $('notif-status-detail').textContent = subscribed
    ? 'You will receive order alerts on this device.'
    : 'You are not subscribed to push notifications.';
  $('btn-notif-toggle').textContent = subscribed ? 'Disable Notifications' : 'Enable Notifications';
  setVisible('notif-list-section', state.notifications.length > 0);
}

function renderNotifList() {
  const ul = $('notif-list');
  ul.innerHTML = '';
  state.notifications.slice().reverse().forEach(n => {
    const li = document.createElement('li');
    li.className = 'notif-item';
    li.innerHTML = `
      <div class="notif-title">${escHtml(n.title || 'Notification')}</div>
      <div class="notif-body">${escHtml(n.body || '')}</div>
      <div class="notif-time">${n.time ? new Date(n.time).toLocaleString() : ''}</div>`;
    ul.appendChild(li);
  });
  setVisible('notif-list-section', state.notifications.length > 0);
}

async function toggleNotifications() {
  hide('notif-error');
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    $('notif-error').textContent = 'Push notifications are not supported by this browser.';
    show('notif-error');
    return;
  }

  if (state.pushSubscription) {
    // Unsubscribe
    try {
      await state.pushSubscription.unsubscribe();
      state.pushSubscription = null;
      updateNotifUI();
      showToast('Notifications disabled.');
    } catch (err) {
      $('notif-error').textContent = 'Failed to disable notifications.';
      show('notif-error');
    }
    return;
  }

  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    $('notif-error').textContent = 'Notification permission was denied. Please allow notifications in your browser settings.';
    show('notif-error');
    return;
  }

  try {
    const reg = state.swRegistration;
    if (!reg) throw new Error('Service worker not ready.');

    /**
     * VAPID_PUBLIC_KEY: Replace with the VAPID public key from your server.
     * Generate a key pair with: npx web-push generate-vapid-keys
     * Set the public key below, and configure the private key on the server.
     */
    const VAPID_PUBLIC_KEY = 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY';

    let sub;
    if (VAPID_PUBLIC_KEY === 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY') {
      // Demo mode: subscribe without VAPID (limited browser support)
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true });
    } else {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    state.pushSubscription = sub;
    updateNotifUI();
    showToast('Notifications enabled on this device.');
    // The subscription object (sub.toJSON()) can be sent to your server
    // via a separate endpoint to enable server-initiated push.
    console.info('[PWA] Push subscription:', JSON.stringify(sub));
  } catch (err) {
    $('notif-error').textContent = `Failed to enable notifications: ${err.message}`;
    show('notif-error');
  }
}

async function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('./sw.js');
    state.swRegistration = reg;

    // Check for existing subscription
    const sub = await reg.pushManager.getSubscription();
    if (sub) state.pushSubscription = sub;

    // Listen for push messages relayed from the SW
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data?.type === 'PUSH_RECEIVED') {
        const n = { ...event.data.payload, time: new Date().toISOString() };
        state.notifications.push(n);
        renderNotifList();
        showToast(`🔔 ${n.title || 'New notification'}`);
      }
    });

    updateNotifUI();
  } catch (err) {
    console.warn('[PWA] Service worker registration failed:', err);
  }
}

/* ── 8. Orders ─────────────────────────────────────── */

async function loadOrders(page) {
  if (page !== undefined) state.orderPage = page;

  show('orders-loading');
  hide('orders-empty');
  hide('orders-error');
  hide('orders-pagination');
  $('orders-list').innerHTML = '';

  try {
    const resp = await apiGet(API.ORDERS, {
      page:     state.orderPage,
      pageSize: state.orderPageSize,
    });

    if (!resp.isSuccess) throw new Error(resp.message || 'Failed to load orders.');

    state.orders = resp.result || [];
    hide('orders-loading');

    if (state.orders.length === 0) {
      show('orders-empty');
    } else {
      $('orders-count').textContent = `${state.orders.length} order${state.orders.length !== 1 ? 's' : ''}`;
      renderOrdersList();
      // Show pagination controls if we got a full page (may have more)
      state.hasMoreOrders = state.orders.length === state.orderPageSize;
      updateOrdersPagination();
    }
  } catch (err) {
    hide('orders-loading');
    $('orders-error').textContent = err.message;
    show('orders-error');
  }
}

function renderOrdersList() {
  const container = $('orders-list');
  container.innerHTML = '';
  state.orders.forEach(o => {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML = `
      <div class="order-card-header" data-order-id="${o.orderId}">
        <span class="order-id">#${escHtml(o.readableOrderId || String(o.orderId))}</span>
        <span class="order-status-badge ${o.isCanceled ? 'canceled' : ''}">${escHtml(o.orderStatus || '—')}</span>
      </div>
      <div class="order-card-meta">
        <div class="order-meta-item"><strong>Customer:</strong> ${escHtml(o.customerName || '—')}</div>

        <div class="order-meta-item"><strong>Order Date:</strong> ${formatDate(o.orderDateTime)}</div>
        <div class="order-meta-item"><strong>Delivery Date:</strong> ${formatDate(o.deliveryDateTime)}</div>
        <div class="order-meta-item"><strong>Payment:</strong> ${escHtml(o.paymentMethod || '—')}</div>
        <div class="order-meta-item"><strong>Pay Status:</strong> ${escHtml(o.paymentStatus || '—')}</div>
        ${o.isScheduled ? `<div class="order-meta-item"><strong>Pickup Date:</strong> ${formatDate(o.pickupDate)}</div>` : ''}
      </div>
      <div class="order-card-footer">
        <span class="order-total">AED ${Number(o.totalPrice).toFixed(2)}</span>
        <button class="btn-view-order" data-order-id="${o.orderId}">View Details</button>
      </div>`;
    container.appendChild(card);
  });

  // Attach detail button listeners
  container.querySelectorAll('.btn-view-order, .order-card-header').forEach(el => {
    el.addEventListener('click', () => {
      const oid = Number(el.dataset.orderId);
      const order = state.orders.find(o => o.orderId === oid);
      if (order) openOrderModal(order);
    });
  });
}

function updateOrdersPagination() {
  const pag = $('orders-pagination');
  if (state.orderPage > 1 || state.hasMoreOrders) {
    pag.classList.remove('hidden');
    $('page-label').textContent  = `Page ${state.orderPage}`;
    $('btn-prev-page').disabled  = state.orderPage <= 1;
    $('btn-next-page').disabled  = !state.hasMoreOrders;
  }
}

/* ── 9. Order detail modal ─────────────────────────── */

function openOrderModal(order) {
  $('modal-order-title').textContent = `Order #${order.readableOrderId || order.orderId}`;

  let itemsHtml = '';
  if (order.items && order.items.length) {
    itemsHtml = `
      <div class="detail-section">
        <h3>Order Items</h3>
        <table class="order-items-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product</th>
              <th>Barcode</th>
              <th>Qty</th>
              <th>Unit (AED)</th>
              <th>Total (AED)</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.imageUrl ? `<img src="${escHtml(item.imageUrl)}" alt="" />` : '—'}</td>
                <td>${escHtml(item.productName || '—')}</td>
                <td>${escHtml(item.barcode || '—')}</td>
                <td>${item.quantity}</td>
                <td>${Number(item.unitPrice).toFixed(2)}</td>
                <td>${Number(item.totalPrice).toFixed(2)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  $('modal-order-content').innerHTML = `
    <div class="detail-section">
      <h3>Order Info</h3>
      <div class="detail-grid">
        <div class="detail-item"><div class="lbl">Order ID</div><div class="val">#${escHtml(order.readableOrderId || String(order.orderId))}</div></div>
        <div class="detail-item"><div class="lbl">Status</div><div class="val">${escHtml(order.orderStatus || '—')}</div></div>
        <div class="detail-item"><div class="lbl">Order Date</div><div class="val">${formatDate(order.orderDateTime)}</div></div>
        <div class="detail-item"><div class="lbl">Delivery Date</div><div class="val">${formatDate(order.deliveryDateTime)}</div></div>
        ${order.isScheduled ? `<div class="detail-item"><div class="lbl">Pickup Date</div><div class="val">${formatDate(order.pickupDate)}</div></div>` : ''}
        <div class="detail-item"><div class="lbl">Canceled</div><div class="val">${order.isCanceled ? 'Yes' : 'No'}</div></div>
        ${order.comments ? `<div class="detail-item"><div class="lbl">Comments</div><div class="val">${escHtml(order.comments)}</div></div>` : ''}
      </div>
    </div>

    <div class="detail-section">
      <h3>Customer</h3>
      <div class="detail-grid">
        <div class="detail-item"><div class="lbl">Name</div><div class="val">${escHtml(order.customerName || '—')}</div></div>

      </div>
    </div>

    <div class="detail-section">
      <h3>Payment</h3>
      <div class="detail-grid">
        <div class="detail-item"><div class="lbl">Method</div><div class="val">${escHtml(order.paymentMethod || '—')}</div></div>
        <div class="detail-item"><div class="lbl">Status</div><div class="val">${escHtml(order.paymentStatus || '—')}</div></div>
        <div class="detail-item"><div class="lbl">Delivery Charge</div><div class="val">AED ${Number(order.deliveryCharge).toFixed(2)}</div></div>
        <div class="detail-item"><div class="lbl">Total</div><div class="val">AED ${Number(order.totalPrice).toFixed(2)}</div></div>
      </div>
    </div>

    ${itemsHtml}`;

  $('modal-order').classList.remove('hidden');
}

function closeOrderModal() {
  $('modal-order').classList.add('hidden');
}

/* ── 10. Stock Management ──────────────────────────── */

async function loadProducts() {
  show('stock-loading');
  hide('stock-empty');
  hide('stock-error');
  $('stock-list').innerHTML = '';

  try {
    const resp = await apiGet(API.PRODUCTS);
    if (!resp.isSuccess) throw new Error(resp.message || 'Failed to load products.');
    state.products = resp.result || [];
    hide('stock-loading');
    if (state.products.length === 0) {
      show('stock-empty');
    } else {
      renderProductsList(state.products);
    }
  } catch (err) {
    hide('stock-loading');
    $('stock-error').textContent = err.message;
    show('stock-error');
  }
}

function renderProductsList(products) {
  const container = $('stock-list');
  container.innerHTML = '';

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = p.productId;

    let tiersHtml = '';
    if (p.priceTiers && p.priceTiers.length > 0) {
      tiersHtml = p.priceTiers.map(tier => `
        <div class="stock-tier-row">
          <div class="tier-info">
            <span class="tier-label">Qty ${tier.quantity}</span>
            <span class="tier-price">AED ${Number(tier.price).toFixed(2)}</span>
            <span class="tier-stock-badge">Stock: ${tier.stock}</span>
          </div>
          <button class="btn-edit-tier"
                  data-tier-id="${tier.productPriceId}"
                  data-product-id="${p.productId}">Edit</button>
        </div>`).join('');
    } else {
      tiersHtml = '<div class="stock-tier-row"><span class="tier-label">No price tiers found.</span></div>';
    }

    card.innerHTML = `
      ${p.imageUrl
        ? `<img class="product-img" src="${escHtml(p.imageUrl)}" alt="" loading="lazy" />`
        : `<div class="product-img"></div>`}
      <div class="product-info">
        <div class="product-name">${escHtml(p.productName || '—')}</div>
        ${p.barcode ? `<div class="product-barcode">Barcode: ${escHtml(p.barcode)}</div>` : ''}
        <div class="stock-tiers">${tiersHtml}</div>
      </div>`;

    container.appendChild(card);
  });

  // Attach tier edit listeners
  container.querySelectorAll('.btn-edit-tier').forEach(btn => {
    btn.addEventListener('click', () => {
      const tierId    = Number(btn.dataset.tierId);
      const productId = Number(btn.dataset.productId);
      const prod = state.products.find(p => p.productId === productId);
      if (!prod) return;
      const tier = prod.priceTiers.find(t => t.productPriceId === tierId);
      if (tier) openTierEditModal(tier, prod.productName || '', productId);
    });
  });
}

async function handleSaveStock(btn) {
  const tierId    = Number(btn.dataset.tierId);
  const productId = Number(btn.dataset.productId);
  const input     = document.querySelector(`.stock-input[data-tier-id="${tierId}"]`);
  const msgEl     = $(`save-msg-${tierId}`);

  if (!input) return;
  const newStock = parseInt(input.value, 10);
  if (isNaN(newStock) || newStock < 0) {
    msgEl.textContent = 'Invalid value';
    msgEl.style.color = 'red';
    return;
  }

  btn.disabled        = true;
  msgEl.textContent   = 'Saving…';
  msgEl.style.color   = 'var(--grey-4)';

  try {
    const resp = await apiPut(API.STOCK(tierId), { stock: newStock });
    if (!resp.isSuccess) throw new Error(resp.message || 'Failed to update stock.');
    input.dataset.original = String(newStock);
    msgEl.textContent = '✓ Saved';
    msgEl.style.color = 'var(--black)';

    // Update state
    const prod = state.products.find(p => p.productId === productId);
    if (prod) {
      const tier = prod.priceTiers.find(t => t.productPriceId === tierId);
      if (tier) { tier.stock = newStock; }
      prod.stockQuantity = prod.priceTiers.reduce((s, t) => s + t.stock, 0);
    }

    setTimeout(() => { msgEl.textContent = ''; }, 3000);
  } catch (err) {
    msgEl.textContent = err.message;
    msgEl.style.color = 'red';
  } finally {
    btn.disabled = false;
  }
}

function filterProducts(keyword) {
  const kw = keyword.trim().toLowerCase();
  if (!kw) {
    renderProductsList(state.products);
    return;
  }
  const filtered = state.products.filter(p =>
    (p.productName || '').toLowerCase().includes(kw) ||
    (p.productNameAr || '').toLowerCase().includes(kw) ||
    (p.barcode || '').toLowerCase().includes(kw)
  );
  if (filtered.length === 0) {
    $('stock-list').innerHTML = '';
    show('stock-empty');
  } else {
    hide('stock-empty');
    renderProductsList(filtered);
  }
}


/* ── Utilities ───────────────────────────────────── */

/**
 * Shows an error element with a fresh slide-down animation each time.
 * Re-triggers the animation by removing and re-adding the class.
 */
function showError(id, message) {
  const el = $(id);
  if (!el) return;
  el.textContent = message;
  // Force animation replay: hide → reflow → show
  el.classList.add('hidden');
  el.classList.remove('error-msg');
  void el.offsetWidth;  // trigger reflow
  el.classList.remove('hidden');
  el.classList.add('error-msg');
}

function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(val) {
  if (!val) return '—';
  try {
    // .NET returns dates like "/Date(1234567890000)/"
    if (typeof val === 'string' && val.startsWith('/Date(')) {
      const ms = parseInt(val.match(/\d+/)[0], 10);
      return new Date(ms).toLocaleString();
    }
    return new Date(val).toLocaleString();
  } catch (_) { return String(val); }
}

/* ── 11. Dashboard init ────────────────────────────── */

function initDashboard() {
  // Load notifications tab (default active) – no server data needed
  updateNotifUI();
}

/* ── 12. Bootstrap ─────────────────────────────────── */

function init() {
  // ── Service Worker ──
  initServiceWorker();

  // ── Check existing session ──
  if (loadSession()) {
    showDashboard();
    initDashboard();
  }

  // ── Login form ──
  $('form-login').addEventListener('submit', handleLogin);

  // ── Logout ──
  $('btn-logout').addEventListener('click', handleLogout);

  // ── Tabs ──
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // ── Notifications tab ──
  $('btn-notif-toggle').addEventListener('click', toggleNotifications);

  // ── Orders tab ──
  $('btn-refresh-orders').addEventListener('click', () => loadOrders(1));
  $('btn-prev-page').addEventListener('click', () => loadOrders(state.orderPage - 1));
  $('btn-next-page').addEventListener('click', () => loadOrders(state.orderPage + 1));

  // ── Order modal ──
  $('btn-close-modal').addEventListener('click', closeOrderModal);
  $('modal-backdrop').addEventListener('click', closeOrderModal);

  // ── Stock / price edit modal ──
  $('btn-close-edit-modal').addEventListener('click', closeTierEditModal);
  $('modal-edit-backdrop').addEventListener('click', closeTierEditModal);
  $('btn-save-edit').addEventListener('click', handleSaveTierEdit);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeOrderModal(); closeTierEditModal(); }
  });

  // ── Stock tab ──
  $('btn-refresh-products').addEventListener('click', () => {
    state.products = [];
    loadProducts();
  });
  $('stock-search').addEventListener('input', e => filterProducts(e.target.value));
}

document.addEventListener('DOMContentLoaded', init);
