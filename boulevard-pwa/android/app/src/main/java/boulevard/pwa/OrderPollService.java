package boulevard.pwa;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

public class OrderPollService extends Service {

    private static final String TAG = "BoulevardPollSvc";

    private static final int    FOREGROUND_NOTIF_ID       = 3001;
    private static final String CHANNEL_ID_ALERTS         = "boulevard_orders";
    private static final String CHANNEL_ID_SILENT         = "blvd_bg_v2";
    private static final long   RETRY_DELAY_MS            = 3_000L;
    private static final int    HTTP_CONNECT_MS           = 4_000;
    private static final int    HTTP_READ_MS              = 8_000;
    private static final long   REPEAT_ALERT_INTERVAL_MS  = 15_000L;
    private static final long   DRIVER_POLL_INTERVAL_MS   = 8_000L;
    private static final long   ALERT_CLEAR_GRACE_MS      = 20_000L;

    static final String KEY_HAS_ALERT      = "has_alert";
    static final String KEY_ALERT_TITLE    = "alert_title";
    static final String KEY_ALERT_BODY     = "alert_body";
    static final String KEY_ALERT_ID       = "alert_notif_id";
    private static final String KEY_ALERT_IDS_SET = "alert_notif_ids_set";

    /** IDs of assignments the driver has explicitly ignored/rejected.
     *  These are filtered client-side so ignored assignments never re-trigger alerts
     *  even if the backend briefly still returns them. */
    static final String KEY_IGNORED_ASSIGNMENT_IDS = "ignored_assignment_ids";

    private static final AtomicBoolean isForeground = new AtomicBoolean(false);

    static void setForeground(boolean fg) { isForeground.set(fg); }
    static boolean isForeground()          { return isForeground.get(); }

