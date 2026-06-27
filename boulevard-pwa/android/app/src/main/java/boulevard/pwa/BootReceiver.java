package boulevard.pwa;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {

    private static final String TAG = "BoulevardBoot";

    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            final String action = intent.getAction();
            if (action == null) return;
            SharedPreferences prefs = context.getSharedPreferences(
                OrderPollWorker.PREFS, Context.MODE_PRIVATE);
            String token = prefs.getString(OrderPollWorker.KEY_TOKEN, null);
            if (token != null && !token.isEmpty()) {
                OrderPollReceiver.scheduleNextAlarm(context);
                OrderPollService.start(context);
            }
        } catch (Exception e) {
            Log.e(TAG, "onReceive failed", e);
        }
    }
}
