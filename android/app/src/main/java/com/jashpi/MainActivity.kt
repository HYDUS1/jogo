package com.jashpi

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var statusText: TextView
    private lateinit var toggleServiceBtn: Button
    private lateinit var testSosBtn: Button
    private lateinit var cancelSosBtn: Button

    private var isProtectionActive = false

    private val requiredPermissions = mutableListOf(
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.CALL_PHONE,
        Manifest.permission.SEND_SMS
    ).apply {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            add(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.entries.all { it.value }
        if (allGranted) {
            startSafetyService()
        } else {
            Toast.makeText(this, "Permissions needed for full hands-free safety protection", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Setup programmatically or via basic view
        val layout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(48, 80, 48, 48)
            setBackgroundColor(android.graphics.Color.parseColor("#080810"))
        }

        val titleView = TextView(this).apply {
            text = "JASHPI"
            textSize = 28f
            setTextColor(android.graphics.Color.parseColor("#00F3FF"))
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = android.view.Gravity.CENTER_HORIZONTAL
        }

        val subtitleView = TextView(this).apply {
            text = "Ek Tap, Ek Saans, Ek Zindagi\nHands-Free Voice & Sensor Emergency Protection"
            textSize = 14f
            setTextColor(android.graphics.Color.parseColor("#94A3B8"))
            gravity = android.view.Gravity.CENTER_HORIZONTAL
            setPadding(0, 8, 0, 48)
        }

        statusText = TextView(this).apply {
            text = "Protection Status: STANDBY"
            textSize = 16f
            setTextColor(android.graphics.Color.WHITE)
            gravity = android.view.Gravity.CENTER_HORIZONTAL
            setPadding(0, 16, 0, 32)
        }

        toggleServiceBtn = Button(this).apply {
            text = "ENABLE HANDS-FREE PROTECTION"
            setBackgroundColor(android.graphics.Color.parseColor("#0044FF"))
            setTextColor(android.graphics.Color.WHITE)
            setOnClickListener {
                if (isProtectionActive) {
                    stopSafetyService()
                } else {
                    checkAndRequestPermissions()
                }
            }
        }

        testSosBtn = Button(this).apply {
            text = "TEST SOS TRIGGER (TEST MODE)"
            setBackgroundColor(android.graphics.Color.parseColor("#FF1744"))
            setTextColor(android.graphics.Color.WHITE)
            setOnClickListener {
                Toast.makeText(this@MainActivity, "TEST SOS Triggered in Safe Diagnostic Mode", Toast.LENGTH_SHORT).show()
            }
        }

        cancelSosBtn = Button(this).apply {
            text = "CANCEL / RESET"
            setBackgroundColor(android.graphics.Color.parseColor("#1E293B"))
            setTextColor(android.graphics.Color.WHITE)
            setOnClickListener {
                Toast.makeText(this@MainActivity, "Resetting Emergency State", Toast.LENGTH_SHORT).show()
            }
        }

        layout.addView(titleView)
        layout.addView(subtitleView)
        layout.addView(statusText)
        layout.addView(toggleServiceBtn)
        layout.addView(testSosBtn)
        layout.addView(cancelSosBtn)

        setContentView(layout)
    }

    private fun checkAndRequestPermissions() {
        val missing = requiredPermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isEmpty()) {
            startSafetyService()
        } else {
            permissionLauncher.launch(missing.toTypedArray())
        }
    }

    private fun startSafetyService() {
        val intent = Intent(this, WakeWordService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
        isProtectionActive = true
        statusText.text = "Protection Status: 🟢 ACTIVE (Listening for 'Hello Jashpi' / 'Bachao')"
        toggleServiceBtn.text = "STOP HANDS-FREE PROTECTION"
    }

    private fun stopSafetyService() {
        val intent = Intent(this, WakeWordService::class.java)
        stopService(intent)
        isProtectionActive = false
        statusText.text = "Protection Status: ⚪ STANDBY"
        toggleServiceBtn.text = "ENABLE HANDS-FREE PROTECTION"
    }
}
