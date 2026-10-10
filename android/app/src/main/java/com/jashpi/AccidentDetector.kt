package com.jashpi

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import kotlin.math.sqrt

class AccidentDetector(
    private val context: Context,
    private val onAccidentDetected: (confidence: Float) -> Unit
) : SensorEventListener {

    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private val accelerometer: Sensor? = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    private val gyroscope: Sensor? = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)

    private var isMonitoring = false
    private var lastAccMagnitude = 9.8f
    private var highImpactTimestamp = 0L
    private var rotationSpikeDetected = false

    private val SEVERE_IMPACT_THRESHOLD = 32.0f // m/s^2 (~3.2G severe vehicular impact or collision)
    private val GYRO_ROTATION_THRESHOLD = 5.0f   // rad/s tumble

    fun startMonitoring(): Boolean {
        if (accelerometer == null) return false
        if (isMonitoring) return true

        val accOk = sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_GAME)
        if (gyroscope != null) {
            sensorManager.registerListener(this, gyroscope, SensorManager.SENSOR_DELAY_GAME)
        }
        isMonitoring = accOk
        return isMonitoring
    }

    fun stopMonitoring() {
        if (!isMonitoring) return
        sensorManager.unregisterListener(this)
        isMonitoring = false
        highImpactTimestamp = 0L
        rotationSpikeDetected = false
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (event == null) return
        val now = System.currentTimeMillis()

        if (event.sensor.type == Sensor.TYPE_ACCELEROMETER) {
            val ax = event.values[0]
            val ay = event.values[1]
            val az = event.values[2]
            val currentMagnitude = sqrt((ax * ax + ay * ay + az * az).toDouble()).toFloat()
            val delta = Math.abs(currentMagnitude - lastAccMagnitude)
            lastAccMagnitude = currentMagnitude

            // Check for extreme sudden deceleration or violent impact
            if (currentMagnitude > SEVERE_IMPACT_THRESHOLD || delta > 25.0f) {
                highImpactTimestamp = now
            }

            // If impact occurred within the last 1500ms and rotation tumble was detected
            if (highImpactTimestamp > 0 && now - highImpactTimestamp < 2000L) {
                if (rotationSpikeDetected || currentMagnitude > 38.0f) {
                    val confidence = if (rotationSpikeDetected) 0.95f else 0.85f
                    highImpactTimestamp = 0L
                    rotationSpikeDetected = false
                    onAccidentDetected(confidence)
                }
            }
        } else if (event.sensor.type == Sensor.TYPE_GYROSCOPE) {
            val rx = event.values[0]
            val ry = event.values[1]
            val rz = event.values[2]
            val rotMagnitude = sqrt((rx * rx + ry * ry + rz * rz).toDouble()).toFloat()
            if (rotMagnitude > GYRO_ROTATION_THRESHOLD) {
                rotationSpikeDetected = true
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
}
