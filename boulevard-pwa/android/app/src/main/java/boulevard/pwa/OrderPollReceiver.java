package boulevard.pwa;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class OrderPollReceiver extends BroadcastReceiver {

    private static final String TAG = "BoulevardPollRcvr";

    static final String ACTION = "boulevard.pwa.POLL_ORDERS";

    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            OrderPollService.start(context);
        } catch (Exception e) {
            Log.e(TAG, "startService failed", e);
        }
        try {
            scheduleNextAlarm(context);
        } catch (Exception e) {
            Log.e(TAG, "scheduleNextAlarm failed", e);
        }
    }

    static void scheduleNextAlarm(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent i = new Intent(context, OrderPollReceiver.class);
        i.setAction(ACTION);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT
            | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent pi = PendingIntent.getBroadcast(context, 1001, i, flags);

        long triggerAt = System.currentTimeMillis() + 15_000L; // 15 s backup watchdog

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            } catch (SecurityException e) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            }
        } else {
            am.set(AlarmManager.RTC_WAKEUP, triggerAt, pi);
        }
    }

    static void cancelAlarm(Context context) {
        try {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;
            Intent i = new Intent(context, OrderPollReceiver.class);
            i.setAction(ACTION);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT
                | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
            PendingIntent pi = PendingIntent.getBroadcast(context, 1001, i, flags);
            am.cancel(pi);
        } catch (Exception e) {
            Log.e(TAG, "cancelAlarm failed", e);
        }
    }
}
