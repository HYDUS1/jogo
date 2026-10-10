package com.jashpi

import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.speech.tts.TextToSpeech
import java.util.Locale

class WakeWordService : Service(), TextToSpeech.OnInitListener {

    private lateinit var notificationManager: JashpiNotificationManager
    private lateinit var locationManager: JashpiLocationManager
    private lateinit var communicationManager: CommunicationManager
    private lateinit var contactManager: ContactManager
    private lateinit var batteryManager: JashpiBatteryManager
    private lateinit var database: EmergencyRoomDatabase
    private lateinit var emergencyManager: EmergencyManager
    private lateinit var fusionEngine: SensorFusionEngine

    private var voiceEngine: VoiceTriggerEngine? = null
    private var fallDetector: FallDetector? = null
    private var accidentDetector: AccidentDetector? = null
    private var acousticDetector: AcousticDetector? = null
    private var textToSpeech: TextToSpeech? = null
    private var isTtsReady: Boolean = false

    override fun onCreate() {
        super.onCreate()

        notificationManager = JashpiNotificationManager(this)
        locationManager = JashpiLocationManager(this)
        communicationManager = CommunicationManager(this)
        contactManager = ContactManager(this)
        batteryManager = JashpiBatteryManager(this)
        database = EmergencyRoomDatabase.getDatabase(this)
        fusionEngine = SensorFusionEngine()
        textToSpeech = TextToSpeech(this, this)

        emergencyManager = EmergencyManager(
            context = this,
            locationManager = locationManager,
            communicationManager = communicationManager,
            contactManager = contactManager,
            notificationManager = notificationManager,
            database = database
        )

        // Initialize detectors
        setupVoiceTrigger()
        setupSensors()
        setupBatteryMonitoring()
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            textToSpeech?.language = Locale("en", "IN")
            isTtsReady = true
        }
    }

    private fun speakAlert(text: String) {
        if (isTtsReady && textToSpeech != null) {
            textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "battery_alert")
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = notificationManager.buildForegroundNotification("JASHPI Hands-Free Protection Active")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                JashpiNotificationManager.FOREGROUND_NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
            )
        } else {
            startForeground(JashpiNotificationManager.FOREGROUND_NOTIFICATION_ID, notification)
        }

        voiceEngine?.startListening()
        fallDetector?.startMonitoring()
        accidentDetector?.startMonitoring()
        acousticDetector?.startListening()

        return START_STICKY
    }

    private fun setupVoiceTrigger() {
        voiceEngine = VoiceTriggerEngine(this) { event ->
            when (event) {
                is VoiceEvent.EmergencyCommandDetected -> {
                    val input = SensorFusionInput(
                        triggerSource = "VOICE",
                        voiceConfidence = event.confidence
                    )
                    val decision = fusionEngine.evaluate(input)
                    emergencyManager.triggerEmergency(decision)
                }
                is VoiceEvent.PanicBurstDetected -> {
                    val input = SensorFusionInput(
                        triggerSource = "PANIC_BURST",
                        panicPhraseCount = event.count,
                        voiceConfidence = 0.95f
                    )
                    val decision = fusionEngine.evaluate(input)
                    emergencyManager.triggerEmergency(decision)
                }
                is VoiceEvent.CancelCommandDetected -> {
                    emergencyManager.cancelEmergency("Voice Cancelled")
                }
                else -> {}
            }
        }
    }

    private fun setupSensors() {
        fallDetector = FallDetector(this) { conf ->
            val input = SensorFusionInput(triggerSource = "FALL", fallDetected = true)
            val decision = fusionEngine.evaluate(input)
            emergencyManager.triggerEmergency(decision)
        }

        accidentDetector = AccidentDetector(this) { conf ->
            val input = SensorFusionInput(triggerSource = "ACCIDENT", accidentDetected = true)
            val decision = fusionEngine.evaluate(input)
            emergencyManager.triggerEmergency(decision)
        }

        acousticDetector = AcousticDetector(this) { acousticEvent ->
            val input = SensorFusionInput(
                triggerSource = "ACOUSTIC",
                acousticConfidence = acousticEvent.confidence
            )
            val decision = fusionEngine.evaluate(input)
            emergencyManager.triggerEmergency(decision)
        }
    }

    private fun setupBatteryMonitoring() {
        batteryManager.startMonitoring(
            onWarning = { status ->
                // Voice notification alert
                speakAlert("Warning: Device battery is below 15 percent. JASHPI protection is optimized for battery saving. Please connect a charger.")
                // Update foreground notification status bar
                notificationManager.updateForegroundNotification(
                    "⚠️ Battery Low (${status.percentage}%): Power Saver Active. Protection preserved."
                )
            },
            listener = { status ->
                if (status.isBelow15Percent) {
                    notificationManager.updateForegroundNotification(
                        "⚠️ Battery Low (${status.percentage}%): Power Saver Active"
                    )
                }
                if (status.isCritical) {
                    // Throttle sensor polling if critically low to conserve last emergency reserve
                    fallDetector?.stopMonitoring()
                }
            }
        )
    }

    override fun onDestroy() {
        super.onDestroy()
        voiceEngine?.stopListening()
        fallDetector?.stopMonitoring()
        accidentDetector?.stopMonitoring()
        acousticDetector?.stopListening()
        batteryManager.stopMonitoring()
        textToSpeech?.stop()
        textToSpeech?.shutdown()
        textToSpeech = null
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
