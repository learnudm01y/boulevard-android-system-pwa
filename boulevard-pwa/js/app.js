/* =====================================================
   Boulevard Merchant PWA – Main Application
   Sections:
     1. Configuration
     2. i18n
     3. State
     4. DOM helpers
     5. API client
     6. Auth (Login / Logout)
     7. Tab navigation
     8. Push Notifications
     9. Orders
    10. Stock Management
    11. Dashboard init
    12. Bootstrap
   ===================================================== */

/* ── 1. Configuration ──────────────────────────────── */

// Detect native Android shell: Capacitor WebView origin is http://localhost (port 80)
// which is the internal asset server. API calls must go to the real server.
// Chain: emulator:5000 → ADB reverse → host:5500 (proxy) → IIS Express:55971
const _isNativeShell = !!(window.AndroidNative !== undefined || (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()));
const BASE_URL = _isNativeShell ? 'http://10.0.2.2:5000' : '';

const API = {
  LOGIN:         `${BASE_URL}/api/v1/merchant-pwa/login`,
  ORDERS:        `${BASE_URL}/api/v1/merchant-pwa/orders`,
  PRODUCTS:      `${BASE_URL}/api/v1/merchant-pwa/products`,
  STOCK:         (id) => `${BASE_URL}/api/v1/merchant-pwa/stock/${id}`,
  BULK_STOCK:    `${BASE_URL}/api/v1/merchant-pwa/bulk-stock`,
  NOTIFICATIONS: `${BASE_URL}/api/v1/merchant-pwa/notifications`,
  REGISTER_FCM:  `${BASE_URL}/api/v1/merchant-pwa/register-fcm`,
  PUSH_SUBSCRIBE:   `${BASE_URL}/api/v1/pwa-push/subscribe`,
  PUSH_UNSUBSCRIBE: `${BASE_URL}/api/v1/pwa-push/unsubscribe`,
  PUSH_HEAL:        `${BASE_URL}/api/v1/pwa-push/heal`,
};

const STORAGE_KEY = 'blvd_pwa_session';

/* ── 2. i18n ───────────────────────────────────────── */

const STRINGS = {
  en: {
    merchantPortal:  'Boulevard Management',
    signIn:          'Sign In',
    signInDesc:      'Sign in to manage your store',
    username:        'Username',
    password:        'Password',
    enterUsername:   'Enter your username',
    enterPassword:   'Enter your password',
    logout:          'Logout',
    tabNotifications:'Notifications',
    tabOrders:       'Orders',
    tabStock:        'Stock',
    alertsTitle:     'Alerts & Notifications',
    alertsDesc:      'Real-time alerts for new orders and out-of-stock products. Checked every 7 seconds automatically.',
    recentAlerts:    'Recent Alerts',
    noNotifications: 'No notifications yet. New orders and out-of-stock alerts will appear here.',
    showOlderAlerts: 'Show older alerts',
    clearAllNotifications: 'Clear All',
    page:            'Page',
    myOrders:        'My Orders',
    ordersDesc:      'All orders assigned to your store with full shipment details.',
    refresh:         '↻ Refresh',
    stockTitle:      'Stock Management',
    stockDesc:       'Update the stock quantity for your products.',
    searchProduct:   'Search product…',
    orderDetails:    'Order Details',
    notificationsMenu:'Notifications',
    enableNotifications: 'Enable Alerts',
    disableNotifications: 'Disable Alerts',
    soundLabel:      'Notification Sound',
    testNotification:'🔔 Test Notification',
    language:        'Language',
    setupTitle:      'Stay Notified',
    setupDesc:       'Get instant alerts for new orders and out-of-stock products.',
    allow:           'Allow',
    notNow:          'Not Now',
    lastChecked:     'Last checked',
    checking:        'Checking…',
    checkFailed:     'Check failed — retrying…',
    notifGranted:    'Notifications are ON',
    notifDenied:     'Notifications are OFF',
    soundOn:         'Sound ON',
    soundOff:        'Sound muted',
    notifEnabled:    'Notifications enabled!',
    notifDisabled:   'Notifications disabled.',
    testSent:        'Test notification sent!',
    permDenied:      'Permission denied. Enable notifications in your device settings.',
    notifNotSupported:'Notifications not supported on this browser.',
    newOrder:        'new order',
    newOrders:       'new orders',
    outOfStock:      'out-of-stock',
    connecting:      'Connecting…',
    saving:          'Saving…',
    saved:           'Saved',
    saveError:       'Save failed',
    noOrders:        'No orders found.',
    noProducts:      'No products found.',
    loadingOrders:   'Loading orders…',
    loadingProducts: 'Loading products…',
    close:           'Close',
    prev:            '← Prev',
    next:            'Next →',
    // Stock Excel
    stockExcel:      'Stock Excel',
    exportStock:     '↓ Export CSV',
    importStock:     '↑ Import CSV',
    edit:            'Edit',
    editTierTitle:   'Edit Tier',
    tierQtyLabel:    'Qty',
    stockQtyLabel:   'Stock Quantity',
    priceLabel:      'Price (AED)',
    saveChanges:     'Save Changes',
    exporting:       'Exporting…',
    importing:       'Importing…',
    exportedRows:    'Exported {n} rows.',
    exportFailed:    'Export failed',
    exportCancelled: 'Export cancelled.',
    savedToDownloads:'File saved to Documents/boulevard — open your Files app to find it.',
    exportSaving:    'Saving file…',
    csvEmpty:        'File is empty.',
    csvBadHeaders:   'Could not find required columns (ID, Price, Stock) in the file.',
    csvNoValid:      'No valid rows to import.',
    importDone:      'Import complete: {u} updated, {s} skipped.',
    importFailed:    'Import failed',
    // Order / stock labels
    customerLabel:      'Customer',
    orderDateLabel:     'Order Date',
    deliveryDateLabel:  'Delivery Date',
    paymentMethodLabel: 'Payment',
    payStatusLabel:     'Pay Status',
    pickupDateLabel:    'Pickup Date',
    viewDetails:        'View Details',
    ofWord:             'of',
    showingWord:        'Showing',
    ordersUnit:         'orders',
    productsUnit:       'products',
    orderItemsTitle:    'Order Items',
    imageCol:           'Image',
    productCol:         'Product',
    barcodeCol:         'Barcode',
    qtyCol:             'Qty',
    unitAedCol:         'Unit (AED)',
    totalAedCol:        'Total (AED)',
    orderInfoTitle:     'Order Info',
    orderIdLabel:       'Order ID',
    statusLabel:        'Status',
    canceledLabel:      'Canceled',
    yesWord:            'Yes',
    noWord:             'No',
    commentsLabel:      'Comments',
    customerTitle:      'Customer',
    nameLabel:          'Name',
    paymentTitle:       'Payment',
    methodLabel:        'Method',
    deliveryChargeLabel:'Delivery Charge',
    totalLabel:         'Total',
    deliveryAddress:    'Delivery Address',
    viewMap:            'Map',
    viewOnMap:          'View on Map',
    orderTracking:      'Order Tracking',
    phoneLabel:         'Phone',
    stockColon:         'Stock',
    barcodeColon:       'Barcode',
    loadFailed:      'Failed to load data',
  },
  ar: {
    merchantPortal:  'Boulevard Management',
    signIn:          'تسجيل الدخول',
    signInDesc:      'سجّل دخولك لإدارة متجرك',
    username:        'اسم المستخدم',
    password:        'كلمة المرور',
    enterUsername:   'أدخل اسم المستخدم',
    enterPassword:   'أدخل كلمة المرور',
    logout:          'خروج',
    tabNotifications:'الإشعارات',
    tabOrders:       'الطلبات',
    tabStock:        'المخزون',
    alertsTitle:     'التنبيهات والإشعارات',
    alertsDesc:      'تنبيهات فورية للطلبات الجديدة والمنتجات غير المتوفرة. يتم التحقق تلقائياً كل 7 ثواني.',
    recentAlerts:    'آخر التنبيهات',
    noNotifications: 'لا توجد إشعارات بعد. ستظهر هنا تنبيهات الطلبات الجديدة ونفاد المخزون.',
    showOlderAlerts: 'عرض التنبيهات الأقدم',
    clearAllNotifications: 'مسح الكل',
    page:            'صفحة',
    myOrders:        'طلباتي',
    ordersDesc:      'جميع الطلبات الموكلة لمتجرك مع تفاصيل الشحن الكاملة.',
    refresh:         '↻ تحديث',
    stockTitle:      'إدارة المخزون',
    stockDesc:       'قم بتحديث كمية المخزون لمنتجاتك.',
    searchProduct:   'البحث عن منتج...',
    orderDetails:    'تفاصيل الطلب',
    notificationsMenu:'الإشعارات',
    enableNotifications: 'تفعيل التنبيهات',
    disableNotifications: 'إيقاف التنبيهات',
    soundLabel:      'صوت الإشعارات',
    testNotification:'🔔 اختبار الإشعار',
    language:        'اللغة',
    setupTitle:      'ابقَ على اطّلاع',
    setupDesc:       'احصل على تنبيهات فورية للطلبات الجديدة ونفاد المخزون.',
    allow:           'السماح',
    notNow:          'ليس الآن',
    lastChecked:     'آخر تحقق',
    checking:        'جارٍ التحقق...',
    checkFailed:     'فشل التحقق — إعادة المحاولة...',
    notifGranted:    'الإشعارات مفعّلة',
    notifDenied:     'الإشعارات معطّلة',
    soundOn:         'الصوت مفعّل',
    soundOff:        'الصوت مكتوم',
    notifEnabled:    'تم تفعيل الإشعارات!',
    notifDisabled:   'تم إيقاف الإشعارات.',
    testSent:        'تم إرسال إشعار تجريبي!',
    permDenied:      'تم رفض الإذن. فعّل الإشعارات من إعدادات جهازك.',
    notifNotSupported:'الإشعارات غير مدعومة في هذا المتصفح.',
    newOrder:        'طلب جديد',
    newOrders:       'طلبات جديدة',
    outOfStock:      'نفاد مخزون',
    connecting:      'جارٍ الاتصال...',
    saving:          'جارٍ الحفظ...',
    saved:           'تم الحفظ',
    saveError:       'فشل الحفظ',
    noOrders:        'لا توجد طلبات.',
    noProducts:      'لا توجد منتجات.',
    loadingOrders:   'جارٍ تحميل الطلبات...',
    loadingProducts: 'جارٍ تحميل المنتجات...',
    close:           'إغلاق',
    prev:            'السابق →',
    next:            '← التالي',
    // Stock Excel
    stockExcel:      'إكسل المخزون',
    exportStock:     '↓ تصدير CSV',
    importStock:     '↑ استيراد CSV',
    edit:            'تعديل',
    editTierTitle:   'تعديل الطبقة',
    tierQtyLabel:    'الكمية',
    stockQtyLabel:   'كمية المخزون',
    priceLabel:      'السعر (درهم)',
    saveChanges:     'حفظ التغييرات',
    exporting:       'جارٍ التصدير...',
    importing:       'جارٍ الاستيراد...',
    exportedRows:    'تم تصدير {n} صف.',
    exportFailed:    'فشل التصدير',
    exportCancelled: 'تم إلغاء التصدير.',
    savedToDownloads:'تم حفظ الملف في Documents/boulevard — افتح تطبيق الملفات للوصول إليه.',
    exportSaving:    'جارٍ حفظ الملف…',
    csvEmpty:        'الملف فارغ.',
    csvBadHeaders:   'تعذّر العثور على الأعمدة المطلوبة (ID وPrice وStock) في الملف.',
    csvNoValid:      'لا توجد صفوف صحيحة للاستيراد.',
    importDone:      'اكتمل الاستيراد: {u} محدَّث، {s} تم تخطيه.',
    importFailed:    'فشل الاستيراد',
    // Order / stock labels
    customerLabel:      'العميل',
    orderDateLabel:     'تاريخ الطلب',
    deliveryDateLabel:  'تاريخ التوصيل',
    paymentMethodLabel: 'الدفع',
    payStatusLabel:     'حالة الدفع',
    pickupDateLabel:    'تاريخ الاستلام',
    viewDetails:        'عرض التفاصيل',
    ofWord:             'من',
    showingWord:        'عرض',
    ordersUnit:         'طلبات',
    productsUnit:       'منتجات',
    orderItemsTitle:    'أصناف الطلب',
    imageCol:           'الصورة',
    productCol:         'المنتج',
    barcodeCol:         'الباركود',
    qtyCol:             'الكمية',
    unitAedCol:         'السعر (درهم)',
    totalAedCol:        'الإجمالي (درهم)',
    orderInfoTitle:     'معلومات الطلب',
    orderIdLabel:       'رقم الطلب',
    statusLabel:        'الحالة',
    canceledLabel:      'ملغى',
    yesWord:            'نعم',
    noWord:             'لا',
    commentsLabel:      'ملاحظات',
    customerTitle:      'العميل',
    nameLabel:          'الاسم',
    paymentTitle:       'الدفع',
    methodLabel:        'الطريقة',
    deliveryChargeLabel:'رسوم التوصيل',
    totalLabel:         'الإجمالي',
    deliveryAddress:    'عنوان التوصيل',
    viewMap:            'الخريطة',
    viewOnMap:          'عرض على الخريطة',
    orderTracking:      'تتبع الطلب',
    phoneLabel:         'الهاتف',
    stockColon:         'المخزون',
    barcodeColon:       'الباركود',
    loadFailed:      'فشل تحميل البيانات',
  }
};

