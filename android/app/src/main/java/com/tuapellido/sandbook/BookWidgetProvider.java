package com.tuapellido.sandbook;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public class BookWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_book);

            views.setOnClickPendingIntent(
                R.id.widget_scan_button,
                buildPendingIntent(context, "scan_isbn", appWidgetId * 10 + 1)
            );
            views.setOnClickPendingIntent(
                R.id.widget_search_button,
                buildPendingIntent(context, "search_book", appWidgetId * 10 + 2)
            );

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }

    private PendingIntent buildPendingIntent(Context context, String widgetAction, int requestCode) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("widget_action", widgetAction);
        return PendingIntent.getActivity(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }
}
