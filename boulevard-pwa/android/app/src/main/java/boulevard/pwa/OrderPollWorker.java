package boulevard.pwa;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Background WorkManager worker that polls the Boulevard API for new orders
 * when the app is closed or in the background.
 *
 * Runs at most every 15 minutes (WorkManager minimum).
 * Reads credentials from SharedPreferences saved by the JS bridge (saveSession).
 */
public class OrderPollWorker extends Worker {

    static final String PREFS       = "blvd_prefs";
    static final String KEY_TOKEN   = "token";
    static final String KEY_LATEST  = "latestOrderId";
    static final String KEY_BASEURL = "baseUrl";

    private static final String FALLBACK_BASE_URL = "https://boulevard.r-y-x.net";
    private static final int    NOTIF_ID          = 2001;

    public OrderPollWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context ctx = getApplicationContext();
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);

        String token = prefs.getString(KEY_TOKEN, null);
        if (token == null || token.isEmpty()) {
            // Not logged in — nothing to do
            return Result.success();
        }

        long lastSeenOrderId = prefs.getLong(KEY_LATEST, 0);
        String baseUrl = prefs.getString(KEY_BASEURL, FALLBACK_BASE_URL);

        HttpURLConnection conn = null;
        try {
            URL url = new URL(baseUrl + "/api/v1/merchant-pwa/notifications?lastSeenOrderId=" + lastSeenOrderId);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("X-Pwa-Token", token);
            conn.setConnectTimeout(20000);
            conn.setReadTimeout(20000);

            int code = conn.getResponseCode();
            if (code == 401 || code == 403) {
                // Token expired — clear it so we stop polling until next login
                prefs.edit().remove(KEY_TOKEN).apply();
                return Result.success();
            }
            if (code != 200) return Result.retry();

            BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
            reader.close();

            String json = sb.toString();

            // Parse isSuccess flag
            if (!json.contains("\"isSuccess\":true")) return Result.success();

            // Count new_order entries in the result
            long newLatestOrderId = extractLong(json, "latestOrderId");
            int  newOrderCount    = countOccurrences(json, "\"new_order\"");

            if (newOrderCount > 0 && newLatestOrderId > lastSeenOrderId) {
                // Advance cursor in SharedPreferences
                prefs.edit().putLong(KEY_LATEST, newLatestOrderId).apply();

                // Show system notification
                String body = newOrderCount == 1
                    ? "طلب جديد وصل إلى متجرك"
                    : newOrderCount + " طلبات جديدة وصلت إلى متجرك";
                showNotification(ctx, "Boulevard 🔔", body);
            }

            return Result.success();

        } catch (Exception e) {
            return Result.retry();
        } finally {
            if (conn != null) {
                try { conn.disconnect(); } catch (Exception ignored) {}
            }
        }
    }

    private void showNotification(Context ctx, String title, String body) {
        // Tap → open app
        Intent launchIntent = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pi = PendingIntent.getActivity(ctx, 0, launchIntent, flags);

        int iconRes = ctx.getResources().getIdentifier(
            "ic_notification", "drawable", ctx.getPackageName()
        );
        if (iconRes == 0) iconRes = android.R.drawable.ic_dialog_info;

        NotificationCompat.Builder builder = new NotificationCompat.Builder(ctx, "boulevard_orders")
            .setSmallIcon(iconRes)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pi);

        NotificationManager manager =
            (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIF_ID, builder.build());
        }
    }

    /** Extract a long value by key from a flat JSON string. */
    private long extractLong(String json, String key) {
        String search = "\"" + key + "\":";
        int idx = json.indexOf(search);
        if (idx < 0) return 0;
        int start = idx + search.length();
        // skip whitespace
        while (start < json.length() && json.charAt(start) == ' ') start++;
        int end = start;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '-')) {
            end++;
        }
        try {
            return Long.parseLong(json.substring(start, end));
        } catch (Exception e) {
            return 0;
        }
    }

    /** Count non-overlapping occurrences of target in source. */
    private int countOccurrences(String source, String target) {
        if (target == null || target.isEmpty()) return 0;
        int count = 0, idx = 0;
        while ((idx = source.indexOf(target, idx)) != -1) {
            count++;
            idx += target.length();
        }
        return count;
    }
}
