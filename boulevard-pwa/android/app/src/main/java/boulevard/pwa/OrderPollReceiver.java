package boulevard.pwa;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;

/**
 * AlarmManager-based trigger that fires even in Doze mode.
 *
 * IMPORTANT: BroadcastReceivers must complete in 10 seconds max — they MUST NOT
 * do network I/O directly. Instead, this receiver delegates to WorkManager which
 * holds a proper WakeLock and has up to 10 minutes to complete the HTTP poll.
 */
public class OrderPollReceiver extends BroadcastReceiver {

    /** How often to re-arm the alarm (1 minute). */
    static final long POLL_INTERVAL_MS = 60_000L;

    static final String ACTION = "boulevard.pwa.POLL_ORDERS";

    @Override
    public void onReceive(Context context, Intent intent) {
        // 1. Delegate the actual HTTP polling to WorkManager (has a WakeLock, network access)
        WorkManager.getInstance(context)
            .enqueue(new OneTimeWorkRequest.Builder(OrderPollWorker.class).build());

        // 2. Immediately reschedule the next alarm to keep the chain alive
        scheduleNextAlarm(context);
    }

    // ── AlarmManager scheduling ───────────────────────────────────────────

    /**
     * Schedule (or reschedule) the next alarm.
     * Uses setExactAndAllowWhileIdle on M+ so it fires even in Doze mode.
     */
    static void scheduleNextAlarm(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent i = new Intent(context, OrderPollReceiver.class);
        i.setAction(ACTION);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT
            | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent pi = PendingIntent.getBroadcast(context, 1001, i, flags);

        long triggerAt = System.currentTimeMillis() + POLL_INTERVAL_MS;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            } catch (SecurityException e) {
                // Exact alarm permission not granted — fall back to inexact but Doze-aware
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            }
        } else {
            am.set(AlarmManager.RTC_WAKEUP, triggerAt, pi);
        }
    }

    /** Cancel any pending alarm — call on logout. */
    static void cancelAlarm(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent i = new Intent(context, OrderPollReceiver.class);
        i.setAction(ACTION);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT
            | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent pi = PendingIntent.getBroadcast(context, 1001, i, flags);
        am.cancel(pi);
    }
}

