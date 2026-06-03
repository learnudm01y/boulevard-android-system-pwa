# Boulevard Merchant PWA - Full System Architecture Report

> **Generated:** 2026-06-03 (Updated)  
> **Project Path:** `I:\entire system - boulevard\android system`  
> **Project Name:** Boulevard Merchant Portal PWA

---

## 1. Project Overview

A hybrid **Progressive Web Application (PWA)** wrapped in an **Android Capacitor** native shell. Merchants use it to sign in, view/push notifications, browse orders with detail modals, and manage product stock/price tiers against a backend API (`boulevard.r-y-x.net`).

| Attribute | Value |
|-----------|-------|
| **App ID** | `boulevard.pwa` |
| **PWA type** | Vanilla JS (no framework) |
| **Bundler** | Vite 8.x |
| **Native wrapper** | Capacitor 8.x (Android) |
| **Target SDK** | Android 35 (API 35) |
| **Min SDK** | Android 24 (API 24, Android 7.0) |
| **Push notifications** | Web Push API + Firebase Cloud Messaging (not configured) |
| **Backend** | `https://boulevard.r-y-x.net/pwa` (External API) |

---

## 2. Complete File Inventory (excluding `node_modules/` and `.git/`)

### 2.1 Root Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies (Capacitor 8.x, Vite 8.x) & scripts |
| `package-lock.json` | Locked dependency versions |
| `vite.config.js` | Build config: outputs to `dist/`, fixed filenames for SW caching |
| `capacitor.config.json` | Capacitor: appId, webDir (`dist`), dev server URL |
| `index.html` | PWA entry point (login + dashboard) |
| `.gitignore` | Ignores `node_modules`, `dist`, `.vscode`, `.idea` |

### 2.2 Source Code

| File | Lines | Purpose |
|------|-------|---------|
| `js/app.js` | 734 | Main application logic (all client code) |
| `css/style.css` | 627 | Complete stylesheet (black/white/grey palette) |
| `public/sw.js` | 78 | Service Worker (cache, push, offline) |

### 2.3 Public Static Assets

| File | Purpose |
|------|---------|
| `public/manifest.json` | Web App Manifest (standalone mode) |
| `public/new_logo.png` | Logo asset |
| `public/sw.js` | Service Worker (served as-is) |
| `public/icons/icon-192.png` | PWA icon 192x192 |
| `public/icons/icon-512.png` | PWA icon 512x512 |
| `public/icons/ic_notification.png` | Badge icon for notifications |
| `public/sounds/mixkit-arabian-mystery-harp-notification-2489.wav` | Notification sound |

### 2.4 Build Output (`dist/`)

| File | Purpose |
|------|---------|
| `dist/index.html` | Compiled HTML (Vite-injected `<script>` + `<link>`) |
| `dist/js/app.js` | Minified bundled JS |
| `dist/css/style.css` | Copied CSS (unchanged) |
| `dist/sw.js` | Copied Service Worker |
| `dist/manifest.json` | Copied manifest |
| `dist/new_logo.png` | Copied logo |
| `dist/icons/*.png` | Copied icons |
| `dist/sounds/*.wav` | Copied notification sound |

### 2.5 Android Native Shell (`android/`)

| File | Purpose |
|------|---------|
| `android/build.gradle` | Root Gradle (AGP 8.8.0, Google Services plugin) |
| `android/settings.gradle` | Module includes |
| `android/gradle.properties` | JVM args, AndroidX enabled |
| `android/local.properties` | Local SDK path |
| `android/gradlew` / `.bat` | Gradle wrapper scripts |
| `android/gradle/wrapper/gradle-wrapper.properties` | Gradle 8.14.3 |
| `android/variables.gradle` | SDK versions (minSdk 24, compileSdk 35, targetSdk 35) |
| `android/app/build.gradle` | App module build config |
| `android/app/capacitor.build.gradle` | Auto-generated Capacitor plugin deps |
| `android/app/proguard-rules.pro` | ProGuard (empty/minimal) |
| `android/app/src/main/AndroidManifest.xml` | Manifest (permissions, activity, metadata) |
| `android/app/src/main/java/boulevard/pwa/MainActivity.java` | Main activity + notification channel |
| `android/app/src/main/java/boulevard/pwa/BootReceiver.java` | Restart polling after reboot |
| `android/app/src/main/java/boulevard/pwa/OrderPollReceiver.java` | Alarm manager trigger |
| `android/app/src/main/java/boulevard/pwa/OrderPollWorker.java` | Background poll worker |
| `android/app/src/main/java/boulevard/pwa/SaveToDownloadsPlugin.java` | Capacitor plugin for CSV export |
| `android/app/src/main/res/xml/config.xml` | Capacitor config |
| `android/app/src/main/res/xml/file_paths.xml` | FileProvider paths |
| `android/app/src/main/res/xml/network_security_config.xml` | Cleartext traffic allowed |
| `android/app/src/main/res/values/strings.xml` | App strings |
| `android/app/src/main/res/values/styles.xml` | Theme styles |
| `android/app/src/main/res/layout/activity_main.xml` | Main activity layout (WebView) |
| `android/app/src/main/res/drawable/` + `mipmap-*/` | Launcher icons, splash screens |
| `android/app/src/main/res/raw/notification_sound.wav` | Notification sound |
| `android/capacitor.settings.gradle` | Auto-generated Capacitor plugin includes |
| `android/capacitor-cordova-android-plugins/` | Cordova compat layer |

### 2.6 Database Scripts

| File | Purpose |
|------|---------|
| `db_merchant_pwa_credentials.sql` | Migration: add PwaUsername, PwaPassword, PwaSessionToken to Merchants table |
| `seed_merchant_test_credentials.sql` | Seed test credentials (AFM / AFM@2026) |

### 2.7 Build Scripts

| File | Purpose |
|------|---------|
| `copy_icons.ps1` | Copy Android launcher icons from source code project |
| `gen_icons.ps1` | Generate Android launcher icons from `icon-512.png` |

---

## 3. Architecture Layers

