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
 * Background WorkManager worker that polls the Boulevard API for new orders/requests
 * when the app is closed or in the background.
 *
 * Supports both Merchant and Provider account types.
 * Reads credentials from SharedPreferences saved by the JS bridge (AndroidNative.saveSession).
 */
public class OrderPollWorker extends Worker {

    static final String PREFS            = "blvd_prefs2";
    static final String KEY_TOKEN        = "token";
    static final String KEY_ACCOUNT_ID   = "accountId";
    static final String KEY_LATEST       = "latestOrderId";
    static final String KEY_BASE_URL     = "baseUrl";
    static final String KEY_ACCOUNT_TYPE = "accountType";

    static final String DEFAULT_BASE_URL = "http://localhost:5000";

    private static final int NOTIF_ID_MERCHANT = 2001;
    private static final int NOTIF_ID_PROVIDER = 2002;

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
            return Result.success();
        }

        String accountType = prefs.getString(KEY_ACCOUNT_TYPE, "Merchant");
        // Driver alerts are handled by the foreground OrderPollService, not this Worker.
        if ("Driver".equals(accountType)) {
            return Result.success();
        }
        long lastSeenId     = prefs.getLong(KEY_LATEST, 0);
        String baseUrl      = prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL);

        // Build API path based on account type
        String apiPath;
        String jsonTypeKey;  // key to count in JSON response
        if ("Provider".equals(accountType)) {
            apiPath    = "/api/v1/home-services/notifications?lastSeenId=" + lastSeenId;
            jsonTypeKey = "\"NewRequest\"";
        } else {
            apiPath    = "/api/v1/merchant-pwa/notifications?lastSeenOrderId=" + lastSeenId;
            jsonTypeKey = "\"new_order\"";
        }

        HttpURLConnection conn = null;
        try {
            URL url = new URL(baseUrl + apiPath);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("X-Pwa-Token", token);
            conn.setConnectTimeout(20000);
            conn.setReadTimeout(20000);

            int code = conn.getResponseCode();
            if (code == 401 || code == 403) {
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
            if (!json.contains("\"isSuccess\": true") && !json.contains("\"isSuccess\":true")) return Result.success();

            long newLatestId   = extractLong(json, accountType.equals("Provider") ? "latestRequestId" : "latestOrderId");
            int  newOrderCount = accountType.equals("Provider")
                ? (int) extractLong(json, "availableCount")
                : countOccurrences(json, jsonTypeKey);

            if (newOrderCount > 0 && newLatestId > lastSeenId) {
                prefs.edit().putLong(KEY_LATEST, newLatestId).apply();

                String title, body;
                if ("Provider".equals(accountType)) {
                    title = "طلب خدمة منزلية جديد";
                    body = newOrderCount == 1
                        ? "طلب خدمة منزلية جديد في منطقتك"
                        : newOrderCount + " طلبات خدمة منزلية جديدة في منطقتك";
                } else {
                    title = "Boulevard 🔔";
                    body = newOrderCount == 1
                        ? "طلب جديد وصل إلى متجرك"
                        : newOrderCount + " طلبات جديدة وصلت إلى متجرك";
                }
                showNotification(ctx, title, body, accountType);
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

    private void showNotification(Context ctx, String title, String body, String accountType) {
        Intent launchIntent = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pi = PendingIntent.getActivity(ctx, 0, launchIntent, flags);

        int iconRes = ctx.getResources().getIdentifier("ic_notification", "drawable", ctx.getPackageName());
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
            int notifId = accountType.equals("Provider") ? NOTIF_ID_PROVIDER : NOTIF_ID_MERCHANT;
            manager.notify(notifId, builder.build());
        }
    }

    private long extractLong(String json, String key) {
        String search = "\"" + key + "\":";
        int idx = json.indexOf(search);
        if (idx < 0) return 0;
        int start = idx + search.length();
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
