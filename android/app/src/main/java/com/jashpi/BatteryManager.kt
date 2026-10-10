package com.jashpi

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager

data class BatteryStatus(
    val percentage: Int,
    val isCharging: Boolean,
    val isLowBattery: Boolean,
    val isBelow15Percent: Boolean,
    val isCritical: Boolean
)

class JashpiBatteryManager(private val context: Context) {
    private var onBatteryChanged: ((BatteryStatus) -> Unit)? = null
    private var onThresholdWarning: ((BatteryStatus) -> Unit)? = null
    private var lastRecordedPercentage: Int = 100

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context?, intent: Intent?) {
            if (intent?.action == Intent.ACTION_BATTERY_CHANGED) {
                val status = parseBatteryIntent(intent)
                // Check if battery dropped below 15% threshold while discharging
                if (lastRecordedPercentage >= 15 && status.percentage < 15 && !status.isCharging) {
                    onThresholdWarning?.invoke(status)
                }
                lastRecordedPercentage = status.percentage
                onBatteryChanged?.invoke(status)
            }
        }
    }

    fun startMonitoring(
        onWarning: ((BatteryStatus) -> Unit)? = null,
        listener: (BatteryStatus) -> Unit
    ) {
        this.onThresholdWarning = onWarning
        this.onBatteryChanged = listener
        val filter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        context.registerReceiver(receiver, filter)
    }

    fun stopMonitoring() {
        try {
            context.unregisterReceiver(receiver)
        } catch (_: Exception) {}
    }

    fun getCurrentStatus(): BatteryStatus {
        val filter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        val intent = context.registerReceiver(null, filter)
        return parseBatteryIntent(intent)
    }

    private fun parseBatteryIntent(intent: Intent?): BatteryStatus {
        if (intent == null) return BatteryStatus(100, false, false, false)
        val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
        val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
        val pct = if (level >= 0 && scale > 0) (level * 100) / scale else 100
        val status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
        val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                status == BatteryManager.BATTERY_STATUS_FULL

        return BatteryStatus(
            percentage = pct,
            isCharging = isCharging,
            isLowBattery = pct <= 20,
            isBelow15Percent = pct < 15,
            isCritical = pct <= 10
        )
    }
}
