package com.tuapellido.sandbook;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetAction")
public class WidgetActionPlugin extends Plugin {

    // Escrito por MainActivity cuando el intent trae un extra "widget_action"
    // (botón del widget de pantalla de inicio tocado).
    public static String pendingAction = null;

    @PluginMethod
    public void getPendingAction(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("action", pendingAction);
        pendingAction = null; // se consume una sola vez
        call.resolve(ret);
    }
}
