package boulevard.pwa;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

/**
 * Restarts the AlarmManager polling chain after device reboot or app update.
 * Without this, all pending alarms are cleared when the device restarts.
 */
public class BootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        final String action = intent.getAction();
        if (action == null) return;

        // Only restart if the user is logged in
        SharedPreferences prefs = context.getSharedPreferences(
            OrderPollWorker.PREFS, Context.MODE_PRIVATE);
        String token = prefs.getString(OrderPollWorker.KEY_TOKEN, null);
        if (token != null && !token.isEmpty()) {
            OrderPollReceiver.scheduleNextAlarm(context);
        }
    }
}
