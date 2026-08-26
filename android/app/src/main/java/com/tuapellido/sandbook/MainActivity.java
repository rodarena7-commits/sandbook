package com.tuapellido.sandbook;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetActionPlugin.class);
        super.onCreate(savedInstanceState);
        captureWidgetAction(getIntent());
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