```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                   ANDROID NATIVE SHELL (Capacitor 8.x)                  │
 │                                                                          │
 │  AndroidManifest.xml                                                     │
 │  ├─ Permissions: INTERNET, POST_NOTIFICATIONS, VIBRATE, STORAGE         │
 │  ├─ Activity: MainActivity (WebView + notification channel)              │
 │  └─ Metadata: Firebase notification icon/channel refs                    │
 │                                                                          │
 │  Java Source (boulevard.pwa)                                             │
 │  ├─ MainActivity.java         → Registers SaveToDownloadsPlugin          │
 │  │                                Creates "boulevard_orders" channel     │
 │  ├─ SaveToDownloadsPlugin.java → Capacitor plugin for CSV export         │
 │  ├─ OrderPollReceiver.java    → AlarmManager trigger every 1 min         │
 │  ├─ OrderPollWorker.java      → WorkManager polls /notifications API     │
 │  └─ BootReceiver.java         → Restarts alarm chain after reboot        │
 │                                                                          │
 │  Gradle Build (AGP 8.8.0, targetSdk 35, minSdk 24)                      │
 │  ├─ Conditionally applies google-services plugin                         │
 │  ├─ WorkManager 2.9.0 for background polling                             │
 │  └─ All Capacitor plugins included via capacitor.build.gradle            │
 ├───────────────────────────────┬─────────────────────────────────────────┤
 │      Capacitor WebView        │  Loads dist/ (or dev server URL)        │
 ├───────────────────────────────┴─────────────────────────────────────────┤
 │                      PWA FRONTEND (Vanilla JS)                          │
 │                                                                          │
 │  index.html (193 lines)                                                  │
 │  ├─ Login screen (#screen-login)                                         │
 │  ├─ Dashboard (#screen-dashboard)                                        │
 │  │   ├─ Top bar (logo, merchant name, logout)                            │
 │  │   ├─ Tab nav (Notifications, Orders, Stock)                           │
 │  │   ├─ Notifications tab (subscribe UI + saved list)                    │
 │  │   ├─ Orders tab (paginated cards + detail modal)                      │
 │  │   └─ Stock tab (product cards + price tiers + edit modal)             │
 │  ├─ Order Detail Modal (#modal-order)                                    │
 │  ├─ Stock Edit Modal (#modal-edit)  [HANDLERS MISSING]                   │
 │  └─ Toast (#toast)                                                       │
 │                                                                          │
 │  js/app.js (734 lines) — All application logic                          │
 │  ├─ API client (post/get/put with X-Pwa-Token)                           │
 │  ├─ Auth (localStorage session, login/logout flow)                       │
 │  ├─ Tab navigation with lazy-loading                                     │
 │  ├─ Push notifications (Web Push API, VAPID, SW messaging)              │
 │  ├─ Orders (paginated list, detail modal, items table)                   │
 │  ├─ Stock (product list, client-side search, inline / modal edit)        │
 │  └─ Bootstrap (SW registration, event listeners)                         │
 │                                                                          │
 │  css/style.css (627 lines) — Monochrome theme                            │
 │  ├─ Variables: black, white, 7 grey shades, radius, shadow, transitions  │
 │  ├─ Components: login card, topbar, tabs, order cards, product cards     │
 │  ├─ Modals, tables, forms, buttons, toast, spinner, error states         │
 │  └─ Responsive: @media (max-width: 480px)                                │
 │                                                                          │
 │  public/sw.js (78 lines) — Service Worker                                │
 │  ├─ Install: cache shell assets                                          │
 │  ├─ Activate: cleanup old caches, claim clients                          │
 │  ├─ Fetch: cache-first for same-origin GET                               │
 │  ├─ Push: display notification + relay to clients via postMessage        │
 │  └─ Notification click: focus or open app                                │
 │                                                                          │
 │  public/manifest.json — PWA manifest (standalone, black theme)           │
 ├───────────────────────────────┬─────────────────────────────────────────┤
 │            HTTPS               │  X-Pwa-Token Header Auth               │
 ├───────────────────────────────┴─────────────────────────────────────────┤
 │                     BACKEND API (External)                               │
 │                                                                          │
 │  BASE: https://boulevard.r-y-x.net/pwa                                   │
 │                                                                          │
 │  POST /api/v1/merchant-pwa/login          → Auth (body: user/pass)       │
 │  GET  /api/v1/merchant-pwa/orders         → Paginated orders             │
 │  GET  /api/v1/merchant-pwa/products       → Products + price tiers       │
 │  PUT  /api/v1/merchant-pwa/stock/{id}     → Update stock/price           │
 │  GET  /api/v1/merchant-pwa/notifications  → New orders (poll)            │
 ├─────────────────────────────────────────────────────────────────────────┤
 │                    DATABASE (SQL Server)                                  │
 │  Merchants table: PwaUsername, PwaPassword (plain text),                 │
 │                   PwaSessionToken columns                                 │
 └─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Detailed Component Analysis

### 4.1 Application State Management (`js/app.js:32-46`)

The app uses a single global `state` object:

```js
const state = {
    token: null,            // Auth token from login
    merchantId: null,       // Logged-in merchant ID
    merchantName: null,     // Display name in topbar
    orders: [],             // Current page of orders
    orderPage: 1,           // Current page number
    orderPageSize: 20,      // Orders per page
    hasMoreOrders: false,   // Pagination flag
    products: [],           // All products (fetched once)
    swRegistration: null,   // Service Worker registration ref
    pushSubscription: null, // Push subscription object
    notifications: [],      // In-app notification list
    editTier: null          // Currently editing tier (STUB)
};
```

**State flow:**
- Session persists via `localStorage` key `blvd_pwa_session` (token + merchantId + merchantName)
- On page load, `loadSession()` restores state from localStorage
- On logout, `clearSession()` wipes localStorage + nullifies state
- Orders/products are fetched on-demand (lazy-loaded) when tabs are first activated

### 4.2 Authentication (`js/app.js:102-190`)

| Function | Lines | Purpose |
|----------|-------|---------|
| `saveSession()` | 104-110 | Persists `{token, merchantId, merchantName}` to localStorage |
| `loadSession()` | 112-123 | Restores session from localStorage, returns boolean |
| `clearSession()` | 125-130 | Removes localStorage item and nullifies state |
| `showDashboard()` | 132-137 | Switches UI from login to dashboard, sets merchant name |
| `showLogin()` | 139-144 | Switches UI from dashboard to login screen |
| `handleLogin(e)` | 146-182 | Form submit handler: validates, POSTs to API, saves session, shows dashboard |
| `handleLogout()` | 184-190 | Clears session, resets form, shows login |

**Login flow:**
1. User submits username + password
2. `POST /api/v1/merchant-pwa/login` with JSON body
3. On success: receives `{token, merchantId, merchantName}`
4. Saves to localStorage state
5. Shows dashboard (hides login screen)
6. On error: shows error message in login form

### 4.3 Tab Navigation (`js/app.js:192-207`)

Three tabs with lazy-loading:

| Tab | Button ID | Content ID | Loads On First Visit |
|-----|-----------|------------|---------------------|
| Notifications | `tab-notif` | `tab-notif-content` | Nothing (always active) |
| Orders | `tab-orders` | `tab-orders-content` | `loadOrders(1)` |
| Stock | `tab-stock` | `tab-stock-content` | `loadProducts()` |

**Mechanism:** `switchTab(tabId)` adds/removes `active` class from tab buttons and content panels. Uses a `_loaded` flag per tab to prevent duplicate API calls.

### 4.4 Push Notifications (`js/app.js:209-332`)

| Function | Lines | Purpose |
|----------|-------|---------|
| `urlBase64ToUint8Array()` | 211-216 | Converts VAPID base64 key to Uint8Array |
| `updateNotifUI()` | 218-227 | Updates notification status card & toggle button text |
| `renderNotifList()` | 229-242 | Renders in-app notification list |
| `toggleNotifications()` | 244-306 | Subscribe/unsubscribe push |
| `initServiceWorker()` | 308-332 | Registers SW, checks existing subscription, listens for messages |

**Push flow:**
1. `initServiceWorker()` registers `./sw.js`
2. User clicks toggle → `toggleNotifications()`
3. If subscribing: checks permission, calls `PushManager.subscribe()` with VAPID key
4. Stores subscription in state + updates UI
5. If unsubscribing: calls `subscription.unsubscribe()`, updates UI
6. Incoming push → SW displays notification + `postMessage({type:'PUSH_RECEIVED'})` → client updates in-app list

**Current limitation:** VAPID public key is a placeholder (`REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY`). When detected, the code subscribes without VAPID (limited browser support).

### 4.5 Orders (`js/app.js:334-417`)

| Function | Lines | Purpose |
|----------|-------|---------|
| `loadOrders(page)` | 336-370 | Fetches paginated orders from API, renders list, manages loading/empty/error states |
| `renderOrdersList()` | 372-407 | Builds order card HTML, attaches click listeners for detail modal |
| `updateOrdersPagination()` | 409-417 | Shows/hides pagination controls, updates page label |

**Order card structure:**
- Header: Order ID (clickable) + status badge (`delivered`, `cancelled`, etc.)
- Meta: Customer name, order date, delivery date, payment type
- Footer: Total price + "View Details" button

**Pagination:** Previous/Next buttons, page tracking in state. API returns `hasMore` flag.

### 4.6 Order Detail Modal (`js/app.js:419-494`)

| Function | Lines | Purpose |
|----------|-------|---------|
| `openOrderModal(order)` | 421-490 | Populates modal with full order breakdown |
| `closeOrderModal()` | 492-494 | Hides order modal |

**Modal contents:**
- Order info section: Order ID, status, dates
- Customer section: Name, phone, address
- Payment section: Type, subtotal, delivery fee, discount, total
- Items table: Image, name, quantity, price, subtotal for each item

### 4.7 Stock Management (`js/app.js:496-633`)

| Function | Lines | Purpose |
|----------|-------|---------|
| `loadProducts()` | 498-519 | Fetches all products from API, renders cards |
| `renderProductsList(products)` | 521-571 | Builds product cards with price tiers and Edit buttons |
| `handleSaveStock(btn)` | 573-613 | Inline stock save (older UI, being replaced by modal) |
| `filterProducts(keyword)` | 615-633 | Client-side search by name, Arabic name, barcode |

**Product card structure:**
- Image (56x56 or placeholder)
- Name + barcode
- Price tier rows: quantity range | price | stock count | Edit button

**CRITICAL GAP:** Three functions referenced but **NEVER DEFINED**:

| Function | Referenced At | Purpose |
|----------|---------------|---------|
| `openTierEditModal(tier, productName, productId)` | `app.js:568` | Opens the edit modal with tier data |
| `closeTierEditModal()` | `app.js:718,719,723` | Closes the edit modal |
| `handleSaveTierEdit()` | `app.js:720` | Saves edited tier data via API |

The corresponding modal HTML exists in `index.html` (lines 160-184) with fields for:
- Info display (product name + tier label)
- Stock quantity input (`#edit-stock-count`)
- Unit price input (`#edit-unit-price`)
- Save + Cancel buttons

