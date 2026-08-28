package com.tuapellido.sandbook;

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

    private AppUpdateManager appUpdateManager;

    // Debe registrarse antes de onCreate (patrón estándar de ActivityResultLauncher).
    private final ActivityResultLauncher<IntentSenderRequest> updateLauncher =
        registerForActivityResult(new ActivityResultContracts.StartIntentSenderForResult(), result -> {
            // Si el usuario cancela, Play Store se lo vuelve a ofrecer la próxima vez que abra la app.
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
    protected void onResume() {
        super.onResume();
        // Retoma un update "flexible" a medio descargar, y avisa si terminó de
        // descargarse mientras la app estaba en segundo plano.
        appUpdateManager.getAppUpdateInfo().addOnSuccessListener(info -> {
            if (info.installStatus() == InstallStatus.DOWNLOADED) {
                showUpdateReadySnackbar();
            } else if (info.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
                startFlexibleUpdate(info);
            }
        });
    }

    @Override
    protected void onDestroy() {
        appUpdateManager.unregisterListener(installStateListener);
        super.onDestroy();
    }

    // Le pregunta a Play Store si hay una versión más nueva publicada que la instalada.
    // No depende de nada manual: Google Play sabe cuál es el versionCode más reciente
    // en el momento en que la revisión termina y la versión queda "publicada".
    private void checkForUpdate() {
        appUpdateManager.getAppUpdateInfo().addOnSuccessListener(info -> {
            if (info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
                    && info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)) {
                startFlexibleUpdate(info);
            }
        }).addOnFailureListener(e -> Log.e(TAG, "No se pudo chequear actualizaciones", e));
    }

    private void startFlexibleUpdate(AppUpdateInfo info) {
        try {
            appUpdateManager.startUpdateFlowForResult(
                info, updateLauncher, AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE).build()
            );
        } catch (Exception e) {
            Log.e(TAG, "No se pudo iniciar la actualización flexible", e);
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
