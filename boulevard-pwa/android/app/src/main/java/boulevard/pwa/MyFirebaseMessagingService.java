package boulevard.pwa;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "BoulevardFcm";

    @Override
    public void onNewToken(String token) {
        Log.i(TAG, "New FCM token: " + token);
        // Save to SharedPreferences so delivery-driver.html can pick it up
        SharedPreferences prefs = getSharedPreferences("blvd_fcm", MODE_PRIVATE);
        prefs.edit().putString("fcm_token", token).apply();
    }

    @Override
    public void onMessageReceived(RemoteMessage message) {
        Log.i(TAG, "FCM message received");
        try {
            String title = null;
            String body  = null;
            String type  = null;

            if (message.getNotification() != null) {
                title = message.getNotification().getTitle();
                body  = message.getNotification().getBody();
            }
            if (message.getData() != null) {
                if (title == null) title = message.getData().get("title");
                if (body  == null) body  = message.getData().get("body");
                type = message.getData().get("type");
            }

            // "new_delivery" type means it's a delivery assignment push
            if ("new_delivery".equals(type)) {
                showDeliveryNotification(title != null ? title : "توصيل جديد",
                    body != null ? body : "تم تعيين توصيل جديد لك");
            }
        } catch (Exception e) {
            Log.w(TAG, "onMessageReceived error: " + e.getMessage());
        }
    }

    private void showDeliveryNotification(String title, String body) {
        int iconRes = getResources().getIdentifier("ic_notification", "drawable", getPackageName());
        if (iconRes == 0) iconRes = android.R.drawable.ic_dialog_info;

        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT
            | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent pi = PendingIntent.getActivity(this, 0, launchIntent, flags);

        NotificationCompat.Builder b = new NotificationCompat.Builder(this, "boulevard_orders")
            .setSmallIcon(iconRes)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setAutoCancel(true)
            .setContentIntent(pi)
            .setDefaults(NotificationCompat.DEFAULT_ALL);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            b.setFullScreenIntent(pi, true);
        }

        NotificationManagerCompat.from(this).notify(40001, b.build());
    }
}