### 4.8 Utilities (`js/app.js:636-673`)

| Function | Lines | Purpose |
|----------|-------|---------|
| `showError(id, message)` | 642-652 | Shows error element with slide-down animation |
| `escHtml(str)` | 654-661 | HTML-entity escapes `&`, `<`, `>`, `"` |
| `formatDate(val)` | 663-673 | Parses .NET `/Date(...)/` format or ISO string to locale string |

### 4.9 Bootstrap & Event Wiring (`js/app.js:675-734`)

| Function | Lines | Purpose |
|----------|-------|---------|
| `initDashboard()` | 677-680 | Updates notification UI on dashboard load |
| `init()` | 684-733 | Bootstrap: registers SW, checks session, attaches all event listeners |

**Event listeners registered in `init()`:**

| Element | Event | Handler |
|---------|-------|---------|
| `#form-login` | submit | `handleLogin` |
| `#btn-logout` | click | `handleLogout` |
| `.tab-btn` | click | `switchTab(btn.dataset.tab)` |
| `#btn-notif-toggle` | click | `toggleNotifications` |
| `#btn-refresh-orders` | click | `loadOrders(1)` |
| `#btn-prev-page` | click | `loadOrders(state.orderPage - 1)` |
| `#btn-next-page` | click | `loadOrders(state.orderPage + 1)` |
| `#btn-close-modal` | click | `closeOrderModal` |
| `#modal-backdrop` | click | `closeOrderModal` |
| `#btn-close-edit-modal` | click | `closeTierEditModal` **(MISSING)** |
| `#modal-edit-backdrop` | click | `closeTierEditModal` **(MISSING)** |
| `#btn-save-edit` | click | `handleSaveTierEdit` **(MISSING)** |
| `document` | keydown Escape | `closeOrderModal(); closeTierEditModal();` **(MISSING)** |
| `#btn-refresh-products` | click | Clears products, calls `loadProducts` |
| `#stock-search` | input | `filterProducts(e.target.value)` |

