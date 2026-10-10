package com.jashpi

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import kotlin.math.sqrt

class FallDetector(
    private val context: Context,
    private val onFallDetected: (confidence: Float) -> Unit
) : SensorEventListener {

    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private val accelerometer: Sensor? = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)

    private var isMonitoring = false

    // State machine for fall sequence:
    // 0: Idle/Normal
    // 1: Freefall detected (< 3.0 m/s^2)
    // 2: Impact spike detected (> 24.0 m/s^2)
    // 3: Post-impact stillness monitoring
    private var state = 0
    private var freeFallTimestamp = 0L
    private var impactTimestamp = 0L
    private var stillnessStartTimestamp = 0L

    private val FREE_FALL_THRESHOLD = 3.2f // m/s^2
    private val IMPACT_THRESHOLD = 24.0f    // m/s^2
    private val STILLNESS_THRESHOLD = 2.0f // m/s^2 deviation from 9.8
    private val MAX_FALL_DURATION_MS = 1200L
    private val REQUIRED_STILLNESS_MS = 2000L

    fun startMonitoring(): Boolean {
        if (accelerometer == null) return false
        if (isMonitoring) return true
        isMonitoring = sensorManager.registerListener(
            this,
            accelerometer,
            SensorManager.SENSOR_DELAY_GAME
        )
        resetState()
        return isMonitoring
    }

    fun stopMonitoring() {
        if (!isMonitoring) return
        sensorManager.unregisterListener(this)
        isMonitoring = false
        resetState()
    }

    private fun resetState() {
        state = 0
        freeFallTimestamp = 0L
        impactTimestamp = 0L
        stillnessStartTimestamp = 0L
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (event == null || event.sensor.type != Sensor.TYPE_ACCELEROMETER) return

        val ax = event.values[0]
        val ay = event.values[1]
        val az = event.values[2]
        val totalAcc = sqrt((ax * ax + ay * ay + az * az).toDouble()).toFloat()
        val now = System.currentTimeMillis()

        when (state) {
            0 -> {
                // Check for free fall
                if (totalAcc < FREE_FALL_THRESHOLD) {
                    state = 1
                    freeFallTimestamp = now
                }
            }
            1 -> {
                // Waiting for impact spike after free fall
                if (now - freeFallTimestamp > MAX_FALL_DURATION_MS) {
                    // Timed out, reset
                    state = 0
                } else if (totalAcc > IMPACT_THRESHOLD) {
                    state = 2
                    impactTimestamp = now
                    stillnessStartTimestamp = now
                }
            }
            2 -> {
                // Post-impact stillness phase
                val deviation = Math.abs(totalAcc - 9.8f)
                if (deviation > STILLNESS_THRESHOLD * 2) {
                    // Patient is actively moving or walked away
                    if (now - impactTimestamp > 5000L) {
                        resetState()
                    }
                } else {
                    if (now - stillnessStartTimestamp >= REQUIRED_STILLNESS_MS) {
                        // High confidence fall detected: Freefall -> Impact -> Stillness confirmed
                        val confidence = 0.92f
                        resetState()
                        onFallDetected(confidence)
                    }
                }
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
}