function t(key) {
  return STRINGS[state.lang]?.[key] ?? STRINGS.en[key] ?? key;
}

/** Apply language/direction to the whole document and re-render all i18n elements */
function applyLanguage() {
  const root = document.getElementById('html-root');
  root.lang = state.lang;
  root.dir  = state.lang === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem('blvd_lang', state.lang);

  // Static data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  // Active language button highlight
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === state.lang);
  });

  // Dynamic elements that need manual re-render
  updateNotifUI();
  renderNotifList();
  updateNotifBadge();
  // Re-render dynamic lists with the updated language (Arabic names, translated labels)
  if (state.orders.length > 0) { renderOrdersList(); updateOrdersPagination(); }
  if (state.products.length > 0) { renderProductsList(state.products); updateStockPagination(); }
}

/* ── 3. State ──────────────────────────────────────── */
const state = {
  token:        null,
  merchantId:   null,
  merchantName: null,
  lang:         localStorage.getItem('blvd_lang') ||
                (navigator.language?.startsWith('ar') ? 'ar' : 'en'),
  soundMuted:   localStorage.getItem('blvd_sound_muted') === 'true',
  // Orders
  orders:            [],
  orderPage:         1,
  orderPageSize:     20,
  orderTotalCount:   0,
  orderTotalPages:   0,
  // Products / Stock
  products:          [],
  productPage:       1,
  productPageSize:   20,
  productSearch:     '',
  productTotalCount: 0,
  productTotalPages: 0,
  // Push notifications (SW relay)
  swRegistration:    null,
  pushSubscription:  null,
  // Notifications (polling — orders + out-of-stock)
  notifications:        [],
  notifPage:            1,
  notifUnreadCount:     0,
  latestOrderId:        0,
  knownOutOfStockIds:   new Set(),
  seenNotifKeys:        new Set(), // dedup: prevents same order/product appearing twice
  dismissedOrderIds:    new Set(), // order IDs the merchant dismissed — never shown again
  isFirstPoll:          true,
  pollingTimer:         null,
  editTier:             null,  // { tierId, productId } – tier open in the edit modal
  highlightOrderId:     null, // orderId to scroll-to when orders tab loads
  highlightProductId:   null, // productId to scroll-to when stock tab loads
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
    method:  'POST',
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

// ── Auth resilience ──────────────────────────────────
// A single transient "unauthorized" (server restart, cold start, brief network
// blip) must NEVER force the merchant to log in again. Only after several
// CONSECUTIVE genuine rejections do we clear the session. Closing/reopening the
// app keeps the session (it lives in localStorage).
let _authFailures = 0;
const MAX_AUTH_FAILURES = 5;
function noteAuthFailure() {
  _authFailures += 1;
  if (_authFailures >= MAX_AUTH_FAILURES) {
    stopPolling();
    clearSession();
    showLogin();
  }
}
function noteAuthSuccess() { _authFailures = 0; }

function showDashboard() {
  hide('screen-splash');
  hide('screen-login');
  $('screen-dashboard').classList.remove('hidden');
  $('screen-dashboard').classList.add('active');
  const bar = $('merchant-bar');
  const name = state.merchantName || '';
  if (name) {
    $('merchant-name').textContent = name;
    bar.classList.remove('hidden');
  } else {
    bar.classList.add('hidden');
  }
}

function showLogin() {
  hide('screen-splash');
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
      // ── Route Drivers to their delivery interface ──
      if (resp.result.accountType === 'Driver') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          token:        resp.result.token,
          driverId:     resp.result.merchantId || resp.result.driverId,
          merchantName: resp.result.merchantName || 'Driver',
          accountType:  'Driver',
        }));
        window.location.href = 'delivery-driver.html';
        return;
      }
      // ── Route Home-Services providers to their dedicated area (Part 5 / Part 6) ──
      if (resp.result.accountType === 'Provider') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          token:        resp.result.token,
          providerId:   resp.result.providerId,
          merchantName: resp.result.merchantName,
          accountType:  'Provider',
        }));
        window.location.href = 'home-services.html';
        return;
      }
      state.token        = resp.result.token;
      state.merchantId   = resp.result.merchantId;
      state.merchantName = resp.result.merchantName;
      saveSession();
      showDashboard();
      initDashboard();
      subscribeWebPush();
    } else {
      showError('login-error', resp.message || 'Invalid username or password.');
    }
  } catch (err) {
    console.error('[Login] fetch failed:', err);
    showError('login-error', 'Could not connect to the server. Please try again. (' + (err?.message || err) + ')');
  } finally {
    $('btn-login').disabled = false;
    show('btn-login-text');
    hide('btn-login-spinner');
  }
}

function handleLogout() {
  closeDropdown();
  stopPolling();
  clearSession();
  // Clear notification state on logout
  state.notifications      = [];
  state.notifUnreadCount   = 0;
  state.notifPage          = 1;
  state.latestOrderId      = 0;
  state.knownOutOfStockIds = new Set();
  state.seenNotifKeys      = new Set();
  state.dismissedOrderIds  = new Set();
  state.isFirstPoll        = true;
  state.pushSubscription   = null;
  localStorage.removeItem('blvd_notif_state');
  localStorage.removeItem('blvd_push_enabled');
  // Clear native session so background worker stops polling
  if (isNative()) {
    try { window.AndroidNative?.clearSession?.(); } catch (_) {}
  }
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
  if (tabId === 'tab-orders'   && state.orderTotalPages   === 0) loadOrders();
  if (tabId === 'tab-stock'    && state.productTotalPages  === 0) loadProducts();
}

/* ── 7. Push Notifications ─────────────────────────── */

/**
 * Returns true when running inside the native Android Capacitor shell.
 * Checks window.AndroidNative first (JavascriptInterface — synchronous,
 * always available before any JS runs) then falls back to Capacitor bridge
 * (async, available after bridge injection).
 */
function isNative() {
  return !!(window.AndroidNative !== undefined || window.Capacitor?.isNativePlatform?.());
}

/**
 * Waits up to `timeout` ms for Capacitor's LocalNotifications plugin to be
 * injected into window.Capacitor.Plugins. Returns the plugin or null.
 */
async function waitForLocalNotifications(timeout = 5000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (window.Capacitor?.Plugins?.LocalNotifications) {
      return window.Capacitor.Plugins.LocalNotifications;
    }
    await new Promise(r => setTimeout(r, 150));
  }
  console.warn('[PWA] Capacitor LocalNotifications plugin not found after', timeout, 'ms');
  return null;
}

// ── Capacitor local-notifications helpers ─────────────────────────────────

async function requestAndroidPermission() {
  if (!isNative()) return false;
  try {
    const LN = await waitForLocalNotifications();
    if (!LN) return false;
    const result = await LN.requestPermissions();
    return result.display === 'granted';
  } catch (err) {
    console.warn('[PWA] requestAndroidPermission error:', err);
    return false;
  }
}

async function checkAndroidPermission() {
  if (!isNative()) return false;
  try {
    const LN = await waitForLocalNotifications();
    if (!LN) return false;
    const result = await LN.checkPermissions();
    return result.display === 'granted';
  } catch (err) {
    return false;
  }
}