---

## 5. API Endpoints

| Endpoint | Method | Purpose | Auth | Request | Response |
|----------|--------|---------|------|---------|----------|
| `/api/v1/merchant-pwa/login` | POST | Merchant authentication | None | `{username, password}` | `{token, merchantId, merchantName}` |
| `/api/v1/merchant-pwa/orders?page=N&pageSize=20` | GET | Paginated orders list | `X-Pwa-Token` | Query params | Orders array + pagination meta |
| `/api/v1/merchant-pwa/products` | GET | All products with tiers | `X-Pwa-Token` | None | Products array with price tiers |
| `/api/v1/merchant-pwa/stock/{tierId}` | PUT | Update stock/price | `X-Pwa-Token` | `{stock, unitPrice}` | Updated tier object |
| `/api/v1/merchant-pwa/notifications?lastSeenOrderId=N` | GET | Poll for new orders (native) | `X-Pwa-Token` | Query params | `{latestOrderId, items: [{type, orderId}]}` |

**API Client functions (`js/app.js:70-100`):**
- `apiPost(url, body)` → POST with JSON body
- `apiGet(url, params)` → GET with query params + `X-Pwa-Token`
- `apiPut(url, body)` → PUT with JSON body + `X-Pwa-Token`

---

## 6. CSS Architecture (`css/style.css`, 627 lines)

### 6.1 Design System

Monochrome (black/white/grey) palette defined in `:root` variables:

```css
--black: #000000;
--white: #ffffff;
--grey-100: #f5f5f5;
--grey-200: #eeeeee;
--grey-300: #e0e0e0;
--grey-400: #bdbdbd;
--grey-500: #9e9e9e;
--grey-600: #757575;
--grey-700: #616161;
--radius: 8px;
--shadow: 0 2px 8px rgba(0,0,0,0.08);
--transition: 0.2s ease;
```

### 6.2 Component Classes

| Class | Lines | Purpose |
|-------|-------|---------|
| `.screen` | 36-38 | Full-width viewport sections |
| `.login-card` | 49-57 | White centered login card |
| `.topbar` | 213-223 | Sticky black header bar |
| `.tab-btn` | 250-266 | Navigation tabs with SVG icons |
| `.notif-status-card` | 292-301 | Push notification status card |
| `.order-card` | 342-349 | Order item card |
| `.product-card` | 438-448 | Product item card |
| `.stock-tier-row` | 466-472 | Price tier row in product card |
| `.modal-box` | 522-533 | Modal dialog container |
| `.detail-grid` | 564-568 | Label/value grid in order detail |
| `.order-items-table` | 573-600 | Items table in order detail |
| `.toast` | 603-618 | Fixed bottom-center toast notification |

### 6.3 Missing CSS Classes (referenced but not defined)

| Class | Used In | Purpose |
|-------|---------|---------|
| `.modal-box--sm` | `index.html:162` | Smaller modal variant for stock edit |
| `.modal-field` | `index.html:170,174` | Form field in edit modal |
| `.edit-tier-info` | `index.html:168` | Info paragraph in edit modal |
| `.btn-edit-tier` | `app.js:539` | Edit button in stock tier rows |

---

## 7. Service Worker (`public/sw.js`, 78 lines)

### Lifecycle Events

| Event | Lines | Behavior |
|-------|-------|----------|
| `install` | 17-21 | Opens cache `boulevard-pwa-v1`, pre-caches 6 assets. Calls `skipWaiting()` |
| `activate` | 24-30 | Deletes old caches. Calls `clients.claim()` |
| `fetch` | 33-42 | Cache-first for same-origin GET. Falls back to network |
| `push` | 45-66 | Parses JSON data, calls `showNotification()`, relays to clients via `postMessage` |
| `notificationclick` | 69-78 | Closes notification. Focuses existing window or opens new to `./index.html` |

### Cache Strategy

- **Cache name:** `boulevard-pwa-v1`
- **Pre-cached assets:** `/`, `/index.html`, `/css/style.css`, `/js/app.js`, `/manifest.json`, `/new_logo.png`
- **Strategy:** Cache-first only (no stale-while-revalidate for dynamic content)
- **Offline:** Only pre-cached shell available; API data not cached

### Issue
- Path `/../new_logo.png` in pre-cache list may not resolve correctly (path traversal)

---

## 8. Android Native Layer

### 8.1 MainActivity.java

- Extends `BridgeActivity` (Capacitor)
- Registers `SaveToDownloadsPlugin`
- Creates notification channel `"boulevard_orders"` with:
  - Custom sound from `/raw/notification_sound.wav`
  - `IMPORTANCE_HIGH`
  - Vibration pattern `[0, 200, 100, 200]`
  - Badge enabled

### 8.2 SaveToDownloadsPlugin.java

Capacitor plugin `@CapacitorPlugin(name = "SaveToDownloads")` with method `save(PluginCall call)`:
- Receives `filename` and `data` (string) parameters
- Writes UTF-8 bytes to `Documents/boulevard/` directory
- **Android 10+:** Uses `MediaStore.Files` with `RELATIVE_PATH = "Documents/boulevard/"`
- **Android 9-:** Uses `Environment.getExternalStoragePublicDirectory(DOCUMENTS)` + `FileOutputStream`
- MIME type hardcoded to `"text/csv"`
- Returns `{ saved: true, filename }` on success

### 8.3 Background Polling System

Two-layer native chain for polling new orders in background:

```
AlarmManager (OrderPollReceiver)
  │  Fires every ~60 seconds (setExactAndAllowWhileIdle)
  │  Action: "boulevard.pwa.POLL_ORDERS"
  │
  └─► WorkManager (OrderPollWorker)
       │  HTTP GET to /api/v1/merchant-pwa/notifications
       │  Reads token + lastSeenOrderId from SharedPreferences
       │
       └─► If new orders found
            │  Updates lastSeenOrderId in SharedPreferences
            │  Shows Android system notification (Arabic)
            │  "طلب جديد وصل إلى متجرك" / "N طلبات جديدة وصلت إلى متجرك"
```

