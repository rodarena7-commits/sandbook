package com.tuapellido.sandbook;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.BridgeActivity;
import com.google.android.material.snackbar.Snackbar;
import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "SandbookUpdate";

    // Días que una versión nueva puede quedar sin instalar antes de volverse obligatoria
    private static final int DAYS_UNTIL_FORCED = 3;

    private AppUpdateManager appUpdateManager;
    private boolean forcedUpdateShown = false;

    // Debe registrarse antes de onCreate (patrón estándar de ActivityResultLauncher).
    private final ActivityResultLauncher<IntentSenderRequest> updateLauncher =
        registerForActivityResult(new ActivityResultContracts.StartIntentSenderForResult(), result -> {
            // Actualización opcional cancelada: se vuelve a ofrecer la próxima vez que abra la app.
            // Actualización obligatoria cancelada (botón atrás): se vuelve a mostrar enseguida.
            if (forcedUpdateShown && result.getResultCode() != Activity.RESULT_OK) {
                forcedUpdateShown = false;
                checkForUpdate();
            }
        });

    private final InstallStateUpdatedListener installStateListener = state -> {
        if (state.installStatus() == InstallStatus.DOWNLOADED) {
            showUpdateReadySnackbar();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetActionPlugin.class);
        super.onCreate(savedInstanceState);
        captureWidgetAction(getIntent());

        appUpdateManager = AppUpdateManagerFactory.create(this);
        appUpdateManager.registerListener(installStateListener);
        checkForUpdate();
    }

    @Override
    public void onResume() {
        super.onResume();
        // Retoma un update "flexible" a medio descargar, y avisa si terminó de
        // descargarse mientras la app estaba en segundo plano.
        appUpdateManager.getAppUpdateInfo().addOnSuccessListener(info -> {
            if (info.installStatus() == InstallStatus.DOWNLOADED) {
                showUpdateReadySnackbar();
            } else if (info.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
                if (shouldForce(info)) startUpdate(info, AppUpdateType.IMMEDIATE);
                else startUpdate(info, AppUpdateType.FLEXIBLE);
            }
        });
    }

    @Override
    public void onDestroy() {
        appUpdateManager.unregisterListener(installStateListener);
        super.onDestroy();
    }

    // Le pregunta a Play Store si hay una versión más nueva publicada que la instalada.
    // No depende de nada manual: Google Play sabe cuál es el versionCode más reciente
    // en el momento en que la revisión termina y la versión queda "publicada".
    // Los primeros días se ofrece como opcional (se descarga en segundo plano y se reinicia
    // con un botón); pasados DAYS_UNTIL_FORCED días, pantalla completa obligatoria.
    private void checkForUpdate() {
        appUpdateManager.getAppUpdateInfo().addOnSuccessListener(info -> {
            if (info.updateAvailability() != UpdateAvailability.UPDATE_AVAILABLE) return;
            if (shouldForce(info)) {
                startUpdate(info, AppUpdateType.IMMEDIATE);
            } else if (info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)) {
                startUpdate(info, AppUpdateType.FLEXIBLE);
            }
        }).addOnFailureListener(e -> Log.e(TAG, "No se pudo chequear actualizaciones", e));
    }

    private boolean shouldForce(AppUpdateInfo info) {
        Integer staleDays = info.clientVersionStalenessDays();
        return staleDays != null && staleDays >= DAYS_UNTIL_FORCED
            && info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE);
    }

    private void startUpdate(AppUpdateInfo info, int type) {
        try {
            forcedUpdateShown = type == AppUpdateType.IMMEDIATE;
            appUpdateManager.startUpdateFlowForResult(
                info, updateLauncher, AppUpdateOptions.newBuilder(type).build()
            );
        } catch (Exception e) {
            forcedUpdateShown = false;
            Log.e(TAG, "No se pudo iniciar la actualización", e);
        }
    }

    private void showUpdateReadySnackbar() {
        Snackbar.make(
            findViewById(android.R.id.content),
            "Se descargó una nueva versión de Sandbook",
            Snackbar.LENGTH_INDEFINITE
        ).setAction("Reiniciar", v -> appUpdateManager.completeUpdate()).show();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        captureWidgetAction(intent);
    }

    private void captureWidgetAction(Intent intent) {
        if (intent == null) return;
        String action = intent.getStringExtra("widget_action");
        if (action != null) {
            WidgetActionPlugin.pendingAction = action;
        }
    }
}
