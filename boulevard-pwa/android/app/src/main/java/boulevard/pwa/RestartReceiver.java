package boulevard.pwa;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * Fallback broadcast receiver that restarts the background polling service.
 *
 * This is fired from OrderPollService.onTaskRemoved() as a secondary
 * restart mechanism: if the direct startForegroundService() call fails or is
 * blocked, the broadcast may still be deliverable and can re-start the service.
 */
public class RestartReceiver extends BroadcastReceiver {

    private static final String TAG = "BoulevardRestart";

    static final String ACTION = "boulevard.pwa.RESTART_SERVICE";

    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            Log.i(TAG, "onReceive — restarting service");
            OrderPollService.start(context);
            OrderPollReceiver.scheduleNextAlarm(context);
        } catch (Exception e) {
            Log.e(TAG, "onReceive failed", e);
        }
    }
}