**OrderPollWorker.java details:**
- SharedPreferences: `"blvd_prefs"` with keys `token`, `latestOrderId`, `baseUrl`
- Fallback base URL: `"https://boulevard.r-y-x.net"`
- Poll URL: `${baseUrl}/api/v1/merchant-pwa/notifications?lastSeenOrderId=N`
- On 401/403 → clears token (stops polling)
- On non-200 → `Result.retry()`
- Notification ID: `2001`, Channel: `"boulevard_orders"`
- Uses custom string parsing (no JSON library)

**BootReceiver.java:**
- BroadcastReceiver that restarts alarm chain after device reboot or app update
- Reads SharedPreferences `token` key; if present, calls `OrderPollReceiver.scheduleNextAlarm(context)`

### 8.4 AndroidManifest.xml Permissions

| Permission | Purpose |
|------------|---------|
| `INTERNET` | API communication |
| `POST_NOTIFICATIONS` | Android 13+ notification permission |
| `VIBRATE` | Notification vibration |
| `READ_EXTERNAL_STORAGE` | Legacy file access |
| `WRITE_EXTERNAL_STORAGE` | Legacy file access |

### 8.5 Known Android Issues

- **No `google-services.json`** — Firebase Cloud Messaging is non-functional
- **BroadcastReceivers not declared** in AndroidManifest — `BootReceiver` and `OrderPollReceiver` may not work
- WorkManager enforces minimum 15-min interval, making the intended 1-minute polling ineffective

---

## 9. Build System

### 9.1 PWA Build (Vite)

```bash
npm run build    # vite build → output to dist/
npm run dev      # vite dev server (http://localhost:55970)
npm run preview  # vite preview
```

**Vite config highlights (`vite.config.js`):**
- `publicDir: 'public'` — SW, icons, manifest served as-is
- `build.outDir: 'dist'`
- Fixed filenames: `js/app.js`, `css/style.css` (no hashes for SW cache consistency)
- `build.rollupOptions.output.entryFileNames: 'js/app.js'`
- `build.rollupOptions.output.chunkFileNames: 'js/[name].js'`

### 9.2 Android Build (Gradle / Capacitor)

```bash
npx cap sync              # Sync web assets to Android
npx cap open android      # Open in Android Studio
cd android
./gradlew assembleDebug   # Debug APK
./gradlew assembleRelease # Release APK (signed)
```

**Gradle config:**
- AGP 8.8.0, Gradle 8.14.3
- compileSdk 35, targetSdk 35, minSdk 24
- Java 17 (sourceCompatibility 21 in capacitor.build.gradle)
- AndroidX enabled
- Google Services plugin conditionally applied (requires `google-services.json`)

### 9.3 Debug vs Production

| Aspect | Debug | Production |
|--------|-------|------------|
| **Server URL** | `http://10.0.2.2:55970/pwa/` | Removed (loads from `dist/` locally) |
| **Cleartext** | `true` | `false` (recommended) |
| **Build** | `npm run dev` + `npx cap run` | `npm run build` + signed APK |
| **JS** | Unbundled, source maps | Minified, single file |
| **Purpose** | Development, hot-reload | Distribution, release |

---

## 10. Current Issues & Gaps

### 10.1 CRITICAL

| Issue | Location | Details |
|-------|----------|---------|
| `openTierEditModal()` undefined | `app.js:568` | Stock edit button calls this; runtime error if clicked |
| `closeTierEditModal()` undefined | `app.js:718,719,723` | Modal close button + backdrop + Escape key all call this |
| `handleSaveTierEdit()` undefined | `app.js:720` | Save button in edit modal calls this |

### 10.2 HIGH

| Issue | Location | Details |
|-------|----------|---------|
| 3 CSS classes undefined | `index.html:162-174` | `modal-box--sm`, `modal-field`, `edit-tier-info` have no styles |
| VAPID key placeholder | `app.js:283` | `REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY` — push won't work in production |
| `google-services.json` missing | `android/app/` | Firebase FCM not configured |
| BroadcastReceivers undeclared | `AndroidManifest.xml` | `BootReceiver` and `OrderPollReceiver` not registered |
| Passwords in plain text | `db_merchant_pwa_credentials.sql` | No password hashing |

### 10.3 MEDIUM

| Issue | Location | Details |
|-------|----------|---------|
| SW path traversal | `sw.js:13` | `/../new_logo.png` may not resolve |
| `btn-edit-tier` unstyled | `app.js:539` | Edit button has no CSS class definition |
| Logo brightness filter | `css/style.css:68` | `filter: brightness(0)` may distort non-black logos |
| No offline fallback | `sw.js:33-42` | No network-first or fallback page for non-cached routes |
| Polling interval mismatch | `OrderPollReceiver.java:40` | Intended 1-min poll, but WorkManager enforces 15-min minimum |

---

## 11. Programming Roadmap — How to Continue

### Phase 1: Fix Critical Gaps (Now)

| Step | Task | Files | Effort |
|------|------|-------|--------|
| 1 | Implement `openTierEditModal(tier, productName, productId)` | `js/app.js` | ~30 min |
| 2 | Implement `closeTierEditModal()` | `js/app.js` | ~10 min |
| 3 | Implement `handleSaveTierEdit()` with API PUT call | `js/app.js` | ~30 min |
| 4 | Add missing CSS classes: `modal-box--sm`, `modal-field`, `edit-tier-info`, `btn-edit-tier` | `css/style.css` | ~20 min |
| 5 | Test the full edit modal flow end-to-end | Manual | ~30 min |

### Phase 2: Fix High Issues (Next)

| Step | Task | Files | Effort |
|------|------|-------|--------|
| 6 | Generate VAPID keys and update `app.js` | Backend + `app.js` | ~1 hr |
| 7 | Register `BootReceiver` and `OrderPollReceiver` in `AndroidManifest.xml` | `AndroidManifest.xml` | ~15 min |
| 8 | Obtain and add `google-services.json` from Firebase Console | `android/app/` | ~30 min |
| 9 | Implement server-side password hashing for PWA credentials | Database + backend | ~2 hr |

### Phase 3: Enhancements (Soon)