async function showNativeNotification(title, body, id) {
  if (!isNative()) return;
  try {
    const LN = await waitForLocalNotifications();
    if (!LN) { console.warn('[PWA] LocalNotifications unavailable'); return; }
    await LN.schedule({
      notifications: [{
        id:          id ?? (Math.floor(Math.random() * 2_000_000_000) + 1),
        title:       title,
        body:        body,
        channelId:   'boulevard_orders',
        sound:       'notification_sound.wav',
        smallIcon:   'ic_notification',
        iconColor:   '#000000',
        autoCancel:  true,
      }]
    });
  } catch (err) {
    console.warn('[PWA] showNativeNotification error:', err);
  }
}

async function testNotification() {
  closeDropdown();
  if (isNative()) {
    let granted = await checkAndroidPermission();
    if (!granted) granted = await requestAndroidPermission();
    if (!granted) {
      showToast(t('permDenied'));
      return;
    }
    await showNativeNotification(
      'Boulevard 🔔',
      t('testSent'),
      99999
    );
    playNotificationSound();
    showToast(t('testSent'));
  } else {
    if (!('Notification' in window)) { showToast(t('notifNotSupported')); return; }
    const perm = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();
    if (perm === 'granted') {
      new Notification('Boulevard 🔔', { body: t('testSent') });
      playNotificationSound();
      showToast(t('testSent'));
    } else {
      showToast(t('permDenied'));
    }
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const b64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

function updateNotifUI() {
  const subscribed = !!state.pushSubscription;

  // Sync checkboxes in dropdown + setup sheet
  const chkNotif      = $('chk-notif');
  const chkSound      = $('chk-sound');
  const chkSetupNotif = $('chk-setup-notif');
  const chkSetupSound = $('chk-setup-sound');

  if (chkNotif)      chkNotif.checked      = subscribed;
  if (chkSound)      chkSound.checked      = !state.soundMuted;
  if (chkSetupNotif) chkSetupNotif.checked = subscribed;
  if (chkSetupSound) chkSetupSound.checked = !state.soundMuted;

  // Red dot on menu button when notifications are off
  const dot = $('notif-dot');
  if (dot) {
    dot.classList.toggle('hidden', subscribed);
  }

  renderNotifList();
}

function updateNotifBadge() {
  const badge = $('notif-tab-badge');
  if (!badge) return;
  if (state.notifUnreadCount > 0) {
    badge.textContent = state.notifUnreadCount > 99 ? '99+' : String(state.notifUnreadCount);
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function renderNotifList() {
  const section = $('notif-list-section');
  const ul = $('notif-list');
  if (!ul) return;
  ul.innerHTML = '';

  if (state.notifications.length === 0) {
    ul.innerHTML = `<li class="notif-item notif-empty">${t('noNotifications')}</li>`;
    section?.classList.remove('hidden');
    hide('notif-pagination');
    hide('btn-clear-notifs');
    return;
  }

  section?.classList.remove('hidden');
  show('btn-clear-notifs');

  const list       = state.notifications.slice().reverse();
  const totalPages = Math.max(1, Math.ceil(list.length / NOTIF_PAGE_SIZE));
  state.notifPage  = Math.min(Math.max(1, state.notifPage), totalPages);
  const start      = (state.notifPage - 1) * NOTIF_PAGE_SIZE;
  const visible    = list.slice(start, start + NOTIF_PAGE_SIZE);

  visible.forEach(n => {
    const li = document.createElement('li');
    const isOrder = n.type === 'new_order';
    const isOos   = n.type === 'out_of_stock';
    const canNav  = isOrder || isOos;
    li.className = `notif-item ${isOrder ? 'notif-order' : ''} ${isOos ? 'notif-oos' : ''} ${canNav ? 'notif-clickable' : ''}`.trim();
    const icon = isOrder ? '🛒' : isOos ? '⚠️' : '🔔';
    const timeStr = n.time
      ? new Date(n.time).toLocaleString(state.lang === 'ar' ? 'ar-SA' : 'en-US')
      : '';
    li.innerHTML = `
      <span class="notif-icon">${icon}</span>
      <div class="notif-body-wrap">
        <div class="notif-title">${escHtml(n.title || t('notifications'))}</div>
        <div class="notif-body">${escHtml(n.body || '')}</div>
        <div class="notif-time">${timeStr}</div>
      </div>
      ${isOrder ? '<button class="notif-dismiss-btn" data-order-id="' + n.orderId + '" title="' + escHtml(t('dismiss')) + '">×</button>' : ''}
      ${canNav ? '<span class="notif-nav-arrow">›</span>' : ''}`;
    if (canNav) li.addEventListener('click', (e) => {
      if (e.target.classList.contains('notif-dismiss-btn')) return;
      navigateFromNotif(n);
    });
    // Dismiss button handler
    const dismissBtn = li.querySelector('.notif-dismiss-btn');
    if (dismissBtn) dismissBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const orderId = parseInt(dismissBtn.dataset.orderId, 10);
      dismissOrderNotification(orderId);
      // Also tell the server
      apiPost('/api/v1/merchant-pwa/dismiss', { orderId }).catch(() => {});
    });
    ul.appendChild(li);
  });

  // Pagination controls
  if (totalPages > 1) {
    show('notif-pagination');
    $('notif-page-label').textContent = `${t('page')} ${state.notifPage} / ${totalPages}`;
    $('btn-notif-prev').disabled = state.notifPage <= 1;
    $('btn-notif-next').disabled = state.notifPage >= totalPages;
  } else {
    hide('notif-pagination');
  }
}

function navigateFromNotif(n) {
  if (n.type === 'new_order') {
    switchTab('tab-orders');
    state.highlightOrderId = n.orderId;
    loadOrders(1);
  } else if (n.type === 'out_of_stock') {
    switchTab('tab-stock');
    state.highlightProductId = n.productId;
    const searchEl = $('stock-search');
    if (searchEl) {
      searchEl.value = n.productName || '';
      filterProducts(searchEl.value);
    }
  }
}

/** Mark a single order notification as dismissed — never show it again */
function dismissOrderNotification(orderId) {
  if (!orderId) return;
  state.dismissedOrderIds.add(orderId);
  // Also remove from in-memory list
  state.notifications = state.notifications.filter(n => !(n.type === 'new_order' && n.orderId === orderId));
  state.notifUnreadCount = Math.max(0, state.notifUnreadCount - 1);
  saveNotifState();
  renderNotifList();
  updateNotifBadge();
}

function clearAllNotifications() {
  // Advance the cursor so dismissed orders never come back
  const maxId = state.notifications.reduce((m, n) => n.type === 'new_order' ? Math.max(m, n.orderId || 0) : m, 0);
  if (maxId > state.latestOrderId) state.latestOrderId = maxId;
  state.notifications    = [];
  state.notifUnreadCount = 0;
  state.notifPage        = 1;
  updateNotifBadge();
  saveNotifState();
  renderNotifList();
}

// ── Notification Sound ─────────────────────────────────────────────────────
let _notifAudio   = null;
let _audioContext = null;
let _audioUnlocked = false;

/**
 * Unlock the AudioContext on first user interaction (browsers block autoplay).
 * Called once when the user clicks anywhere on the dashboard.
 */
function unlockAudio() {
  if (_audioUnlocked) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      _audioContext = new Ctx();
      if (_audioContext.state === 'suspended') _audioContext.resume();
    }
  } catch (_) { /* ignore */ }
  _audioUnlocked = true;
}

/**
 * Play the notification sound — respects state.soundMuted.
 */
function playNotificationSound() {
  if (state.soundMuted) return;
  // Try MP3
  try {
    if (!_notifAudio) {
      _notifAudio = new Audio('./sounds/notification.wav');
      _notifAudio.volume = 0.8;
    }
    _notifAudio.currentTime = 0;
    _notifAudio.play().catch(() => _playBeep());
    return;
  } catch (_) { /* fall through */ }
  _playBeep();
}

function _playBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    // Two short ascending tones
    [[880, 0], [1100, 0.18]].forEach(([freq, offset]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.15);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.15);
    });
    setTimeout(() => { try { ctx.close(); } catch (_) {} }, 1000);
  } catch (_) { /* silence is fine */ }
}

// ── Urgent repeating alert (Part 4) ─────────────────────────────────────────
// A new order is a critical business event, so instead of a single beep we keep
// re-alerting (sound + vibration) until the merchant ACKNOWLEDGES it (opens the
// Alerts tab, taps a notification, or clears the list).
//
// Platform note: while the PWA is fully CLOSED a web page cannot play audio — the
// OS notification (delivered via the service worker / FCM, shown with
// requireInteraction:true + a vibration pattern) is the strongest signal the
// browser/OS permits. This repeating in-app alarm covers the foreground/background
// (tab hidden) cases where JS is still alive.
let _urgentTimer = null;
let _urgentStart = 0;
const URGENT_MAX_MS = 120000; // safety cap (2 min) so it can't ring forever if unattended

function startUrgentAlert() {
  stopUrgentAlert();
  _urgentStart = Date.now();
  const beat = () => {
    if (Date.now() - _urgentStart > URGENT_MAX_MS) { stopUrgentAlert(); return; }
    playNotificationSound();
    try { if (navigator.vibrate) navigator.vibrate([300, 150, 300]); } catch (_) {}
  };
  beat();
  if (document.hidden) {
    _urgentTimer = setInterval(beat, 7000);
  }
}

function stopUrgentAlert() {
  if (_urgentTimer) { clearInterval(_urgentTimer); _urgentTimer = null; }
  try { if (navigator.vibrate) navigator.vibrate(0); } catch (_) {}
}

// ── Polling ────────────────────────────────────────────────────────────────
const NOTIF_PAGE_SIZE             = 20;       // notifications shown per page
const POLL_INTERVAL_FOREGROUND_MS = 5_000;  // 5 seconds when app is visible
const POLL_INTERVAL_BACKGROUND_MS = 8_000;  // 8 seconds when backgrounded
let _pollInFlight = false; // mutex: prevents concurrent polls that cause duplicates

