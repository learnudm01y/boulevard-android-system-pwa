package boulevard.pwa;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebView;
import android.Manifest;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "BoulevardMain";
    private static final int NOTIF_PERMISSION_REQUEST = 100;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestNotificationPermission();
        initSafe();
        startServiceIfSessionExists();
    }

    @Override
    public void onResume() {
        super.onResume();
        // User is looking at the app — suppress native alerts; web UI handles visibility
        OrderPollService.setForeground(true);
        OrderPollService.clearAlert(this);
    }

    @Override
    public void onPause() {
        super.onPause();
        // App is no longer visible — restore native alert capability
        OrderPollService.setForeground(false);
    }

    private void startServiceIfSessionExists() {
        try {
            SharedPreferences prefs = getSharedPreferences(OrderPollWorker.PREFS, Context.MODE_PRIVATE);
            String token = prefs.getString(OrderPollWorker.KEY_TOKEN, null);
            if (token != null && !token.isEmpty()) {
                Log.i(TAG, "Session found on startup — restarting foreground service + alarm");
                OrderPollReceiver.scheduleNextAlarm(this);
                OrderPollService.start(this);
            } else {
                Log.i(TAG, "No session on startup — background service deferred");
            }
        } catch (Exception e) {
            Log.e(TAG, "startServiceIfSessionExists failed", e);
        }
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIF_PERMISSION_REQUEST);
            }
        }
    }

    private void initSafe() {
        try {
            registerPlugin(SaveToDownloadsPlugin.class);
        } catch (Exception e) {
            Log.e(TAG, "registerPlugin failed", e);
        }
        try {
            createNotificationChannel();
        } catch (Exception e) {
            Log.e(TAG, "createNotificationChannel failed", e);
        }
        try {
            registerAndroidNativeBridge();
        } catch (Exception e) {
            Log.e(TAG, "registerAndroidNativeBridge failed", e);
        }
    }

    private void registerAndroidNativeBridge() {
        final android.os.Handler h = new android.os.Handler(android.os.Looper.getMainLooper());
        h.post(new Runnable() {
            int attempts = 0;
            @Override
            public void run() {
                attempts++;
                try {
                    if (getBridge() != null && getBridge().getWebView() != null) {
                        WebView wv = getBridge().getWebView();
                        wv.addJavascriptInterface(new AndroidNative(MainActivity.this), "AndroidNative");
                        return;
                    }
                } catch (Exception e) {
                    Log.e(TAG, "registerAndroidNativeBridge attempt " + attempts, e);
                }
                if (attempts < 10) {
                    h.postDelayed(this, 200);
                }
            }
        });
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            int soundResId = getResources().getIdentifier(
                "notification_sound", "raw", getPackageName());
            Uri soundUri = soundResId != 0
                ? Uri.parse("android.resource://" + getPackageName() + "/" + soundResId)
                : null;
            AudioAttributes audioAttr = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .build();
            NotificationChannel channel = new NotificationChannel(
                "boulevard_orders",
                "Boulevard Orders",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("New order & delivery notifications");
            if (soundUri != null) channel.setSound(soundUri, audioAttr);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 200, 100, 200});
            channel.setShowBadge(true);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }
}
