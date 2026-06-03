package boulevard.pwa;

import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Native plugin that saves a text file to Documents/boulevard/ on the device.
 * Uses MediaStore (Android 10+) or legacy Environment API (Android 9-).
 * Called from JavaScript as: window.Capacitor.Plugins.SaveToDownloads.save({ filename, data })
 */
@CapacitorPlugin(name = "SaveToDownloads")
public class SaveToDownloadsPlugin extends Plugin {

    /** Sub-folder inside Documents where all boulevard exports are stored. */
    private static final String SUBFOLDER = "boulevard";

    @PluginMethod
    public void save(PluginCall call) {
        String filename = call.getString("filename");
        String data     = call.getString("data");

        if (filename == null || filename.isEmpty()) {
            call.reject("filename is required");
            return;
        }
        if (data == null) {
            call.reject("data is required");
            return;
        }

        try {
            byte[] bytes = data.getBytes(StandardCharsets.UTF_8);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // ── Android 10+ : MediaStore with RELATIVE_PATH = "Documents/boulevard/" ──
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                values.put(MediaStore.MediaColumns.MIME_TYPE, "text/csv");
                values.put(MediaStore.MediaColumns.RELATIVE_PATH,
                        Environment.DIRECTORY_DOCUMENTS + "/" + SUBFOLDER + "/");
                values.put(MediaStore.MediaColumns.IS_PENDING, 1);

                Uri collection = MediaStore.Files.getContentUri(
                        MediaStore.VOLUME_EXTERNAL_PRIMARY);
                Uri fileUri = getContext().getContentResolver().insert(collection, values);

                if (fileUri == null) {
                    call.reject("MediaStore.insert returned null");
                    return;
                }

                try (OutputStream os =
                             getContext().getContentResolver().openOutputStream(fileUri)) {
                    if (os == null) {
                        call.reject("Could not open output stream");
                        return;
                    }
                    os.write(bytes);
                }

                values.clear();
                values.put(MediaStore.MediaColumns.IS_PENDING, 0);
                getContext().getContentResolver().update(fileUri, values, null, null);

            } else {
                // ── Android 9- : direct write to /sdcard/Documents/boulevard/ ──
                @SuppressWarnings("deprecation")
                File docsDir = new File(
                        Environment.getExternalStoragePublicDirectory(
                                Environment.DIRECTORY_DOCUMENTS),
                        SUBFOLDER);
                if (!docsDir.exists()) docsDir.mkdirs();
                File file = new File(docsDir, filename);
                try (FileOutputStream fos = new FileOutputStream(file)) {
                    fos.write(bytes);
                }
            }

            JSObject result = new JSObject();
            result.put("saved", true);
            result.put("filename", filename);
            call.resolve(result);

        } catch (Exception e) {
            call.reject("Save failed: " + e.getMessage(), e);
        }
    }
}