function saveNotifState() {
  try {
    localStorage.setItem('blvd_notif_state', JSON.stringify({
      notifications:      state.notifications.slice(-200), // keep last 200
      latestOrderId:      state.latestOrderId,
      knownOutOfStockIds: [...state.knownOutOfStockIds],
      seenNotifKeys:      [...state.seenNotifKeys].slice(-500),
      dismissedOrderIds:  [...state.dismissedOrderIds],
    }));
  } catch (_) { /* quota exceeded — ignore */ }
}

function loadNotifState() {
  try {
    const raw = localStorage.getItem('blvd_notif_state');
    if (!raw) return;
    const s = JSON.parse(raw);
    if (Array.isArray(s.notifications)) state.notifications = s.notifications;
    if (typeof s.latestOrderId === 'number') state.latestOrderId = s.latestOrderId;
    if (Array.isArray(s.knownOutOfStockIds))
      state.knownOutOfStockIds = new Set(s.knownOutOfStockIds);
    if (Array.isArray(s.seenNotifKeys))
      state.seenNotifKeys = new Set(s.seenNotifKeys);
    if (Array.isArray(s.dismissedOrderIds))
      state.dismissedOrderIds = new Set(s.dismissedOrderIds);
    // If we already have a cursor we are not on the first poll
    if (state.latestOrderId > 0) state.isFirstPoll = false;
    // Restore notification toggle preference
    if (localStorage.getItem('blvd_push_enabled') === '1') {
      state.pushSubscription = { granted: true, restored: true };
    }
  } catch (_) { /* ignore */ }
}

function saveNotifPreference(enabled) {
  try {
    localStorage.setItem('blvd_push_enabled', enabled ? '1' : '0');
  } catch (_) { /* ignore */ }
}

/** Persist session to Android SharedPreferences so the background worker can poll the API */
function saveSessionToNative() {
  if (!isNative()) return;
  try {
    let baseUrl = BASE_URL || window.location.origin;
    window.AndroidNative.saveSession(
      state.token        || '',
      String(state.merchantId   || ''),
      String(state.latestOrderId || 0),
      baseUrl,
      'Merchant'
    );
  } catch (_) { /* bridge not ready yet — will retry on next poll */ }
}

/** Start / restart the native background foreground service from JS */
function startNativeService() {
  if (!isNative()) return;
  try {
    if (window.AndroidNative.startBackgroundService) {
      window.AndroidNative.startBackgroundService();
    }
  } catch (_) { /* bridge not ready yet */ }
}

async function pollNotifications() {
  if (!state.token) return;
  if (_pollInFlight) return; // another poll is still running — skip to prevent duplicates
  _pollInFlight = true;

  try {
    const resp = await apiGet(API.NOTIFICATIONS, { lastSeenOrderId: state.latestOrderId });
    if (!resp.isSuccess) {
      // Token rejected — but tolerate transient blips; only re-login after
      // several CONSECUTIVE genuine rejections (never on a single failure).
      if (/unauthorized/i.test(resp.message || '')) {
        noteAuthFailure();
      }
      return;
    }
    noteAuthSuccess();

    const result   = resp.result || {};
    const allItems = result.notifications || [];
    const isFirst  = state.isFirstPoll;
    state.isFirstPoll = false;

    // Advance the order cursor
    if ((result.latestOrderId || 0) > state.latestOrderId)
      state.latestOrderId = result.latestOrderId;

    const newOrders     = allItems.filter(n => n.type === 'new_order');
    const outOfStock    = allItems.filter(n => n.type === 'out_of_stock');
    const currentOosIds = new Set(outOfStock.map(n => n.productId));

    let hasNew        = false;
    let newlyOosCount  = 0;
    let trulyNewCount  = 0; // orders added this poll (after dedup)

    // ── New orders (skipped on first poll) ─────────────────────────────
    if (!isFirst && newOrders.length > 0) {
      const trulyNew = newOrders.filter(n => {
        const key = `order_${n.orderId}`;
        if (state.seenNotifKeys.has(key)) return false;
        if (state.dismissedOrderIds.has(n.orderId)) return false; // merchant dismissed
        state.seenNotifKeys.add(key);
        return true;
      });
      if (trulyNew.length > 0) {
        trulyNew.forEach(n => state.notifications.push({ ...n, time: n.createdAt }));
        trulyNewCount = trulyNew.length;
        hasNew = true;
      }
    }

    // ── Out-of-stock ────────────────────────────────────────────────────
    if (isFirst) {
      // Populate the known set on first poll; show but don't sound-alert.
      state.knownOutOfStockIds = currentOosIds;
      if (outOfStock.length > 0) {
        outOfStock.forEach(n => {
          const key = `oos_${n.productId}`;
          if (!state.seenNotifKeys.has(key)) {
            state.seenNotifKeys.add(key);
            state.notifications.push({ ...n, time: n.createdAt });
          }
        });
        renderNotifList();
      }
    } else {
      // Only show products that are NEWLY out of stock since last poll.
      const newlyOos = outOfStock.filter(n => !state.knownOutOfStockIds.has(n.productId));
      state.knownOutOfStockIds = currentOosIds; // advance the OOS snapshot
      const trulyNewOos = newlyOos.filter(n => {
        const key = `oos_${n.productId}_${n.createdAt || Date.now()}`;
        if (state.seenNotifKeys.has(key)) return false;
        state.seenNotifKeys.add(key);
        return true;
      });
      newlyOosCount = trulyNewOos.length;
      if (trulyNewOos.length > 0) {
        trulyNewOos.forEach(n => state.notifications.push({ ...n, time: n.createdAt }));
        hasNew = true;
      }
    }

    if (!isFirst && hasNew) {
      state.notifUnreadCount += trulyNewCount + newlyOosCount;
      renderNotifList();
      updateNotifBadge();
      // New orders are urgent → keep alerting until the merchant acknowledges (Part 4).
      if (trulyNewCount > 0) startUrgentAlert();
      else playNotificationSound();

      // Build summary text
      const parts = [];
      if (newOrders.length > 0)
        parts.push(`${newOrders.length} new order${newOrders.length > 1 ? 's' : ''}`);
      if (newlyOosCount > 0)
        parts.push(`${newlyOosCount} out-of-stock`);

      // Native Android system-tray notification
      if (isNative() && parts.length > 0) {
        showNativeNotification('Boulevard Alert 🔔', parts.join(' · '));
      }

      // Toast only when the user is viewing another tab
      const activeTab = document.querySelector('.tab-btn.active')?.dataset?.tab;
      if (activeTab !== 'tab-notifications' && parts.length > 0) {
        showToast(`🔔 ${parts.join(' · ')}`);
      }
    }

    saveNotifState();
    saveSessionToNative(); // keep Android background worker in sync with latest cursor

    // Update the "last checked" timestamp in the UI
    const statusEl = $('notif-poll-status');
    if (statusEl) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString(
        state.lang === 'ar' ? 'ar-SA' : 'en-US',
        { hour: '2-digit', minute: '2-digit' }
      );
      statusEl.textContent = `${t('lastChecked')}: ${timeStr}`;
    }
  } catch (err) {
    console.warn('[PWA] pollNotifications error:', err);
    const statusEl = $('notif-poll-status');
    if (statusEl) statusEl.textContent = t('checkFailed');
  } finally {
    _pollInFlight = false;
  }
}

function startPolling() {
  if (state.pollingTimer) clearInterval(state.pollingTimer);
  // Immediate first poll
  pollNotifications();
  const ms = document.hidden ? POLL_INTERVAL_BACKGROUND_MS : POLL_INTERVAL_FOREGROUND_MS;
  state.pollingTimer = setInterval(pollNotifications, ms);
}

function stopPolling() {
  if (state.pollingTimer) {
    clearInterval(state.pollingTimer);
    state.pollingTimer = null;
  }
}

async function enableNotifications() {
  if (isNative()) {
    const granted = await requestAndroidPermission();
    if (!granted) {
      if ($('notif-error')) {
        $('notif-error').textContent = t('permDenied');
        show('notif-error');
      }
      return false;
    }
    state.pushSubscription = { granted: true, native: true };
    saveNotifPreference(true);
    updateNotifUI();
    showToast(t('notifEnabled'));
    return true;
  }
  if (!('Notification' in window)) {
    if ($('notif-error')) {
      $('notif-error').textContent = t('notifNotSupported');
      show('notif-error');
    }
    showToast(t('notifNotSupported'));
    return false;
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    if ($('notif-error')) {
      $('notif-error').textContent = t('permDenied');
      show('notif-error');
    }
    return false;
  }
  state.pushSubscription = { granted: true };
  saveNotifPreference(true);
  updateNotifUI();
  showToast(t('notifEnabled'));
  return true;
}

async function toggleNotifications() {
  hide('notif-error');
  if (state.pushSubscription) {
    state.pushSubscription = null;
    saveNotifPreference(false);
    updateNotifUI();
    showToast(t('notifDisabled'));
  } else {
    const ok = await enableNotifications();
    if (ok) {
      saveNotifPreference(true);
    } else {
      // Permission denied — reset toggle back to unchecked
      updateNotifUI();
    }
  }
}

function toggleSoundMute() {
  state.soundMuted = !state.soundMuted;
  localStorage.setItem('blvd_sound_muted', String(state.soundMuted));
  updateNotifUI();
  showToast(state.soundMuted ? t('soundOff') : t('soundOn'));
}

/* ── Dropdown menu ─────────────────────────────────── */

function openDropdown() {
  const dd = $('dropdown-menu');
  if (!dd) return;
  dd.classList.remove('hidden');
  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', closeDropdownOnOutside, { once: true });
  }, 10);
}

function closeDropdown() {
  $('dropdown-menu')?.classList.add('hidden');
}

function closeDropdownOnOutside(e) {
  const dd  = $('dropdown-menu');
  const btn = $('btn-menu');
  if (dd && !dd.contains(e.target) && e.target !== btn) {
    closeDropdown();
  }
}

/* ── Notification setup bottom sheet ──────────────── */

function showSetupSheet() {
  $('notif-setup-sheet')?.classList.remove('hidden');
}

function hideSetupSheet() {
  $('notif-setup-sheet')?.classList.add('hidden');
}