| Step | Task | Files | Effort |
|------|------|-------|--------|
| 10 | Add network-first strategy for API routes in Service Worker | `sw.js` | ~30 min |
| 11 | Add IndexedDB caching for orders/products for offline support | `js/app.js` | ~2 hr |
| 12 | Add pull-to-refresh on Orders and Stock tabs | `js/app.js` + `style.css` | ~1 hr |
| 13 | Localize UI to Arabic (RTL layout, Arabic strings) | `index.html`, `style.css`, `app.js` | ~3 hr |
| 14 | Add unit/price editing to the stock edit modal (already partially structured) | `js/app.js` | ~1 hr |
| 15 | Implement background sync for offline stock updates | `sw.js` + `app.js` | ~2 hr |

### Phase 4: Production Readiness

| Step | Task | Files | Effort |
|------|------|-------|--------|
| 16 | Set up CI/CD pipeline for Android builds | GitHub Actions + Gradle | ~3 hr |
| 17 | Prepare keystore for APK signing | Android Studio | ~30 min |
| 18 | Production build checklist: remove `server.url`, set `cleartext: false`, build signed APK | `capacitor.config.json` | ~30 min |
| 19 | End-to-end testing on physical devices (Android 7-15) | Manual | ~4 hr |
| 20 | Submit to Google Play Store or distribute via APK | Google Play Console | ~2 hr |

### Phase 5: Future Features

| Step | Task | Priority |
|------|------|----------|
| 21 | Add order filtering by status/date range | Medium |
| 22 | Add CSV export of orders (uses existing `SaveToDownloadsPlugin`) | Medium |
| 23 | Add dark mode toggle | Low |
| 24 | Add multiple merchant account support | Low |
| 25 | Migrate to a framework (React/Vue) for maintainability | Long-term |

---

## 12. How to Control the Application

### Development Workflow

```bash
# Terminal 1: Start Vite dev server
cd "I:\entire system - boulevard\android system"
npm run dev

# Terminal 2: Sync and run on Android emulator
npx cap sync
npx cap run android

# OR build APK directly
cd android
./gradlew assembleDebug
```

### Code Organization

```
I:\entire system - boulevard\android system\
├── index.html              # Entry point (HTML structure + modals)
├── js/app.js               # ALL JavaScript logic (auth, API, UI, state)
├── css/style.css           # ALL styles (monochrome theme)
├── public/
│   ├── sw.js               # Service Worker
│   ├── manifest.json       # PWA manifest
│   ├── new_logo.png        # App logo
│   ├── icons/              # PWA icons
│   └── sounds/             # Notification sounds
├── android/                # Android native shell (Capacitor)
│   └── app/src/main/java/boulevard/pwa/
│       ├── MainActivity.java
│       ├── BootReceiver.java
│       ├── OrderPollReceiver.java
│       ├── OrderPollWorker.java
│       └── SaveToDownloadsPlugin.java
├── vite.config.js          # Vite build config
├── capacitor.config.json   # Capacitor config
└── package.json            # Dependencies + scripts
```

### Key npm Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run dev` | `vite` | Start dev server |
| `npm run build` | `vite build` | Build PWA to `dist/` |
| `npm run preview` | `vite preview` | Preview built version |
| `npx cap sync` | Capacitor sync | Copy web assets to Android |
| `npx cap run android` | Capacitor run | Run on connected device |

---

## 13. Future Integration with External Systems (Home Services & Beyond)

### 13.1 Vision

The Boulevard Merchant PWA is designed to be the **merchant-facing frontend** of a larger ecosystem. Future integrations will connect it with **external service management platforms** (e.g., home cleaning, maintenance, repair services) and **third-party logistics/ERP systems** to create a unified commerce experience.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FUTURE ECOSYSTEM ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────┐     ┌──────────────────────┐
  │  Boulevard Merchant  │     │  External Home        │
  │  PWA (This System)   │     │  Service Platforms    │
  │                      │     │  (Cleaners, Repairs,  │
  │  - Orders            │◄───►│   Maintenance, etc.)  │
  │  - Stock             │     │                      │
  │  - Push Notifications│     │  - Service Scheduling │
  │  - Merchant Auth     │     │  - Technician Mgmt   │
  └──────────┬───────────┘     │  - CRM                │
             │                 └──────────┬───────────┘
             │                            │
             ▼                            ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │                 INTEGRATION GATEWAY (API Layer)                   │
  │                                                                   │
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
  │  │ REST API │  │ Webhooks │  │ Message  │  │ OAuth 2.0 / SSO │ │
  │  │ (OpenAPI)│  │ (Events) │  │ Queue    │  │ Identity Bridge │ │
  │  │          │  │          │  │ (Pub/Sub)│  │                  │ │
  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
  └──────────────────────────────────────────────────────────────────┘
             │                            │
             ▼                            ▼
  ┌──────────────────────┐     ┌──────────────────────┐
  │  Boulevard Backend   │     │  External Systems    │
  │  (Current API)       │     │                      │
  │                      │     │  - Home Service CRMs │
  │  - Merchants DB      │     │  - ERP (Odoo/SAP)    │
  │  - Orders DB         │     │  - Payment Gateways  │
  │  - Products DB       │     │  - Logistics/3PL     │
  │  - Notification Svc  │     │  - POS Systems       │
  └──────────────────────┘     └──────────────────────┘
```

### 13.2 Integration Patterns

#### Pattern A: REST API Bridge (Direct Integration)

The existing API at `https://boulevard.r-y-x.net/pwa` can be extended with new endpoints for external partners.

| Endpoint | Method | Purpose | External System Use |
|----------|--------|---------|-------------------|
| `/api/v2/external/service-orders` | POST | Create service order from external system | Home service platforms push new orders |
| `/api/v2/external/service-orders/{id}` | GET | Check order status | External systems poll for updates |
| `/api/v2/external/service-orders/{id}/status` | PUT | Update order status | Mark as "in progress", "completed", "cancelled" |
| `/api/v2/external/stock/sync` | POST | Bulk stock sync from warehouse/ERP | ERP pushes inventory updates |
| `/api/v2/external/products/sync` | POST | Bulk product catalog sync | External PIM systems push catalog changes |
| `/api/v2/external/merchants/{id}/availability` | PUT | Set merchant availability slots | Home service scheduling integration |

**Required changes to PWA:**
- Add a new API client method for external webhook registration
- Add UI for merchants to view/manage external service integrations
- Add settings page for API keys / integration tokens

#### Pattern B: Webhook Events (Event-Driven)

The system publishes events that external systems subscribe to via webhooks.

