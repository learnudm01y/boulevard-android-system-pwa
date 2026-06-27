package boulevard.pwa;

import android.app.NotificationManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import android.webkit.JavascriptInterface;
import java.util.HashSet;
import java.util.Set;

public class AndroidNative {

    private static final String TAG = "BoulevardNative";
    private final Context context;

    public AndroidNative(Context context) {
        this.context = context.getApplicationContext();
    }

    @JavascriptInterface
    public void saveSession(String token, String accountId, String latestOrderId, String baseUrl, String accountType) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(OrderPollWorker.PREFS, Context.MODE_PRIVATE);
            prefs.edit()
                .putString(OrderPollWorker.KEY_TOKEN,        token != null ? token : "")
                .putString(OrderPollWorker.KEY_ACCOUNT_ID,   accountId != null ? accountId : "0")
                .putLong(  OrderPollWorker.KEY_LATEST,       parseLongSafe(latestOrderId, 0L))
                .putString(OrderPollWorker.KEY_BASE_URL,     baseUrl != null ? baseUrl : OrderPollWorker.DEFAULT_BASE_URL)
                .putString(OrderPollWorker.KEY_ACCOUNT_TYPE, accountType != null ? accountType : "Merchant")
                .apply();
            OrderPollReceiver.scheduleNextAlarm(context);
            OrderPollService.start(context);
        } catch (Exception e) {
            Log.e(TAG, "saveSession failed", e);
        }
    }

    @JavascriptInterface
    public void startBackgroundService() {
        try {
            SharedPreferences prefs = context.getSharedPreferences(OrderPollWorker.PREFS, Context.MODE_PRIVATE);
            String token = prefs.getString(OrderPollWorker.KEY_TOKEN, null);
            if (token != null && !token.isEmpty()) {
                OrderPollReceiver.scheduleNextAlarm(context);
                OrderPollService.start(context);
            }
        } catch (Exception e) {
            Log.e(TAG, "startBackgroundService failed", e);
        }
    }

    @JavascriptInterface
    public void clearSession() {
        try {
            SharedPreferences prefs = context.getSharedPreferences(OrderPollWorker.PREFS, Context.MODE_PRIVATE);
            prefs.edit().clear().apply();
            OrderPollReceiver.cancelAlarm(context);
            OrderPollService.stop(context);
        } catch (Exception e) {
            Log.e(TAG, "clearSession failed", e);
        }
    }

    /** Called from JS when the provider opens the app / acts on a notification.
     *  Stops the repeating alert sound/vibration. */
    @JavascriptInterface
    public void acknowledgeAlert() {
        try {
            OrderPollService.clearAlert(context);
        } catch (Exception e) {
            Log.e(TAG, "acknowledgeAlert failed", e);
        }
    }

    /** Called from JS when the driver explicitly ignores/rejects a delivery assignment.
     *  Records the ignored ID so the native poller never alerts for it again, and
     *  immediately cancels the active notification/sound. */
    @JavascriptInterface
    public void ignoreHomeServiceRequest(int requestId) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(OrderPollWorker.PREFS, Context.MODE_PRIVATE);
            Set<String> ignored = new HashSet<>(prefs.getStringSet("ignored_home_services", new HashSet<String>()));
            ignored.add(String.valueOf(requestId));
            prefs.edit().putStringSet("ignored_home_services", ignored).apply();
            Log.i(TAG, "Provider ignored request " + requestId);
        } catch (Exception e) {
            Log.e(TAG, "ignoreHomeServiceRequest failed", e);
        }
    }

    @JavascriptInterface
    public void ignoreAssignment(int assignmentId) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(OrderPollWorker.PREFS, Context.MODE_PRIVATE);
            Set<String> ignored = new HashSet<>(prefs.getStringSet(OrderPollService.KEY_IGNORED_ASSIGNMENT_IDS, new HashSet<String>()));
            ignored.add(String.valueOf(assignmentId));
            prefs.edit().putStringSet(OrderPollService.KEY_IGNORED_ASSIGNMENT_IDS, ignored).apply();
            OrderPollService.clearAlert(context);
            clearAllNotifications();
            Log.i(TAG, "Driver ignored assignment " + assignmentId);
        } catch (Exception e) {
            Log.e(TAG, "ignoreAssignment failed", e);
        }
    }

    /** Called from JS on app startup/login to clear any stuck notifications
     *  from previous sessions or old APK versions. */
    @JavascriptInterface
    public void clearAllNotifications() {
        try {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancelAll();
                Log.i(TAG, "All notifications cleared");
            }
            OrderPollService.clearAlert(context);
        } catch (Exception e) {
            Log.e(TAG, "clearAllNotifications failed", e);
        }
    }

    /** Called from JS to immediately stop the native looping alert sound. */
    @JavascriptInterface
    public void stopAlertSound() {
        try {
            OrderPollService.stopAlertSound();
        } catch (Exception e) {
            Log.e(TAG, "stopAlertSound failed", e);
        }
    }

    /** Called from JS to play the native alert sound (bypasses WebView autoplay). */
    @JavascriptInterface
    public void playAlertSound() {
        try {
            OrderPollService.startAlertSound(context);
        } catch (Exception e) {
            Log.e(TAG, "playAlertSound failed", e);
        }
    }

    @JavascriptInterface
    public String getBaseUrl() {
        try {
            SharedPreferences prefs = context.getSharedPreferences(OrderPollWorker.PREFS, Context.MODE_PRIVATE);
            return prefs.getString(OrderPollWorker.KEY_BASE_URL, OrderPollWorker.DEFAULT_BASE_URL);
        } catch (Exception e) {
            Log.e(TAG, "getBaseUrl failed", e);
            return OrderPollWorker.DEFAULT_BASE_URL;
        }
    }

    @JavascriptInterface
    public String getSessionToken() {
        try {
            SharedPreferences prefs = context.getSharedPreferences(OrderPollWorker.PREFS, Context.MODE_PRIVATE);
            return prefs.getString(OrderPollWorker.KEY_TOKEN, "");
        } catch (Exception e) {
            Log.e(TAG, "getSessionToken failed", e);
            return "";
        }
    }

    @JavascriptInterface
    public String getSessionInfo() {
        try {
            SharedPreferences prefs = context.getSharedPreferences(OrderPollWorker.PREFS, Context.MODE_PRIVATE);
            String token = prefs.getString(OrderPollWorker.KEY_TOKEN, "");
            String accountId = prefs.getString(OrderPollWorker.KEY_ACCOUNT_ID, "0");
            String accountType = prefs.getString(OrderPollWorker.KEY_ACCOUNT_TYPE, "Merchant");
            String baseUrl = prefs.getString(OrderPollWorker.KEY_BASE_URL, OrderPollWorker.DEFAULT_BASE_URL);
            if (token == null || token.isEmpty()) return "";
            return "{\"token\":\"" + token + "\",\"accountId\":\"" + accountId + "\",\"accountType\":\"" + accountType + "\",\"baseUrl\":\"" + baseUrl + "\"}";
        } catch (Exception e) {
            Log.e(TAG, "getSessionInfo failed", e);
            return "";
        }
    }

    private long parseLongSafe(String s, long fallback) {
        if (s == null) return fallback;
        try { return Long.parseLong(s); } catch (NumberFormatException e) { return fallback; }
    }
}