async function confirmSetup() {
  const wantNotif = $('chk-setup-notif')?.checked ?? true;
  const wantSound = $('chk-setup-sound')?.checked ?? true;

  state.soundMuted = !wantSound;
  localStorage.setItem('blvd_sound_muted', String(state.soundMuted));

  if (wantNotif) {
    await enableNotifications();
  }

  localStorage.setItem('blvd_notif_setup_done', '1');
  hideSetupSheet();
  updateNotifUI();
}

/* ── Pull-to-refresh ───────────────────────────────── */

function initPullToRefresh() {
  let startY = 0;
  let pulling = false;
  const threshold = 80;

  document.addEventListener('touchstart', e => {
    if (window.scrollY === 0) startY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!startY) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 40 && window.scrollY === 0) {
      pulling = true;
      show('ptr-indicator');
    }
  }, { passive: true });

  document.addEventListener('touchend', async () => {
    if (pulling) {
      hide('ptr-indicator');
      await refreshApp();
    }
    startY  = 0;
    pulling = false;
  });
}

async function refreshApp() {
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration('./sw.js');
      if (reg) await reg.update(); // pull latest sw.js — activates new version if deployed
    }
  } catch (_) { /* non-fatal */ }
  window.location.reload();
}

async function waitForPushNotifications(timeout = 5000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (window.Capacitor?.Plugins?.PushNotifications) {
      return window.Capacitor.Plugins.PushNotifications;
    }
    await new Promise(r => setTimeout(r, 150));
  }
  return null;
}

async function registerFcmToken() {
  if (!isNative()) return;
  try {
    const PN = await waitForPushNotifications(4000);
    if (!PN) { console.warn('[PWA] PushNotifications plugin not found'); return; }

    const permResult = await PN.requestPermissions();
    if (permResult.receive !== 'granted') return;

    await PN.register();

    PN.addListener('registration', async (token) => {
      state.fcmToken = token.value;
      if (!state.token) return;
      try {
        await apiPost(API.REGISTER_FCM, { fcmToken: token.value });
        console.log('[PWA] FCM token registered');
      } catch (_) {}
    });

    PN.addListener('pushNotificationReceived', (notif) => {
      // Foreground: app is open — show local notification + sound
      playNotificationSound();
      const body = notif.body || '';
      const data = notif.data || {};
      if (data.type === 'new_order' || !data.type) {
        const n = { type: 'new_order', message: body, time: new Date().toISOString() };
        state.notifications.push(n);
        state.notifUnreadCount++;
        renderNotifList();
        updateNotifBadge();
        showToast(`🔔 ${body}`);
        if (isNative()) showNativeNotification('Boulevard 🔔', body);
      }
    });

    PN.addListener('pushNotificationActionPerformed', () => {
      // User tapped the background push — open notifications tab
      switchTab('tab-notifications');
      state.notifUnreadCount = 0;
      updateNotifBadge();
    });
  } catch (err) {
    console.warn('[PWA] registerFcmToken error:', err);
  }
}

async function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    // Track whether a SW was controlling this page BEFORE this registration.
    // First install → no controller → we won’t auto-reload (page is already fresh).
    // Subsequent update → controller existed → new SW activated → auto-reload.
    const hadController = !!navigator.serviceWorker.controller;

    const reg = await navigator.serviceWorker.register('./sw.js');
    state.swRegistration = reg;

    // Check for existing browser push subscription
    const sub = await reg.pushManager.getSubscription();
    if (sub) state.pushSubscription = sub;

    // Listen for messages relayed from the SW
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data?.type === 'PUSH_RECEIVED') {
        const n = { ...event.data.payload, time: new Date().toISOString() };
        state.notifications.push(n);
        renderNotifList();
        updateNotifBadge();
        playNotificationSound();
        showToast(`🔔 ${n.title || 'New notification'}`);
      }
      // Hard-push upgrade: SW activated after a new deployment → reload to serve
      // the freshly cached version without any user action required.
      if (event.data?.type === 'SW_UPDATED' && hadController) {
        window.location.reload();
      }
    });
  } catch (err) {
    console.warn('[PWA] Service worker registration failed:', err);
  }
}

const VAPID_PUBLIC_KEY = 'BD5XHPdC1rzXVR4bifJVliZ18p97Y2xisjsrDmudkVyBDH14Nwny37xS33bAlVaPcyz4MSVGZmPNqSgmku37cUA=';