| Event | Payload | Trigger | External Use Case |
|-------|---------|---------|-------------------|
| `order.created` | `{orderId, merchantId, items, customer}` | New order placed | Home service platform schedules service |
| `order.status.changed` | `{orderId, oldStatus, newStatus}` | Order status update | Update external CRM |
| `stock.low` | `{productId, merchantId, currentStock}` | Stock threshold reached | Auto-reorder from supplier |
| `merchant.logged_in` | `{merchantId, timestamp}` | Merchant logs into PWA | CRM activity tracking |
| `notification.subscribed` | `{merchantId, subscription}` | Push notification enabled | Add to external notification routing |

**PWA-side implementation:**

```javascript
// Future: Webhook registration in app.js
async function registerWebhook(endpointUrl, events) {
    return await apiPost(`${BASE_URL}/api/v2/webhooks/register`, {
        url: endpointUrl,
        events: events,       // e.g. ['order.created', 'stock.low']
        secret: generateSecret(),
    });
}

// Future: Webhook management UI in merchant dashboard
function renderIntegrationsTab() {
    // List active webhooks
    // Add/remove webhook endpoints
    // View recent webhook delivery logs
    // Test webhook endpoint
}
```

#### Pattern C: OAuth 2.0 / SSO Identity Bridge

For the PWA to securely interact with external systems on behalf of the merchant:

```
1. Merchant logs into PWA (current token auth)
2. PWA redirects to external system's OAuth authorization URL
3. External system returns authorization code
4. PWA exchanges code for access + refresh tokens
5. PWA stores tokens scoped per integration
6. Subsequent API calls include external system's access token
```

**Storage in PWA state:**

```javascript
const state = {
    // ... existing state
    integrations: {
        homeServicePlatform: {
            enabled: false,
            accessToken: null,
            refreshToken: null,
            platformName: null,
            lastSyncAt: null,
        },
        erpSystem: {
            enabled: false,
            accessToken: null,
            refreshToken: null,
            platformName: null,
            lastSyncAt: null,
        },
    }
};
```

#### Pattern D: Message Queue / Pub-Sub (High Volume)

For high-throughput scenarios (e.g., real-time inventory sync across multiple channels):

```
                    ┌──────────────────┐
                    │  Message Queue   │
                    │  (RabbitMQ/Kafka)│
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
      ┌────────────┐ ┌────────────┐ ┌────────────┐
      │ PWA Backend│ │ Home       │ │ ERP /      │
      │ (Consumer) │ │ Service    │ │ Warehouse  │
      │            │ │ (Consumer) │ │ (Consumer) │
      └────────────┘ └────────────┘ └────────────┘
      ▲              ▲              ▲
      │              │              │
      └──────────────┼──────────────┘
                     │
          ┌──────────┴──────────┐
          │  All producers push │
          │  events to queue    │
          └─────────────────────┘
```

### 13.3 Home Service Management — Specific Integration

This is the most likely near-term integration. Below is a concrete plan.

#### 13.3.1 Data Mapping

| PWA Field | Home Service System Field | Direction |
|-----------|--------------------------|-----------|
| `order.orderId` | `serviceRequest.externalRef` | PWA → Home Service |
| `order.customerName` | `serviceRequest.clientName` | PWA → Home Service |
| `order.customerPhone` | `serviceRequest.clientPhone` | PWA → Home Service |
| `order.deliveryDateTime` | `serviceRequest.scheduledDate` | PWA → Home Service |
| `order.items[].productName` | `serviceRequest.serviceType` | PWA → Home Service |
| `merchant.merchantId` | `serviceProvider.providerId` | PWA → Home Service |
| `serviceRequest.status` | `order.orderStatus` | Home Service → PWA |
| `serviceRequest.technicianName` | `order.assignedTechnician` | Home Service → PWA |
| `serviceRequest.completionNotes` | `order.comments` | Home Service → PWA |

#### 13.3.2 UI Additions Needed in PWA

A new **"Services" tab** would be added to the merchant dashboard:

```html
<!-- Future: Services Tab -->
<button class="tab-btn" data-tab="tab-services">
    <svg><!-- wrench/home icon --></svg>
    Services
</button>

<div id="tab-services" class="tab-content hidden">
    <div class="section-header">
        <h2>Service Requests</h2>
        <p>Home service orders linked to your store.</p>
    </div>

    <!-- Integration status card -->
    <div class="integration-card">
        <div class="integration-status">
            <span id="svc-integration-icon" class="status-icon off"></span>
            <span id="svc-integration-label">Not Connected</span>
        </div>
        <button id="btn-svc-connect" class="btn-primary">Connect Platform</button>
    </div>

    <!-- Service requests list -->
    <div id="svc-loading" class="loading-row hidden">Loading service requests…</div>
    <div id="svc-empty" class="empty-state hidden">No service requests found.</div>
    <div id="svc-error" class="error-msg hidden"></div>
    <div id="svc-list"></div>
</div>
```

#### 13.3.3 New JavaScript Module Structure

```javascript
// Future: js/services-integration.js
// Separate module for external integration logic

const INTEGRATION_API = {
    CONNECT:    `${BASE_URL}/api/v2/integrations/connect`,
    DISCONNECT: `${BASE_URL}/api/v2/integrations/disconnect`,
    REQUESTS:   `${BASE_URL}/api/v2/integrations/service-requests`,
    SYNC:       `${BASE_URL}/api/v2/integrations/sync`,
};

const state = {
    // ...existing state
    integrations: {
        connected: false,
        platformType: null,
        platformName: null,
        serviceRequests: [],
        lastSyncAt: null,
    }
};

async function connectIntegration(platformType, apiKey) {
    // Register with external platform via backend bridge
    const resp = await apiPost(INTEGRATION_API.CONNECT, {
        platformType,  // 'home_service', 'erp', etc.
        apiKey,
        merchantId: state.merchantId,
    });
    if (resp.isSuccess) {
        state.integrations.connected = true;
        state.integrations.platformType = platformType;
        updateIntegrationUI();
    }
}

async function loadServiceRequests() {
    const resp = await apiGet(INTEGRATION_API.REQUESTS);
    if (resp.isSuccess) {
        state.integrations.serviceRequests = resp.result || [];
        renderServiceRequestsList();
    }
}

async function syncWithExternalPlatform() {
    // Bidirectional sync: push PWA data out, pull external data in
    const resp = await apiPost(INTEGRATION_API.SYNC, {
        lastSyncAt: state.integrations.lastSyncAt,
        merchantId: state.merchantId,
    });
    if (resp.isSuccess) {
        state.integrations.lastSyncAt = new Date().toISOString();
        showToast('Sync completed successfully.');
        // Refresh local data
        await loadServiceRequests();
        await loadOrders();
    }
}
```

