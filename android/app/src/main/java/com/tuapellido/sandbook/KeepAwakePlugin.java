package com.tuapellido.sandbook;

import android.view.WindowManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Mantiene la pantalla encendida mientras corre el temporizador del "Plan por tiempo",
// así la app no queda en segundo plano y la alarma suena a horario.
@CapacitorPlugin(name = "KeepAwake")
public class KeepAwakePlugin extends Plugin {

    @PluginMethod
    public void keepAwake(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            call.resolve();
        });
    }

    @PluginMethod
    public void allowSleep(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            call.resolve();
        });
    }
}