async function subscribeWebPush() {
  if (!state.swRegistration || !state.token) return;
  try {
    let sub = await state.swRegistration.pushManager.getSubscription();
    if (!sub) {
      sub = await state.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    state.pushSubscription = sub;

    const rawKey = sub.getKey ? sub.getKey('p256dh') : null;
    const rawAuth = sub.getKey ? sub.getKey('auth') : null;
    if (!rawKey || !rawAuth) return;

    const p256dh = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
    const auth = btoa(String.fromCharCode(...new Uint8Array(rawAuth)));

    const resp = await apiPost(API.PUSH_SUBSCRIBE, {
      endpoint: sub.endpoint,
      p256dh: p256dh,
      auth: auth,
    });
    if (resp.isSuccess) {
      console.log('[PWA] Web Push subscription saved');
    }
  } catch (err) {
    console.warn('[PWA] subscribeWebPush error:', err);
  }
}

async function healPushSubscriptions() {
  if (!state.swRegistration || !state.token) return;
  try {
    const sub = await state.swRegistration.pushManager.getSubscription();
    if (!sub) {
      await subscribeWebPush();
      return;
    }
    state.pushSubscription = sub;

    const rawKey = sub.getKey ? sub.getKey('p256dh') : null;
    const rawAuth = sub.getKey ? sub.getKey('auth') : null;
    if (!rawKey || !rawAuth) return;

    const p256dh = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
    const auth = btoa(String.fromCharCode(...new Uint8Array(rawAuth)));

    const resp = await apiPost(API.PUSH_HEAL, {});
    if (!resp.isSuccess) {
      await subscribeWebPush();
    }
  } catch (err) {
    console.warn('[PWA] healPushSubscriptions error:', err);
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
  $('orders-count').textContent = '';
  $('orders-page-info').textContent = '';

  try {
    const resp = await apiGet(API.ORDERS, {
      page:     state.orderPage,
      pageSize: state.orderPageSize,
    });

    if (!resp.isSuccess) throw new Error(resp.message || 'Failed to load orders.');

    const paged = resp.result || {};
    state.orders          = paged.items      || [];
    state.orderTotalCount = paged.totalCount || 0;
    state.orderTotalPages = paged.totalPages || 1;
    state.orderPage       = paged.page       || state.orderPage;

    hide('orders-loading');

    if (state.orders.length === 0) {
      show('orders-empty');
    } else {
      $('orders-count').textContent =
        `${state.orderTotalCount.toLocaleString()} ${t('ordersUnit')}`;
      renderOrdersList();
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
        <div class="order-meta-item"><strong>${t('customerLabel')}:</strong> ${escHtml(o.customerName || '—')}</div>
        <div class="order-meta-item"><strong>${t('orderDateLabel')}:</strong> ${formatDate(o.orderDateTime)}</div>
        <div class="order-meta-item"><strong>${t('deliveryDateLabel')}:</strong> ${formatDate(o.deliveryDateTime)}</div>
        <div class="order-meta-item"><strong>${t('paymentMethodLabel')}:</strong> ${escHtml(o.paymentMethod || '—')}</div>
        <div class="order-meta-item"><strong>${t('payStatusLabel')}:</strong> ${escHtml(o.paymentStatus || '—')}</div>
        ${o.deliveryAddress ? `<div class="order-meta-item order-address"><strong>${t('deliveryAddress') || 'Address'}:</strong> ${escHtml(o.deliveryAddress)}${o.deliveryLatitude && o.deliveryLongitude ? ` <a href="https://www.google.com/maps?q=${o.deliveryLatitude},${o.deliveryLongitude}" target="_blank" class="map-link">(${t('viewMap') || 'Map'})</a>` : ''}</div>` : ''}
        ${o.isScheduled ? `<div class="order-meta-item"><strong>${t('pickupDateLabel')}:</strong> ${formatDate(o.pickupDate)}</div>` : ''}
      </div>
      <div class="order-card-footer">
        <span class="order-total">AED ${Number(o.totalPrice).toFixed(2)}</span>
        <button class="btn-view-order" data-order-id="${o.orderId}">${t('viewDetails')}</button>
      </div>`;
    container.appendChild(card);

    // Scroll to and highlight if navigated here from a notification
    if (state.highlightOrderId && o.orderId === state.highlightOrderId) {
      card.classList.add('order-highlight');
      state.highlightOrderId = null;
      setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      const clearHL = () => card.classList.remove('order-highlight');
      card.addEventListener('click',      clearHL, { once: true });
      card.addEventListener('touchstart', clearHL, { once: true, passive: true });
    }
  });

  container.querySelectorAll('.btn-view-order, .order-card-header').forEach(el => {
    el.addEventListener('click', () => {
      const oid = Number(el.dataset.orderId);
      const order = state.orders.find(o => o.orderId === oid);
      if (order) openOrderModal(order);
    });
  });
}

function updateOrdersPagination() {
  const show = state.orderTotalPages > 1;
  $('orders-pagination').classList.toggle('hidden', !show);
  if (show) {
    $('page-label').textContent      = `${t('page')} ${state.orderPage} ${t('ofWord')} ${state.orderTotalPages}`;
    $('btn-prev-page').disabled      = state.orderPage <= 1;
    $('btn-next-page').disabled      = state.orderPage >= state.orderTotalPages;
    $('orders-page-info').textContent =
      `${t('showingWord')} ${state.orders.length} ${t('ofWord')} ${state.orderTotalCount.toLocaleString()}`;
  } else {
    $('orders-page-info').textContent = '';
  }
}

/* ── 9. Order detail modal ─────────────────────────── */

function openOrderModal(order) {
  $('modal-order-title').textContent = `${t('orderIdLabel')} #${order.readableOrderId || order.orderId}`;

  const statusSteps = [
    { key: 'placed',    label: 'Order Placed' },
    { key: 'confirmed', label: 'Order Confirmed' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'assigned',  label: 'Order Assigned' },
    { key: 'pickup',    label: 'Order Picked Up' },
    { key: 'ontheway',  label: 'On the Way' },
    { key: 'delivered', label: 'Delivered' }
  ];

  let currentStep = 0;
  const st = (order.orderStatus || '').toLowerCase();
  if (order.isCanceled) {
    currentStep = -1;
  } else if (st.includes('cancel')) {
    currentStep = -1;
  } else if (st.includes('deliver')) {
    currentStep = 6;
  } else if (st.includes('way') || st.includes('rider') || st.includes('courier')) {
    currentStep = 5;
  } else if (st.includes('pick')) {
    currentStep = 4;
  } else if (st.includes('assign')) {
    currentStep = 3;
  } else if (st.includes('prepar') || st.includes('process')) {
    currentStep = 2;
  } else if (st.includes('confirm') || st.includes('accept')) {
    currentStep = 1;
  } else {
    currentStep = 0;
  }

  let stepperHtml = '';
  if (order.isCanceled) {
    stepperHtml = `
      <div class="order-stepper order-stepper-canceled">
        <div class="step active canceled">
          <div class="step-dot"><span>&#10005;</span></div>
          <div class="step-label">Order Canceled</div>
        </div>
      </div>`;
  } else {
    stepperHtml = `
      <div class="order-stepper">
        ${statusSteps.map((s, i) => {
          const cls = i < currentStep ? 'completed' : i === currentStep ? 'active' : '';
          const dateLabel = i <= currentStep ? formatDate(order.orderDateTime) : '';
          return `
            <div class="step ${cls}">
              <div class="step-dot"><span>${i < currentStep ? '&#10003;' : (i + 1)}</span></div>
              <div class="step-label">${s.label}</div>
              ${i === currentStep ? `<div class="step-date">${formatDate(order.orderDateTime)}</div>` : ''}
            </div>`;
        }).join('')}
      </div>`;
  }

  let addressHtml = '';
  if (order.deliveryAddress) {
    const mapUrl = order.deliveryLatitude && order.deliveryLongitude
      ? `https://www.google.com/maps?q=${order.deliveryLatitude},${order.deliveryLongitude}` : '';
    addressHtml = `
      <div class="detail-section">
        <h3>${t('deliveryAddress') || 'Delivery Address'}</h3>
        <div class="detail-grid">
          <div class="detail-item detail-item-full">
            <div class="val">${escHtml(order.deliveryAddress)}</div>
            ${mapUrl ? `<div class="val"><a href="${escHtml(mapUrl)}" target="_blank" class="map-link">${t('viewOnMap') || 'View on Map'}</a></div>` : ''}
          </div>
        </div>
      </div>`;
  }

  let itemsHtml = '';
  if (order.items && order.items.length) {
    itemsHtml = `
      <div class="detail-section">
        <h3>${t('orderItemsTitle')}</h3>
        <table class="order-items-table">
          <thead>
            <tr>
              <th>${t('imageCol')}</th>
              <th>${t('productCol')}</th>
              <th>${t('barcodeCol')}</th>
              <th>${t('qtyCol')}</th>
              <th>${t('unitAedCol')}</th>
              <th>${t('totalAedCol')}</th>
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
      <h3>${t('orderTracking') || 'Order Tracking'}</h3>
      ${stepperHtml}
    </div>

    <div class="detail-section">
      <h3>${t('orderInfoTitle')}</h3>
      <div class="detail-grid">
        <div class="detail-item"><div class="lbl">${t('orderIdLabel')}</div><div class="val">#${escHtml(order.readableOrderId || String(order.orderId))}</div></div>
        <div class="detail-item"><div class="lbl">${t('statusLabel')}</div><div class="val">${escHtml(order.orderStatus || '—')}</div></div>
        <div class="detail-item"><div class="lbl">${t('orderDateLabel')}</div><div class="val">${formatDate(order.orderDateTime)}</div></div>
        <div class="detail-item"><div class="lbl">${t('deliveryDateLabel')}</div><div class="val">${formatDate(order.deliveryDateTime)}</div></div>
        ${order.isScheduled ? `<div class="detail-item"><div class="lbl">${t('pickupDateLabel')}</div><div class="val">${formatDate(order.pickupDate)}</div></div>` : ''}
        <div class="detail-item"><div class="lbl">${t('canceledLabel')}</div><div class="val">${order.isCanceled ? t('yesWord') : t('noWord')}</div></div>
        ${order.comments ? `<div class="detail-item"><div class="lbl">${t('commentsLabel')}</div><div class="val">${escHtml(order.comments)}</div></div>` : ''}
      </div>
    </div>

    ${addressHtml}

    <div class="detail-section">
      <h3>${t('customerTitle')}</h3>
      <div class="detail-grid">
        <div class="detail-item"><div class="lbl">${t('nameLabel')}</div><div class="val">${escHtml(order.customerName || '—')}</div></div>
        ${order.customerPhone ? `<div class="detail-item"><div class="lbl">${t('phoneLabel') || 'Phone'}</div><div class="val">${escHtml(order.customerPhone)}</div></div>` : ''}
      </div>
    </div>

    <div class="detail-section">
      <h3>${t('paymentTitle')}</h3>
      <div class="detail-grid">
        <div class="detail-item"><div class="lbl">${t('methodLabel')}</div><div class="val">${escHtml(order.paymentMethod || '—')}</div></div>
        <div class="detail-item"><div class="lbl">${t('statusLabel')}</div><div class="val">${escHtml(order.paymentStatus || '—')}</div></div>
        <div class="detail-item"><div class="lbl">${t('deliveryChargeLabel')}</div><div class="val">AED ${Number(order.deliveryCharge).toFixed(2)}</div></div>
        <div class="detail-item"><div class="lbl">${t('totalLabel')}</div><div class="val">AED ${Number(order.totalPrice).toFixed(2)}</div></div>
      </div>
    </div>

    ${itemsHtml}`;

  $('modal-order').classList.remove('hidden');
}

function closeOrderModal() {
  $('modal-order').classList.add('hidden');
}

/* ── 10. Stock Management ──────────────────────────── */

async function loadProducts(page) {
  if (page !== undefined) state.productPage = page;

  show('stock-loading');
  hide('stock-empty');
  hide('stock-error');
  hide('stock-pagination');
  $('stock-list').innerHTML = '';
  $('stock-count').textContent = '';
  $('stock-page-info').textContent = '';

  try {
    const params = {
      page:     state.productPage,
      pageSize: state.productPageSize,
    };
    if (state.productSearch) params.search = state.productSearch;

    const resp = await apiGet(API.PRODUCTS, params);
    if (!resp.isSuccess) throw new Error(resp.message || 'Failed to load products.');

    const paged = resp.result || {};
    state.products          = paged.items      || [];
    state.productTotalCount = paged.totalCount || 0;
    state.productTotalPages = paged.totalPages || 1;
    state.productPage       = paged.page       || state.productPage;

    hide('stock-loading');
    if (state.products.length === 0) {
      show('stock-empty');
    } else {
      $('stock-count').textContent =
        `${state.productTotalCount.toLocaleString()} ${t('productsUnit')}`;
      renderProductsList(state.products);
      updateStockPagination();
    }
  } catch (err) {
    hide('stock-loading');
    $('stock-error').textContent = err.message;
    show('stock-error');
  }
}

function updateStockPagination() {
  const show = state.productTotalPages > 1;
  $('stock-pagination').classList.toggle('hidden', !show);
  if (show) {
    $('stock-page-label').textContent  = `${t('page')} ${state.productPage} ${t('ofWord')} ${state.productTotalPages}`;
    $('btn-stock-prev').disabled       = state.productPage <= 1;
    $('btn-stock-next').disabled       = state.productPage >= state.productTotalPages;
    $('stock-page-info').textContent   =
      `${t('showingWord')} ${state.products.length} ${t('ofWord')} ${state.productTotalCount.toLocaleString()}`;
  } else {
    $('stock-page-info').textContent = '';
  }
}

function renderProductsList(products) {
  const container = $('stock-list');
  container.innerHTML = '';

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = p.productId;

    // Use Arabic name when language is Arabic and the field is available
    const displayName = (state.lang === 'ar' && p.productNameAr)
      ? p.productNameAr
      : (p.productName || p.productNameAr || '—');

    let tiersHtml = '';
    if (p.priceTiers && p.priceTiers.length > 0) {
      tiersHtml = p.priceTiers.map(tier => `
        <div class="stock-tier-row">
          <div class="tier-info">
            <span class="tier-label">${t('tierQtyLabel')} ${tier.quantity}</span>
            <span class="tier-price">AED ${Number(tier.price).toFixed(2)}</span>
            <span class="tier-stock-badge">${t('stockColon')}: ${tier.stock}</span>
          </div>
          <button class="btn-edit-tier"
                  data-tier-id="${tier.productPriceId}"
                  data-product-id="${p.productId}">${t('edit')}</button>
        </div>`).join('');
    } else {
      tiersHtml = `<div class="stock-tier-row"><span class="tier-label">${t('noProducts')}</span></div>`;
    }

    card.innerHTML = `
      ${p.imageUrl
        ? `<img class="product-img" src="${escHtml(p.imageUrl)}" alt="" loading="lazy" />`
        : `<div class="product-img"></div>`}
      <div class="product-info">
        <div class="product-name">${escHtml(displayName)}</div>
        ${p.barcode ? `<div class="product-barcode">${t('barcodeColon')}: ${escHtml(p.barcode)}</div>` : ''}
        <div class="stock-tiers">${tiersHtml}</div>
      </div>`;

    container.appendChild(card);

    // Scroll to and highlight if navigated here from an out-of-stock notification
    if (state.highlightProductId && p.productId === state.highlightProductId) {
      card.classList.add('product-highlight');
      state.highlightProductId = null;
      setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      // Remove highlight immediately on first tap/click/edit
      const clearHL = () => card.classList.remove('product-highlight');
      card.addEventListener('click',      clearHL, { once: true });
      card.addEventListener('touchstart', clearHL, { once: true, passive: true });
    }
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

/* ── Stock / Price Edit Modal ─────────────────────── */

function openTierEditModal(tier, productName, productId) {
  state.editTier = { tierId: tier.productPriceId, productId };
  $('modal-edit-title').textContent = t('editTierTitle');
  $('edit-tier-info').textContent   = `${productName} — ${t('tierQtyLabel')} ${tier.quantity}`;
  $('inp-edit-stock').value         = tier.stock;
  $('inp-edit-price').value         = Number(tier.price).toFixed(2);
  // Update modal labels for current language
  const lStock = document.querySelector('label[for="inp-edit-stock"]');
  const lPrice = document.querySelector('label[for="inp-edit-price"]');
  if (lStock) lStock.textContent = t('stockQtyLabel');
  if (lPrice) lPrice.textContent = t('priceLabel');
  const btnText = $('btn-save-edit-text');
  if (btnText) btnText.textContent = t('saveChanges');
  hide('edit-error');
  $('modal-edit').classList.remove('hidden');
  $('inp-edit-stock').focus();
}

function closeTierEditModal() {
  $('modal-edit').classList.add('hidden');
  state.editTier = null;
}

async function handleSaveTierEdit() {
  const newStock = parseInt($('inp-edit-stock').value, 10);
  const newPrice = parseFloat($('inp-edit-price').value);

  if (isNaN(newStock) || newStock < 0) {
    showError('edit-error', 'Stock quantity must be a non-negative whole number.');
    return;
  }
  if (isNaN(newPrice) || newPrice < 0) {
    showError('edit-error', 'Price must be a non-negative number.');
    return;
  }

  const { tierId, productId } = state.editTier;

  $('btn-save-edit').disabled = true;
  hide('btn-save-edit-text');
  show('btn-save-edit-spinner');
  hide('edit-error');

  try {
    const resp = await apiPut(API.STOCK(tierId), { stock: newStock, price: newPrice });
    if (!resp.isSuccess) throw new Error(resp.message || 'Failed to update.');

    // Sync local state
    const prod = state.products.find(p => p.productId === productId);
    if (prod) {
      const tier = prod.priceTiers.find(t => t.productPriceId === tierId);
      if (tier) { tier.stock = newStock; tier.price = newPrice; }
      prod.stockQuantity = prod.priceTiers.reduce((s, t) => s + t.stock, 0);
    }

    closeTierEditModal();
    loadProducts(state.productPage);
    showToast('✓ ' + t('saved'));
  } catch (err) {
    showError('edit-error', err.message);
  } finally {
    $('btn-save-edit').disabled = false;
    show('btn-save-edit-text');
    hide('btn-save-edit-spinner');
  }
}

function filterProducts(keyword) {
  state.productSearch = keyword.trim();
  loadProducts(1);
}


/* ── CSV Export / Import ─────────────────────────── */

/**
 * Fetches ALL product tiers across all pages, then downloads a .csv file.
 * UTF-8 BOM ensures Arabic text displays correctly when opened in Excel.
 */
async function exportStockExcel() {
  const btn = $('btn-export-stock');
  btn.disabled = true;
  btn.textContent = t('exporting');

  // Re-use progress overlay in export mode
  const overlayIcon  = $('import-progress-icon');
  const overlayTitle = $('import-progress-title');
  if (overlayIcon)  { overlayIcon.textContent = '⬇'; overlayIcon.style.animation = 'bounce-upload 1s ease-in-out infinite'; }
  if (overlayTitle) { overlayTitle.textContent = t('exporting'); }
  setImportProgress(0, '…');

  try {
    const csvLines = [];
    csvLines.push(['Product ID', 'Price Tier ID', 'Product Name', 'Tier Quantity', 'Price (AED)', 'Stock'].join(','));

    let page = 1, totalPages = 1, totalRows = 0;

    do {
      const resp = await apiGet(API.PRODUCTS, { page, pageSize: 1000 });
      if (!resp.isSuccess) throw new Error(resp.message || t('loadFailed'));
      const paged = resp.result || {};
      totalPages = paged.totalPages || 1;

      (paged.items || []).forEach(p => {
        const name = (state.lang === 'ar' && p.productNameAr)
          ? p.productNameAr
          : (p.productName || p.productNameAr || '');
        (p.priceTiers || []).forEach(tier => {
          const safeName = '"' + name.replace(/"/g, '""') + '"';
          csvLines.push([p.productId, tier.productPriceId, safeName, tier.quantity,
            Number(tier.price).toFixed(2), tier.stock].join(','));
          totalRows++;
        });
      });

      // Bar advances by page percentage; label shows ACTUAL row count
      const pct = Math.round((page / totalPages) * 90);
      setImportProgress(pct, totalRows.toLocaleString() + ' ' + (state.lang === 'ar' ? 'صف' : 'rows'));
      page++;
    } while (page <= totalPages);

    if (totalRows === 0) { showToast(t('noProducts')); return; }

    setImportProgress(95, t('exportSaving'));

    const filename = `stock_export_${new Date().toISOString().slice(0, 10)}.csv`;
    const csvText  = '\uFEFF' + csvLines.join('\r\n');

    let saved = false;

    // ── 0. Capacitor native (Android) ─────────────────────────────────────
    if (!saved && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      const { SaveToDownloads, Filesystem, Share } = window.Capacitor.Plugins;

      // ── 0a. Native MediaStore plugin — writes directly to Downloads ───────
      //       Works on ALL Android versions (10+ via MediaStore, 9- via legacy API).
      //       No share dialog, no permission dialog — file just appears in Downloads.
      if (SaveToDownloads) {
        try {
          await SaveToDownloads.save({ filename, data: csvText });
          setImportProgress(100, '✓');
          await new Promise(r => setTimeout(r, 400));
          hideImportProgress();
          showToast('✓ ' + t('exportedRows').replace('{n}', totalRows) + ' — ' + t('savedToDownloads'));
          saved = true;
        } catch (eDl) {
          console.warn('[export] SaveToDownloads failed, falling back to share:', eDl.message);
        }
      }

      // ── 0b. Share dialog fallback (if native plugin somehow unavailable) ──
      if (!saved && Filesystem && Share) {
        try {
          const csvDir = 'boulevard';
          await Filesystem.writeFile({
            path: `${csvDir}/${filename}`,
            data: csvText,
            directory: 'DOCUMENTS',
            encoding: 'utf8',
            recursive: true,
          });
          const stat = await Filesystem.getUri({ path: `${csvDir}/${filename}`, directory: 'DOCUMENTS' });
          setImportProgress(100, '✓');
          await new Promise(r => setTimeout(r, 400));
          hideImportProgress();
          await Share.share({ title: filename, files: [stat.uri], dialogTitle: filename });
          showToast('✓ ' + t('exportedRows').replace('{n}', totalRows));
          saved = true;
        } catch (eShare) {
          if (eShare.message && (eShare.message.includes('cancel') || eShare.message.includes('Cancel') || eShare.message.includes('abort') || eShare.message.includes('Abort'))) {
            showToast(t('exportCancelled')); saved = true;
          } else {
            console.error('[export] Share failed:', eShare);
            hideImportProgress();
            showToast(t('exportFailed') + ': ' + (eShare.message || String(eShare)));
            saved = true;
          }
        }
      }

      if (!saved) {
        hideImportProgress();
        showToast(t('exportFailed') + ': plugins not ready');
        saved = true;
      }
    }

    // ── 1. File System Access API — opens native "Save As" dialog ──────────
    //    Works on Chrome 86+ desktop. NOT supported in Android WebView.
    if (!saved && typeof window.showSaveFilePicker === 'function') {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'CSV File', accept: { 'text/csv': ['.csv'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(csvText);
        await writable.close();
        saved = true;
        setImportProgress(100, '✓');
        await new Promise(r => setTimeout(r, 500));
        showToast('✓ ' + t('exportedRows').replace('{n}', totalRows));
      } catch (e) {
        if (e.name === 'AbortError') {
          showToast(t('exportCancelled')); saved = true;
        }
      }
    }

    // ── 2. Web Share API — mobile browser fallback ─────────────────────────
    if (!saved && typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
      try {
        const file = new File([csvText], filename, { type: 'text/csv;charset=utf-8;' });
        if (navigator.canShare({ files: [file] })) {
          setImportProgress(100, '✓');
          await new Promise(r => setTimeout(r, 400));
          hideImportProgress();
          await navigator.share({ files: [file], title: filename });
          showToast('✓ ' + t('exportedRows').replace('{n}', totalRows));
          saved = true;
        }
      } catch (e) {
        if (e.name === 'AbortError') {
          showToast(t('exportCancelled')); saved = true;
        }
      }
    }

    // ── 3. Classic <a download> — desktop browser last resort ──────────────
    if (!saved) {
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setImportProgress(100, '✓');
      await new Promise(r => setTimeout(r, 600));
      showToast('✓ ' + t('exportedRows').replace('{n}', totalRows) + '  —  ' + t('savedToDownloads'));
    }

  } catch (err) {
    console.error('[export] failed:', err);
    showToast(t('exportFailed') + ': ' + err.message);
  } finally {
    hideImportProgress();
    // Reset overlay back to import defaults
    if (overlayIcon)  { overlayIcon.textContent = '⬆'; overlayIcon.style.animation = 'bounce-upload 1s ease-in-out infinite'; }
    if (overlayTitle) { overlayTitle.textContent = t('importing'); }
    btn.disabled = false;
    btn.textContent = t('exportStock');
  }
}

/**
 * Parses a CSV text (with optional UTF-8 BOM) into a 2D array of strings.
 * Auto-detects delimiter: comma (standard) or semicolon (Excel on Arabic/European locale).
 * Handles quoted fields, escaped double-quotes, and CRLF/LF line endings.
 * IMPORTANT: a `"` that appears in the MIDDLE of an unquoted field (e.g. 6" wrench)
 * is treated as a literal character, NOT as the start of a quoted field.
 */
function parseCSV(text) {
  const clean = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;

  // Auto-detect delimiter from the first line
  const firstLine = clean.split(/\r?\n/)[0] || '';
  const delim = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';

  const rows = [];
  let row = [], field = '', inQuote = false, atFieldStart = true;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];

    if (inQuote) {
      if (ch === '"' && clean[i + 1] === '"') { field += '"'; i++; }  // escaped ""
      else if (ch === '"') { inQuote = false; atFieldStart = false; }  // closing quote
      else { field += ch; }
    } else {
      if (ch === '"' && atFieldStart) {
        // Only enter quote mode when `"` is the VERY FIRST char of this field.
        // A `"` mid-field (e.g. 6" screwdriver) is just a literal character.
        inQuote = true;
      } else if (ch === delim) {
        row.push(field.trim()); field = ''; atFieldStart = true;
      } else if (ch === '\n' || (ch === '\r' && clean[i + 1] === '\n')) {
        if (ch === '\r') i++;
        row.push(field.trim()); field = '';
        if (row.some(f => f !== '')) rows.push(row);
        row = []; atFieldStart = true;
      } else {
        field += ch; atFieldStart = false;
      }
    }
  }
  // flush last field/row
  row.push(field.trim());
  if (row.some(f => f !== '')) rows.push(row);
  return rows;
}

/**
 * Reads the selected .csv file, validates rows, then sends a bulk update
 * to the backend using apiPut (POST with X-Pwa-Token auth header).
 * Items are sent in batches of 100 with a progress overlay shown.
 */
async function importStockExcel(file) {
  if (!file) return;

  const btn = $('btn-import-stock');
  btn.disabled = true;
  btn.textContent = t('importing');

  setImportProgress(0, t('importing'));

  try {
    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length < 2) throw new Error(t('csvEmpty'));

    const headers  = rows[0].map(h => h.toLowerCase().trim());
    // Price Tier ID is the primary ID column (maps to ProductPriceId).
    // Fall back to a single 'id' column for legacy exports without Price Tier ID.
    let idIdx = headers.findIndex(h => h === 'price tier id' || h === 'productpriceid');
    if (idIdx === -1) idIdx = headers.findIndex(h => h === 'id');
    const stockIdx = headers.findIndex(h => h === 'stock');
    // Price is OPTIONAL — if missing, existing prices are not touched
    const priceIdx = headers.findIndex(h => h.includes('price'));

    if (idIdx === -1 || stockIdx === -1) {
      // Help debug: show what headers were actually found
      throw new Error(t('csvBadHeaders') + ' | found: [' + headers.join(', ') + ']');
    }

    const items = [], errors = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || (row.length === 1 && row[0] === '')) continue;

      const id    = parseInt(row[idIdx], 10);
      const stock = parseInt(row[stockIdx], 10);

      if (isNaN(id) || id <= 0)     { errors.push(`Row ${i + 1}: invalid ID`);    continue; }
      if (isNaN(stock) || stock < 0) { errors.push(`Row ${i + 1}: invalid stock`); continue; }

      const entry = { productPriceId: id, stock };

      // Only include price when the column exists and has a valid value
      if (priceIdx !== -1) {
        const price = parseFloat(row[priceIdx]);
        if (!isNaN(price) && price >= 0) entry.price = price;
      }

      items.push(entry);
    }

    if (items.length === 0) throw new Error(t('csvNoValid') + '\n' + errors.slice(0, 5).join('\n'));

    // Send in batches of 100 to avoid large request timeouts
    const BATCH = 100;
    const batches = [];
    for (let i = 0; i < items.length; i += BATCH) batches.push(items.slice(i, i + BATCH));

    let totalUpdated = 0, totalSkipped = 0;

    for (let b = 0; b < batches.length; b++) {
      const pct      = Math.round((b / batches.length) * 95); // go to 95%, last 5% on completion
      const rowsDone = Math.min((b + 1) * BATCH, items.length);
      const label    = `${rowsDone.toLocaleString()} / ${items.length.toLocaleString()} ${state.lang === 'ar' ? 'صف' : 'rows'}`;
      setImportProgress(pct, label);

      const resp = await apiPut(API.BULK_STOCK, { items: batches[b] });
      if (!resp.isSuccess) throw new Error(resp.message || t('importFailed'));

      totalUpdated += (resp.result?.updated || 0);
      totalSkipped += (resp.result?.skipped || 0);
    }

    setImportProgress(100, '✓');
    await new Promise(r => setTimeout(r, 700)); // let the user see 100%

    let msg = '✓ ' + t('importDone').replace('{u}', totalUpdated).replace('{s}', totalSkipped);
    if (errors.length > 0) msg += ` (${errors.length} rows skipped)`;
    showToast(msg);
    loadProducts(state.productPage);
  } catch (err) {
    console.error('[import] failed:', err);
    showToast(t('importFailed') + ': ' + err.message);
  } finally {
    hideImportProgress();
    btn.disabled = false;
    btn.textContent = t('importStock');
    $('inp-import-file').value = '';
  }
}

function setImportProgress(pct, label) {
  const modal = $('modal-import-progress');
  if (!modal) return;
  modal.classList.remove('hidden');
  $('import-progress-fill').style.width  = pct + '%';
  $('import-progress-label').textContent = label || (pct + '%');
  if (pct >= 100) {
    $('import-progress-icon').textContent = '✓';
    $('import-progress-icon').style.animation = 'none';
    $('import-progress-title').textContent = t('saved');
  }
}

function hideImportProgress() {
  const modal = $('modal-import-progress');
  if (!modal) return;
  modal.classList.add('hidden');
  $('import-progress-fill').style.width = '0%';
  $('import-progress-icon').textContent = '⬆';
  $('import-progress-icon').style.animation = '';
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
  loadNotifState();
  applyLanguage();
  updateNotifUI();
  updateNotifBadge();

  // Push session to Android background worker immediately
  saveSessionToNative();

  // Start native background service immediately (reconnects after force-kill)
  startNativeService();

  // On Android: verify permission and show setup sheet if needed
  setTimeout(() => {
    if (!isNative()) {
      if (!localStorage.getItem('blvd_notif_setup_done')) {
        showSetupSheet();
      }
      return;
    }
    checkAndroidPermission().then(granted => {
      if (granted) {
        state.pushSubscription = { granted: true, native: true };
        saveNotifPreference(true);
      } else if (!localStorage.getItem('blvd_notif_setup_done')) {
        showSetupSheet();
      }
      updateNotifUI();
    });
  }, 800);

  startPolling();
  document.addEventListener('visibilitychange', () => {
    if (!state.token) return;
    if (!document.hidden) {
      // App came to foreground — restart with fast 7s interval
      stopUrgentAlert();
      startPolling();
    } else {
      // App went to background — switch to slow 30s interval without an extra immediate poll
      if (state.pollingTimer) clearInterval(state.pollingTimer);
      state.pollingTimer = setInterval(pollNotifications, POLL_INTERVAL_BACKGROUND_MS);
    }
  });

  // Register FCM for background push
  registerFcmToken();

  // Heal Web Push subscriptions (re-subscribe if expired)
  healPushSubscriptions();
}

/* ── 12. Bootstrap ─────────────────────────────────── */

function init() {
  // Apply language immediately (before rendering anything)
  const rootEl = document.getElementById('html-root');
  if (rootEl) {
    rootEl.lang = state.lang;
    rootEl.dir  = state.lang === 'ar' ? 'rtl' : 'ltr';
  }

  initServiceWorker();

  // ── Route returning Home-Services providers / Drivers to their dedicated area ──
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.token) {
        if (s.accountType === 'Provider') {
          window.location.href = 'home-services.html';
          return;
        }
        if (s.accountType === 'Driver') {
          window.location.href = 'delivery-driver.html';
          return;
        }
      }
    }
  } catch (_) { /* ignore */ }

  if (loadSession()) {
    showDashboard();
    initDashboard();
  } else {
    showLogin();
  }

  // Stop any repeating native notification — the merchant opened the app
  try { if (isNative()) window.AndroidNative?.acknowledgeAlert?.(); } catch (_) {}

  // ── Login ──
  $('form-login').addEventListener('submit', handleLogin);

  // ── Logout ──
  $('btn-logout')?.addEventListener('click', handleLogout);

  // ── Tabs ──
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      unlockAudio();
      closeDropdown();
      switchTab(btn.dataset.tab);
      if (btn.dataset.tab === 'tab-notifications') {
        state.notifUnreadCount = 0;
        updateNotifBadge();
        try { if (isNative()) window.AndroidNative?.acknowledgeAlert?.(); } catch (_) {}
      }
    });
  });

  // ── Dropdown menu button ──
  $('btn-menu')?.addEventListener('click', e => {
    e.stopPropagation();
    const dd = $('dropdown-menu');
    if (dd?.classList.contains('hidden')) openDropdown();
    else closeDropdown();
  });

  // ── Dropdown: notification toggle ──
  $('chk-notif')?.addEventListener('change', () => toggleNotifications());

  // ── Dropdown: sound toggle ──
  $('chk-sound')?.addEventListener('change', () => toggleSoundMute());

  // ── Dropdown: test notification ──
  $('btn-notif-test')?.addEventListener('click', testNotification);

  // ── Dropdown: language buttons ──
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.lang = btn.dataset.lang;
      applyLanguage();
      closeDropdown();
    });
  });

  // ── Setup sheet ──
  $('btn-sheet-confirm')?.addEventListener('click', confirmSetup);
  $('btn-sheet-dismiss')?.addEventListener('click', () => {
    localStorage.setItem('blvd_notif_setup_done', '1');
    hideSetupSheet();
  });
  $('sheet-backdrop')?.addEventListener('click', () => {
    localStorage.setItem('blvd_notif_setup_done', '1');
    hideSetupSheet();
  });

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
    state.productSearch = '';
    $('stock-search').value = '';
    state.productTotalPages = 0;
    loadProducts(1);
  });
  $('btn-export-stock').addEventListener('click', () => { closeDropdown(); exportStockExcel(); });
  $('btn-import-stock').addEventListener('click', () => { closeDropdown(); setTimeout(() => $('inp-import-file').click(), 100); });
  $('inp-import-file').addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (file) importStockExcel(file);
  });
  let _searchDebounce;
  $('stock-search').addEventListener('input', e => {
    clearTimeout(_searchDebounce);
    _searchDebounce = setTimeout(() => filterProducts(e.target.value), 400);
  });
  $('btn-stock-prev').addEventListener('click', () => loadProducts(state.productPage - 1));
  $('btn-stock-next').addEventListener('click', () => loadProducts(state.productPage + 1));

  // ── Notifications pagination ──
  $('btn-notif-prev')?.addEventListener('click', () => { state.notifPage--; renderNotifList(); });
  $('btn-notif-next')?.addEventListener('click', () => { state.notifPage++; renderNotifList(); });
  $('btn-clear-notifs')?.addEventListener('click', clearAllNotifications);

  // ── Pull-to-refresh ──
  initPullToRefresh();

  // Unlock audio on any dashboard tap
  $('screen-dashboard').addEventListener('click', unlockAudio, { once: true });
}

document.addEventListener('DOMContentLoaded', init);
