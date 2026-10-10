package com.jashpi

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat

class JashpiNotificationManager(private val context: Context) {
    companion object {
        const val CHANNEL_FOREGROUND = "jashpi_foreground_channel"
        const val CHANNEL_EMERGENCY = "jashpi_emergency_channel"
        const val FOREGROUND_NOTIFICATION_ID = 1001
        const val EMERGENCY_NOTIFICATION_ID = 9110
    }

    private val notificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    init {
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val foregroundChannel = NotificationChannel(
                CHANNEL_FOREGROUND,
                "JASHPI Protection Status",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows continuous hands-free voice and sensor emergency protection status."
                setShowBadge(false)
            }

            val emergencyChannel = NotificationChannel(
                CHANNEL_EMERGENCY,
                "JASHPI Emergency Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Urgent notifications during active emergency triggers and countdowns."
                enableVibration(true)
                setShowBadge(true)
            }

            notificationManager.createNotificationChannel(foregroundChannel)
            notificationManager.createNotificationChannel(emergencyChannel)
        }
    }

    fun buildForegroundNotification(statusText: String = "Voice & Sensor Protection Active"): Notification {
        val launchIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(context, CHANNEL_FOREGROUND)
            .setContentTitle("JASHPI Safety Engine")
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingIntent)
            .build()
    }

    fun updateForegroundNotification(statusText: String) {
        val notification = buildForegroundNotification(statusText)
        notificationManager.notify(FOREGROUND_NOTIFICATION_ID, notification)
    }

    fun showEmergencyAlertNotification(
        title: String,
        message: String,
        cancelIntent: PendingIntent? = null
    ) {
        val launchIntent = Intent(context, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            context,
            1,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(context, CHANNEL_EMERGENCY)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)

        if (cancelIntent != null) {
            builder.addAction(android.R.drawable.ic_menu_close_clear_cancel, "CANCEL SOS", cancelIntent)
        }

        notificationManager.notify(EMERGENCY_NOTIFICATION_ID, builder.build())
    }

    fun cancelEmergencyAlert() {
        notificationManager.cancel(EMERGENCY_NOTIFICATION_ID)
    }
}