    private SharedPreferences prefs;
    private AtomicBoolean running = new AtomicBoolean(false);
    private PowerManager.WakeLock wakeLock;
    private static MediaPlayer alertPlayer;
    private volatile boolean alertActive = false;
    private static OrderPollService instance;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        prefs = getSharedPreferences(OrderPollWorker.PREFS, MODE_PRIVATE);
        try { ensureSilentChannel(); } catch (Exception e) { Log.e(TAG, "silent ch: " + e.getMessage()); }
        try { ensureAlertChannel();  } catch (Exception e) { Log.e(TAG, "alert ch: "  + e.getMessage()); }
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "boulevard:poll");
                wakeLock.acquire(10 * 60 * 1000L);
            }
        } catch (Exception e) {
            Log.w(TAG, "wakeLock init: " + e.getMessage());
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(FOREGROUND_NOTIF_ID, buildSilentNotification());
        if (running.compareAndSet(false, true)) {
            Executors.newSingleThreadExecutor().execute(this::longPollLoop);
            Executors.newSingleThreadExecutor().execute(this::repeatAlertLoop);
        }
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onDestroy() {
        instance = null;
        running.set(false);
        stopAlertSound();
        if (wakeLock != null && wakeLock.isHeld()) {
            try { wakeLock.release(); } catch (Exception ignored) {}
        }
        super.onDestroy();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        try {
            OrderPollReceiver.scheduleNextAlarm(getApplicationContext());
        } catch (Exception ignored) {}
        super.onTaskRemoved(rootIntent);
    }

    // ── Channels ─────────────────────────────────────────────────────

    private void ensureSilentChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm == null) return;
            NotificationChannel c = new NotificationChannel(
                CHANNEL_ID_SILENT, " ", NotificationManager.IMPORTANCE_MIN);
            c.setDescription("");
            c.setShowBadge(false);
            c.enableVibration(false);
            c.enableLights(false);
            c.setSound(null, null);
            c.setLockscreenVisibility(Notification.VISIBILITY_SECRET);
            nm.createNotificationChannel(c);
        }
    }

    private void ensureAlertChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm == null || nm.getNotificationChannel(CHANNEL_ID_ALERTS) != null) return;
            boolean isArabic = Locale.getDefault().getLanguage().equals("ar");
            NotificationChannel alerts = new NotificationChannel(
                CHANNEL_ID_ALERTS,
                isArabic ? "تنبيهات الطلبات" : "Order Alerts",
                NotificationManager.IMPORTANCE_HIGH);
            alerts.setDescription(isArabic ? "إشعارات الطلبات الجديدة" : "Notifications for new orders");
            alerts.enableVibration(true);
            alerts.setVibrationPattern(new long[]{0, 300, 100, 200, 100, 200});
            alerts.setShowBadge(true);
            int soundResId = getResources().getIdentifier("notification_sound", "raw", getPackageName());
            if (soundResId != 0) {
                alerts.setSound(
                    android.net.Uri.parse("android.resource://" + getPackageName() + "/" + soundResId),
                    new android.media.AudioAttributes.Builder()
                        .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
            }
            nm.createNotificationChannel(alerts);
        }
    }

    // ── Silent foreground notification ───────────────────────────────

    private Notification buildSilentNotification() {
        int iconRes = getResources().getIdentifier("ic_notification", "drawable", getPackageName());
        if (iconRes == 0) iconRes = getApplicationInfo().icon;

        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT
            | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent pi = PendingIntent.getActivity(this, 0, launchIntent, piFlags);

        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL_ID_SILENT)
            .setSmallIcon(iconRes)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setContentTitle("")
            .setContentText("")
            .setVisibility(NotificationCompat.VISIBILITY_SECRET)
            .setSound(null)
            .setVibrate(null)
            .setDefaults(0)
            .setShowWhen(false)
            .setContentIntent(pi);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            b.setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_DEFERRED);
        }

        return b.build();
    }

    private long lastAlertPostedAt = 0;

    // ── Long-poll loop ────────────────────────────────────────────────

    private void longPollLoop() {
        while (running.get()) {
            try {
                doLongPollOnce();
            } catch (Exception e) {
                Log.w(TAG, "longPollLoop exception: " + e.getMessage());
            }
            // Sleep OUTSIDE try-catch so it ALWAYS runs regardless of what happens above.
            // Use interrupt-safe loop to handle spurious wakeups.
            long sleepUntil = System.currentTimeMillis() + DRIVER_POLL_INTERVAL_MS;
            while (running.get() && System.currentTimeMillis() < sleepUntil) {
                try { Thread.sleep(sleepUntil - System.currentTimeMillis()); }
                catch (InterruptedException ignored) {}
            }
        }
    }

    private void doLongPollOnce() {
        String token = prefs.getString(OrderPollWorker.KEY_TOKEN, null);
        if (token == null || token.isEmpty()) { return; }

        String accountType = prefs.getString(OrderPollWorker.KEY_ACCOUNT_TYPE, "Merchant");
        long   lastSeenId  = prefs.getLong(OrderPollWorker.KEY_LATEST, 0);
        String baseUrl     = prefs.getString(OrderPollWorker.KEY_BASE_URL, OrderPollWorker.DEFAULT_BASE_URL);

        String apiPath, idKey;
        if ("Driver".equals(accountType)) {
            apiPath = "/api/v1/driver/assignments";
            idKey   = "deliveryAssignmentId";
        } else if ("Provider".equals(accountType)) {
            apiPath = "/api/v1/home-services/notifications?lastSeenId=" + lastSeenId;
            idKey   = "latestRequestId";
        } else {
            apiPath = "/api/v1/merchant-pwa/notifications?lastSeenOrderId=" + lastSeenId;
            idKey   = "latestOrderId";
        }

        HttpURLConnection conn = null;
        try {
            URL url = new URL(baseUrl + apiPath);
            Log.i(TAG, "GET " + url);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            if ("Driver".equals(accountType)) {
                conn.setRequestProperty("Authorization", "Bearer " + token);
            } else {
                conn.setRequestProperty("X-Pwa-Token", token);
            }
            conn.setConnectTimeout(HTTP_CONNECT_MS);
            conn.setReadTimeout(HTTP_READ_MS);

            int code = conn.getResponseCode();
            Log.i(TAG, "HTTP " + code);
            if (code == 401 || code == 403) {
                Log.w(TAG, "Token rejected (" + code + ") — clearing");
                prefs.edit().remove(OrderPollWorker.KEY_TOKEN).apply();
                return;
            }
            if (code != 200) { Log.w(TAG, "HTTP " + code + " — will retry"); return; }

            BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            StringBuilder  sb    = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
            reader.close();
            conn.disconnect();
            conn = null;

            String json = sb.toString();
            if (json.length() > 200) {
                Log.i(TAG, "Response (" + json.length() + " bytes): " + json.substring(0, 200) + "...");
            } else {
                Log.i(TAG, "Response: " + json);
            }
            if (!json.contains("\"isSuccess\": true") && !json.contains("\"isSuccess\":true")) {
                Log.w(TAG, "isSuccess=false — will retry");
                return;
            }

            if ("Driver".equals(accountType)) {
                pollDriverAssignments(json, token, baseUrl);
            } else {
                long newLatestId = extractLong(json, idKey);
                int  newCount    = "Provider".equals(accountType)
                    ? (int) extractLong(json, "availableCount")
                    : countOccurrences(json, "\"new_order\"");
                Log.i(TAG, "newLatestId=" + newLatestId + " newCount=" + newCount);

                boolean hasAlert = prefs.getBoolean(KEY_HAS_ALERT, false);
                
                Set<String> ignoredHsIds = prefs.getStringSet("ignored_home_services", new HashSet<String>());
                if ("Provider".equals(accountType) && ignoredHsIds.contains(String.valueOf(newLatestId))) {
                    Log.i(TAG, "Skipping ignored home service request " + newLatestId);
                    newCount = 0; 
                }

                if (newCount > 0 && newLatestId > lastSeenId) {
                    Log.i(TAG, "New items: " + newCount + ", updating cursor");
                    prefs.edit().putLong(OrderPollWorker.KEY_LATEST, newLatestId).apply();
                    // Cancel all previous notifications so they don't pile up
                    ((NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE)).cancelAll();
                    showAlert(accountType, newCount, newLatestId);
                } else if (newCount == 0) {
                    Log.i(TAG, "No pending items — clearing alert");
                    clearAlert(this);
                }
            }

        } catch (java.net.SocketTimeoutException e) {
            Log.i(TAG, "long-poll timeout (expected)");
        } catch (Exception e) {
            Log.w(TAG, "doLongPollOnce: " + e.getMessage());
        } finally {
            if (conn != null) { try { conn.disconnect(); } catch (Exception ignored) {} }
        }
    }

    private void pollDriverAssignments(String json, String token, String baseUrl) {
        long lastSeenId  = prefs.getLong(OrderPollWorker.KEY_LATEST, 0);
        long maxId       = 0;
        int  pendingCount = 0;
        int  newCount    = 0;
        Set<Long> seenIds = new HashSet<>();
        Set<String> ignoredIds = prefs.getStringSet(KEY_IGNORED_ASSIGNMENT_IDS, new HashSet<String>());
        StringBuilder latestAssignmentInfo = new StringBuilder();
        StringBuilder allAssignmentsInfo = new StringBuilder();

        // Find all assignment objects by looking for the start of each object
        // after "assignments": [ { ... }
        int assignmentsStart = json.indexOf("\"assignments\":");
        if (assignmentsStart < 0) assignmentsStart = json.indexOf("\"assignments\" :");
        if (assignmentsStart < 0) {
            Log.w(TAG, "pollDriverAssignments: no assignments array found");
            return;
        }

        // Find each assignment object in the array
        String searchKey = "\"deliveryAssignmentId\":";
        int idx = assignmentsStart;
        while ((idx = json.indexOf(searchKey, idx)) != -1) {
            int start = idx + searchKey.length();
            while (start < json.length() && json.charAt(start) == ' ') start++;
            int end = start;
            while (end < json.length() && Character.isDigit(json.charAt(end))) end++;
            long asgnId = Long.parseLong(json.substring(start, end));

            // Skip duplicate IDs (nested objects in JSON may repeat the same field)
            if (seenIds.contains(asgnId)) {
                idx = end;
                continue;
            }
            seenIds.add(asgnId);

            // Skip assignments the driver has explicitly ignored/rejected
            if (ignoredIds.contains(String.valueOf(asgnId))) {
                Log.i(TAG, "Skipping ignored assignment " + asgnId);
                idx = end;
                continue;
            }

            if (asgnId > maxId) maxId = asgnId;

            // Extract a block around this assignment for field parsing
            // Find the start of this object (the opening brace before deliveryAssignmentId)
            int objStart = json.lastIndexOf("{", idx);
            if (objStart < 0) objStart = idx - 50;
            // Find the end of this object (matching closing brace)
            int objEnd = findMatchingBrace(json, objStart);
            if (objEnd < 0) objEnd = Math.min(json.length(), idx + 800);

            String block = json.substring(objStart, objEnd);

            // FILTER: Only count assignments with status 0 (pending)
            // Status 1 (accepted), 2 (picked up), 3 (in transit), 4 (arrived) are ongoing active trips,
            // they should NOT trigger "New Delivery" background alerts.
            // Status 5 (delivered), 6 (cancelled), 7 (expired) are ignored.
            int status = extractInt(block, "status");
            if (status != 0) {
                idx = end;
                continue;
            }

            pendingCount++;

            // Extract all fields
            String customerName = extractString(block, "customerName");
            String customerAddress = extractString(block, "customerAddress");
            String pickupAddress = extractString(block, "pickupAddress");
            String customerPhone = extractString(block, "customerPhone");
            String notes = extractString(block, "notes");
            double customerLat = extractDouble(block, "customerLatitude");
            double customerLng = extractDouble(block, "customerLongitude");

            // Build detailed info for this assignment
            if (pendingCount == 1) {
                // For first (or only) assignment, show ALL fields
                if (!customerName.isEmpty()) allAssignmentsInfo.append("Customer: ").append(customerName).append("\n");
                if (!customerPhone.isEmpty()) allAssignmentsInfo.append("Phone: ").append(customerPhone).append("\n");
                if (!customerAddress.isEmpty()) allAssignmentsInfo.append("Address: ").append(customerAddress).append("\n");
                if (!pickupAddress.isEmpty()) allAssignmentsInfo.append("Pickup: ").append(pickupAddress).append("\n");
                if (!notes.isEmpty()) allAssignmentsInfo.append("Notes: ").append(notes).append("\n");
                if (customerLat != 0 && customerLng != 0) {
                    allAssignmentsInfo.append("Map: ").append("https://maps.google.com/?q=").append(customerLat).append(",").append(customerLng).append("\n");
                }
            } else {
                // For multiple, just summary
                if (allAssignmentsInfo.length() > 0 && !allAssignmentsInfo.toString().endsWith("\n")) allAssignmentsInfo.append("\n");
                allAssignmentsInfo.append("#").append(asgnId);
                if (!customerName.isEmpty()) allAssignmentsInfo.append(" ").append(customerName);
                if (!customerPhone.isEmpty()) allAssignmentsInfo.append(" | ").append(customerPhone);
                allAssignmentsInfo.append("\n");
            }

            if (asgnId > lastSeenId) {
                newCount++;
                if (latestAssignmentInfo.length() > 0) latestAssignmentInfo.append(", ");
                if (!customerName.isEmpty()) latestAssignmentInfo.append(customerName);
                else latestAssignmentInfo.append("#").append(asgnId);
            }
            idx = end;
        }

        boolean hasAlert = prefs.getBoolean(KEY_HAS_ALERT, false);
        Log.i(TAG, "pollDriverAssignments: pending=" + pendingCount + " new=" + newCount + " maxId=" + maxId + " lastSeenId=" + lastSeenId + " hasAlert=" + hasAlert);

        if (newCount > 0 && maxId > lastSeenId) {
            // NEW pending assignment(s) detected — update cursor and show
            Log.i(TAG, "New pending assignments detected: " + newCount + ", maxId=" + maxId);
            prefs.edit().putLong(OrderPollWorker.KEY_LATEST, maxId).apply();
            String info = allAssignmentsInfo.length() > 0
                ? allAssignmentsInfo.toString().trim()
                : newCount + " new delivery";
            lastAlertPostedAt = System.currentTimeMillis();
            showDriverAlert(pendingCount, maxId, info);
        } else if (pendingCount > 0 && !hasAlert) {
            // Pending assignment still exists but notification was dismissed
            // — re-show it so user always sees pending deliveries in tray
            Log.i(TAG, "Existing pending assignments — re-showing alert (pending=" + pendingCount + ")");
            showDriverAlert(pendingCount, maxId, allAssignmentsInfo.toString().trim());
        } else if (pendingCount == 0 && hasAlert) {
            // No pending assignments — clear notification
            Log.i(TAG, "No pending assignments — clearing alert");
            clearAlert(this);
        }

        // Clean up ignored IDs for assignments that no longer exist in the API response
        // (e.g. accepted by another driver, expired, cancelled)
        if (!ignoredIds.isEmpty()) {
            Set<String> cleaned = new HashSet<>();
            for (String idStr : ignoredIds) {
                try {
                    if (seenIds.contains(Long.parseLong(idStr))) {
                        cleaned.add(idStr);
                    }
                } catch (NumberFormatException ignored) {}
            }
            if (cleaned.size() != ignoredIds.size()) {
                prefs.edit().putStringSet(KEY_IGNORED_ASSIGNMENT_IDS, cleaned).apply();
                Log.i(TAG, "Cleaned ignored IDs from " + ignoredIds.size() + " to " + cleaned.size());
            }
        }
    }

    /** Find matching closing brace for an opening brace at given position. */
    private int findMatchingBrace(String text, int openPos) {
        if (openPos < 0 || openPos >= text.length() || text.charAt(openPos) != '{') return -1;
        int depth = 1;
        boolean inString = false;
        for (int i = openPos + 1; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c == '"' && (i == 0 || text.charAt(i - 1) != '\\')) {
                inString = !inString;
            } else if (!inString) {
                if (c == '{') depth++;
                else if (c == '}') {
                    depth--;
                    if (depth == 0) return i;
                }
            }
        }
        return -1;
    }

    private double extractDouble(String json, String key) {
        String search = "\"" + key + "\":";
        int idx = json.indexOf(search);
        if (idx < 0) return 0;
        int start = idx + search.length();
        while (start < json.length() && json.charAt(start) == ' ') start++;
        int end = start;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '.' || json.charAt(end) == '-')) end++;
        try { return Double.parseDouble(json.substring(start, end)); } catch (Exception e) { return 0; }
    }

    // ── Repeat-alert loop ─────────────────────────────────────────────

    private void repeatAlertLoop() {
        while (running.get()) {
            long sleepUntil = System.currentTimeMillis() + REPEAT_ALERT_INTERVAL_MS;
            while (running.get() && System.currentTimeMillis() < sleepUntil) {
                try { Thread.sleep(sleepUntil - System.currentTimeMillis()); }
                catch (InterruptedException ignored) {}
            }
            if (!running.get()) break;
            try {
                if (prefs.getBoolean(KEY_HAS_ALERT, false) && !isForeground()) {
                    if (alertPlayer == null || !alertPlayer.isPlaying()) {
                        Log.w(TAG, "MediaPlayer stopped — restarting");
                        startAlertSound(OrderPollService.this);
                    }
                }
            } catch (Exception e) {
                Log.w(TAG, "repeatAlertLoop: " + e.getMessage());
            }
        }
    }

    static void clearAlert(Context context) {
        SharedPreferences p = context.getSharedPreferences(OrderPollWorker.PREFS, Context.MODE_PRIVATE);
        p.edit().putBoolean(KEY_HAS_ALERT, false).apply();
        Set<String> ids = new HashSet<>(p.getStringSet(KEY_ALERT_IDS_SET, new HashSet<>()));
        for (String idStr : ids) {
            try {
                NotificationManagerCompat.from(context).cancel(Integer.parseInt(idStr));
            } catch (Exception ignored) {}
        }
        p.edit().remove(KEY_ALERT_IDS_SET).apply();
        stopAlertSound();
        // Revert foreground notification back to silent
        try {
            if (instance != null) {
                instance.startForeground(FOREGROUND_NOTIF_ID, instance.buildSilentNotification());
                instance.alertActive = false;
                Log.i(TAG, "Foreground notification reverted to silent");
            }
        } catch (Exception ignored) {}
    }

    // ── Continuous alert sound (MediaPlayer loop) ─────────────────────

    static void startAlertSound(Context context) {
        try {
            stopAlertSound();
            int soundResId = context.getResources().getIdentifier("notification_sound", "raw", context.getPackageName());
            if (soundResId == 0) return;
            alertPlayer = MediaPlayer.create(context, soundResId);
            if (alertPlayer == null) return;
            alertPlayer.setAudioAttributes(
                new android.media.AudioAttributes.Builder()
                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(android.media.AudioAttributes.USAGE_ALARM)
                    .build());
            alertPlayer.setLooping(false);
            alertPlayer.setWakeMode(context, PowerManager.PARTIAL_WAKE_LOCK);
            alertPlayer.start();
            Log.i(TAG, "Alert sound started (looping)");
        } catch (Exception e) {
            Log.w(TAG, "startAlertSound: " + e.getMessage());
        }
    }

    static void stopAlertSound() {
        if (alertPlayer != null) {
            try {
                if (alertPlayer.isPlaying()) alertPlayer.stop();
                alertPlayer.release();
            } catch (Exception ignored) {}
            alertPlayer = null;
            Log.i(TAG, "Alert sound stopped");
        }
    }

    // ── New order alert (Merchant/Provider) ───────────────────────────

    private void showAlert(String accountType, int newCount, long requestId) {
        // If app is in foreground, do NOT show native notification — PWA handles it
        if (isForeground()) {
            Log.i(TAG, "App is foreground — suppressing native notification (PWA handles it via JS bridge)");
            return;
        }

        boolean isArabic = Locale.getDefault().getLanguage().equals("ar");
        String title, body;
        if ("Provider".equals(accountType)) {
            title = isArabic ? "طلب خدمة منزلية جديد" : "New Home Service Request";
            body  = newCount == 1
                ? (isArabic ? "طلب خدمة منزلية جديد في منطقتك" : "New home service request in your area")
                : (isArabic ? newCount + " طلبات خدمة منزلية جديدة في منطقتك" : newCount + " new home service requests in your area");
        } else {
            title = "Boulevard";
            body  = newCount == 1
                ? (isArabic ? "طلب جديد وصل إلى متجرك" : "New order arrived at your store")
                : (isArabic ? newCount + " طلبات جديدة وصلت إلى متجرك" : newCount + " new orders arrived at your store");
        }

        int iconRes = getResources().getIdentifier("ic_notification", "drawable", getPackageName());
        if (iconRes == 0) iconRes = android.R.drawable.ic_dialog_info;

        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT
            | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent pi = PendingIntent.getActivity(this, 0, launchIntent, piFlags);

        NotificationCompat.Builder ab = new NotificationCompat.Builder(this, CHANNEL_ID_ALERTS)
            .setSmallIcon(iconRes)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setAutoCancel(true)
            .setContentIntent(pi)
            .setOnlyAlertOnce(false)
            .setDefaults(NotificationCompat.DEFAULT_ALL);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ab.setFullScreenIntent(pi, true);
        }

        try {
            int notifId = (int)(Math.abs(requestId) % 100000) + 10000;
            prefs.edit()
                .putBoolean(KEY_HAS_ALERT,  true)
                .putString(KEY_ALERT_TITLE, title)
                .putString(KEY_ALERT_BODY,  body)
                .putInt(KEY_ALERT_ID,       notifId)
                .apply();
            Set<String> ids = new HashSet<>(prefs.getStringSet(KEY_ALERT_IDS_SET, new HashSet<>()));
            ids.add(String.valueOf(notifId));
            prefs.edit().putStringSet(KEY_ALERT_IDS_SET, ids).apply();
            NotificationManagerCompat.from(this).notify(notifId, ab.build());
            startAlertSound(this);
        } catch (SecurityException e) {
            Log.w(TAG, "notify failed: " + e.getMessage());
        }
    }

    // ── Start / Stop ──────────────────────────────────────────────────

    static void start(Context context) {
        Intent i = new Intent(context, OrderPollService.class);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(i);
            } else {
                context.startService(i);
            }
        } catch (Exception e) {
            Log.e(TAG, "start failed: " + e.getMessage());
        }
    }

    static void stop(Context context) {
        try { context.stopService(new Intent(context, OrderPollService.class)); }
        catch (Exception ignored) {}
    }

    // ── Driver alert ──────────────────────────────────────────────────

    private void showDriverAlert(int count, long assignmentId, String customerInfo) {
        // If app is in foreground, do NOT show native notification — PWA handles it
        if (isForeground()) {
            Log.i(TAG, "App is foreground — suppressing native notification (PWA handles it via JS bridge)");
            return;
        }

        boolean isArabic = Locale.getDefault().getLanguage().equals("ar");
        String title;
        if (count == 1) {
            title = isArabic ? "توصيل جديد" : "New Delivery";
        } else {
            title = isArabic ? count + " توصيلات جديدة" : count + " New Deliveries";
        }

        // customerInfo is already formatted with newlines
        String body = customerInfo.isEmpty()
            ? (isArabic ? "لديك توصيل جديد في انتظارك" : "You have a new delivery pending")
            : customerInfo;

        int iconRes = getResources().getIdentifier("ic_notification", "drawable", getPackageName());
        if (iconRes == 0) iconRes = android.R.drawable.ic_dialog_info;

        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT
            | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent pi = PendingIntent.getActivity(this, 0, launchIntent, piFlags);

        // Build alert notification (dismissable, NOT ongoing)
        Notification alertNotif = new NotificationCompat.Builder(this, CHANNEL_ID_ALERTS)
            .setSmallIcon(iconRes)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setAutoCancel(true)
            .setContentIntent(pi)
            .setOnlyAlertOnce(false)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build();

        // Update foreground notification so it always shows the alert (exempt from permission)
        startForeground(FOREGROUND_NOTIF_ID, alertNotif);
        Log.i(TAG, "Foreground notification updated with delivery alert: " + title);
        alertActive = true;

        // Also post as a separate dismissable notification for better UX
        try {
            int notifId = (int)(Math.abs(assignmentId) % 100000) + 30000;
            prefs.edit()
                .putBoolean(KEY_HAS_ALERT,  true)
                .putString(KEY_ALERT_TITLE, title)
                .putString(KEY_ALERT_BODY,  body)
                .putInt(KEY_ALERT_ID,       notifId)
                .apply();
            Set<String> ids = new HashSet<>(prefs.getStringSet(KEY_ALERT_IDS_SET, new HashSet<>()));
            ids.add(String.valueOf(notifId));
            prefs.edit().putStringSet(KEY_ALERT_IDS_SET, ids).apply();
            NotificationManagerCompat.from(this).notify(notifId, alertNotif);
            Log.i(TAG, "Separate alert notification posted: id=" + notifId);
        } catch (Exception e) {
            Log.w(TAG, "Separate notification failed: " + e.getMessage());
        }

        // Play sound
        startAlertSound(this);
    }

    /** Revert foreground notification back to silent when alert is cleared. */
    private void revertToSilent() {
        if (alertActive) {
            alertActive = false;
            try {
                startForeground(FOREGROUND_NOTIF_ID, buildSilentNotification());
                Log.i(TAG, "Foreground notification reverted to silent");
            } catch (Exception e) {
                Log.w(TAG, "revertToSilent failed: " + e.getMessage());
            }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private long extractLong(String json, String key) {
        String search = "\"" + key + "\":";
        int idx = json.indexOf(search);
        if (idx < 0) return 0;
        int start = idx + search.length();
        while (start < json.length() && json.charAt(start) == ' ') start++;
        int end = start;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '-')) end++;
        try { return Long.parseLong(json.substring(start, end)); } catch (Exception e) { return 0; }
    }

    private int extractInt(String json, String key) {
        String search = "\"" + key + "\":";
        int idx = json.indexOf(search);
        if (idx < 0) return 0;
        int start = idx + search.length();
        while (start < json.length() && json.charAt(start) == ' ') start++;
        int end = start;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '-')) end++;
        try { return Integer.parseInt(json.substring(start, end)); } catch (Exception e) { return 0; }
    }

    private String extractString(String json, String key) {
        String search = "\"" + key + "\":";
        int idx = json.indexOf(search);
        if (idx < 0) return "";
        int start = idx + search.length();
        // Skip spaces after colon
        while (start < json.length() && json.charAt(start) == ' ') start++;
        // Must have opening quote
        if (start >= json.length() || json.charAt(start) != '"') return "";
        start++; // Skip opening quote
        int end = json.indexOf("\"", start);
        if (end < 0) return "";
        String val = json.substring(start, end);
        // Unescape common JSON escapes
        val = val.replace("\\n", " ").replace("\\\"", "\"").replace("\\\\", "\\").replace("\\t", " ");
        return val;
    }

    private int countOccurrences(String source, String target) {
        if (target == null || target.isEmpty()) return 0;
        int count = 0, idx = 0;
        while ((idx = source.indexOf(target, idx)) != -1) { count++; idx += target.length(); }
        return count;
    }
}