### 13.4 Integration with Other External Systems

| System Type | Integration Method | Data Exchanged | Priority |
|-------------|-------------------|----------------|----------|
| **Home Service CRMs** (FieldEdge, Housecall Pro, Jobber) | REST API + Webhooks | Orders, schedules, customer data, technician assignments | High |
| **ERP Systems** (Odoo, SAP Business One, Microsoft Dynamics) | REST API + Batch Sync | Products, inventory, pricing, order history | High |
| **Payment Gateways** (Stripe, PayTabs, Tap, MyFatoorah) | Embedded SDK + Webhooks | Payment status, refunds, invoices | High |
| **Logistics / 3PL** (Shipa, Aramex, Fetchr) | REST API | Shipment tracking, delivery status, returns | Medium |
| **POS Systems** (Square, Toast, Shopify POS) | REST API + Webhooks | Product sync, order creation, payment sync | Medium |
| **Accounting Software** (Zoho Books, QuickBooks) | REST API + Batch | Invoice sync, expense tracking, reconciliation | Medium |
| **Marketing Platforms** (Mailchimp, HubSpot) | Webhook → Trigger | Customer activity events, push notification triggers | Low |
| **Analytics** (Google Analytics 4, Mixpanel) | SDK + Events | User behavior, order funnel, notification effectiveness | Low |

### 13.5 Integration Security Considerations

| Concern | Solution |
|---------|----------|
| **API key leakage** | Store integration keys in backend, never expose to PWA client; use short-lived tokens |
| **Webhook authenticity** | Sign webhook payloads with HMAC-SHA256; PWA verifies signature before processing |
| **OAuth token expiry** | Implement refresh token rotation; store encrypted tokens server-side |
| **Rate limiting** | Implement per-integration rate limits; queue excessive requests |
| **Data privacy** | Scope integration data to merchant-level only; never share cross-merchant data |
| **Audit logging** | Log all integration API calls with merchant ID, timestamp, and action |
| **Fail-safe** | Implement circuit breaker pattern; if external system is down, queue requests for retry |

### 13.6 PWA Refactoring for Extensibility

To support these integrations cleanly, the PWA codebase should be refactored:

```
Current:                          Future:
js/                                js/
├── app.js          (734 lines)    ├── app.js                (core bootstrap)
├── app.js          (ALL logic)    ├── auth.js               (login/session)
                                   ├── api-client.js         (HTTP layer)
                                   ├── state.js              (state management)
                                   ├── ui/
                                   │   ├── tabs.js           (tab navigation)
                                   │   ├── notifications.js  (push UI)
                                   │   ├── orders.js         (orders UI)
                                   │   ├── stock.js          (stock UI)
                                   │   └── modals.js         (modal helpers)
                                   ├── services/
                                   │   ├── sw-manager.js     (service worker)
                                   │   ├── push.js           (push subscriptions)
                                   │   └── storage.js        (localStorage/IndexedDB)
                                   └── integrations/
                                       ├── bridge.js         (integration framework)
                                       ├── home-service.js   (home service adapter)
                                       ├── erp-sync.js       (ERP sync adapter)
                                       └── webhooks.js       (webhook mgmt)
```

### 13.7 Implementation Roadmap for Integrations

| Phase | Task | Effort | Dependencies |
|-------|------|--------|-------------|
| **P1** | Design and document OpenAPI spec for external integration endpoints | ~8 hr | Backend team alignment |
| **P1** | Implement webhook registration + delivery system on backend | ~16 hr | OpenAPI spec |
| **P1** | Add `/api/v2/external/*` endpoints for service orders | ~12 hr | Database schema changes |
| **P2** | Refactor PWA JS into modular files (auth, api, ui, integrations) | ~8 hr | None |
| **P2** | Build integration settings UI (connect/disconnect platform) | ~6 hr | Refactored PWA |
| **P2** | Implement OAuth 2.0 authorization code flow in PWA | ~10 hr | Backend OAuth endpoints |
| **P3** | Build "Services" tab with service request list + detail view | ~8 hr | Integration API ready |
| **P3** | Implement bidirectional sync (push PWA data / pull external data) | ~12 hr | Webhook system ready |
| **P3** | Add technician assignment tracking and display in order detail | ~6 hr | External system data |
| **P4** | Integrate with specific home service platforms (per partnership) | ~20 hr each | Platform API access |
| **P4** | Add CSV/PDF export for service requests (uses existing plugin) | ~4 hr | None |
| **P4** | Build webhook delivery dashboard (log viewer, retry, test) | ~10 hr | Webhook system |

**Total estimated effort for full integration ecosystem: ~100-120 hours**

---

## 14. Conclusion

The system is a **vanilla JS PWA** wrapped in a **Capacitor Android** native shell. The frontend handles login, order viewing, stock management, and push notifications through a clean tab-based UI. The Android native layer adds background polling for new orders (with Arabic notifications) and a file download plugin.

The architecture is well-positioned for future integration with external systems — the modular API design, existing auth framework, and Capacitor plugin system provide a solid foundation. The key to successful integration will be:
1. **Refactoring** the monolithic `app.js` into modular files
2. **Extending** the API with standardized external endpoints (OpenAPI)
3. **Implementing** webhook event system for real-time data flow
4. **Adding** OAuth 2.0 support for secure cross-system authentication
5. **Building** the integration management UI within the existing tab framework

**Current blockers for production:**
1. Three critical JavaScript functions are missing (`openTierEditModal`, `closeTierEditModal`, `handleSaveTierEdit`)
2. Missing CSS classes for the stock edit modal
3. Firebase Cloud Messaging not configured (missing `google-services.json`)
4. VAPID public key is a placeholder
5. Android BroadcastReceivers not declared in manifest
6. Passwords stored in plain text in database

**Start with Phase 1 (Fix Critical Gaps)** — implement the three missing modal functions and their CSS styles. Then proceed through the roadmap phases to reach production readiness.

The total estimated effort to go from current state to production release is approximately **20-25 hours** spread across the five phases. Full integration ecosystem requires an additional **~100-120 hours**.
