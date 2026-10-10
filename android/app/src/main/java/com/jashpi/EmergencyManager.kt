package com.jashpi

import android.content.Context
import android.os.Handler
import android.os.Looper
import kotlinx.coroutines.*
import java.util.UUID

sealed class EmergencyState {
    object Idle : EmergencyState()
    data class Countdown(val secondsRemaining: Int, val decision: FusionDecision) : EmergencyState()
    data class Triggered(val event: EmergencyEventEntity) : EmergencyState()
    data class Completed(val eventId: String) : EmergencyState()
    data class Cancelled(val reason: String) : EmergencyState()
}

class EmergencyManager(
    private val context: Context,
    private val locationManager: JashpiLocationManager,
    private val communicationManager: CommunicationManager,
    private val contactManager: ContactManager,
    private val notificationManager: JashpiNotificationManager,
    private val database: EmergencyRoomDatabase
) {
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private val handler = Handler(Looper.getMainLooper())

    private var currentState: EmergencyState = EmergencyState.Idle
    private var countdownRunnable: Runnable? = null
    private var activeEventId: String? = null

    var onStateChanged: ((EmergencyState) -> Unit)? = null

    fun triggerEmergency(decision: FusionDecision, userName: String = "User") {
        if (currentState is EmergencyState.Triggered) return

        if (decision.recommendedAction == "COUNTDOWN_CONFIRMATION") {
            startCountdown(decision, userName, 10)
        } else {
            executeEmergencyWorkflow(decision, userName)
        }
    }

    private fun startCountdown(decision: FusionDecision, userName: String, seconds: Int) {
        var remaining = seconds
        currentState = EmergencyState.Countdown(remaining, decision)
        onStateChanged?.invoke(currentState)

        notificationManager.showEmergencyAlertNotification(
            "JASHPI Emergency Detected",
            "Emergency trigger in $remaining seconds. Tap or say CANCEL to abort."
        )

        countdownRunnable = object : Runnable {
            override fun run() {
                remaining--
                if (remaining <= 0) {
                    executeEmergencyWorkflow(decision, userName)
                } else {
                    currentState = EmergencyState.Countdown(remaining, decision)
                    onStateChanged?.invoke(currentState)
                    handler.postDelayed(this, 1000)
                }
            }
        }
        handler.postDelayed(countdownRunnable!!, 1000)
    }

    fun cancelEmergency(reason: String = "User Cancelled") {
        countdownRunnable?.let { handler.removeCallbacks(it) }
        countdownRunnable = null

        activeEventId?.let { id ->
            scope.launch(Dispatchers.IO) {
                val dao = database.emergencyDao()
                val existing = dao.getEventById(id)
                if (existing != null) {
                    dao.updateEvent(existing.copy(cancelled = true))
                }
            }
        }

        locationManager.stopLiveTracking()
        notificationManager.cancelEmergencyAlert()

        currentState = EmergencyState.Cancelled(reason)
        onStateChanged?.invoke(currentState)
        currentState = EmergencyState.Idle
    }

    private fun executeEmergencyWorkflow(decision: FusionDecision, userName: String) {
        countdownRunnable?.let { handler.removeCallbacks(it) }
        countdownRunnable = null

        val eventId = UUID.randomUUID().toString()
        activeEventId = eventId

        scope.launch {
            // 1. Acquire current location
            locationManager.getLastLocation { loc ->
                scope.launch {
                    val lat = loc?.latitude
                    val lng = loc?.longitude
                    val accuracy = loc?.accuracy
                    val mapsLink = loc?.mapsUrl ?: "Location unavailable"

                    val primaryContact = contactManager.getPrimaryContact()
                    val contacts = contactManager.getContacts()

                    // 2. Prepare message
                    val message = "🚨 JASHPI EMERGENCY ALERT 🚨\nName: $userName\nEmergency: ${decision.emergencyType}\nTime: ${System.currentTimeMillis()}\nLocation: $mapsLink\nAccuracy: ${accuracy?.toInt() ?: 0}m\nStatus: Immediate Assistance Required"

                    // 3. Initiate direct call to primary contact
                    var callStatus = "NOT_ATTEMPTED"
                    if (primaryContact != null && primaryContact.callEnabled) {
                        when (val callRes = communicationManager.initiateDirectCall(primaryContact.phone)) {
                            is CallResult.Success -> callStatus = "INITIATED"
                            is CallResult.FallbackDialer -> callStatus = "FALLBACK_DIALER"
                            is CallResult.Failure -> callStatus = "FAILED: ${callRes.reason}"
                        }
                    }

                    // 4. Send SMS to all SMS-enabled contacts
                    var smsStatus = "NOT_CONFIGURED"
                    for (c in contacts.filter { it.smsEnabled && it.phone.isNotBlank() }) {
                        val sent = communicationManager.sendEmergencySms(c.phone, message)
                        smsStatus = if (sent) "DISPATCHED" else "FAILED"
                    }

                    // 5. Build database entity
                    val entity = EmergencyEventEntity(
                        eventId = eventId,
                        timestamp = System.currentTimeMillis(),
                        triggerType = decision.emergencyType,
                        emergencyType = decision.emergencyType,
                        confidence = decision.confidence,
                        latitude = lat,
                        longitude = lng,
                        accuracy = accuracy,
                        battery = 85,
                        network = if (communicationManager.isNetworkAvailable()) "ONLINE" else "OFFLINE",
                        callStatus = callStatus,
                        smsStatus = smsStatus,
                        telegramStatus = "PENDING",
                        trackingStatus = "ACTIVE",
                        cancelled = false
                    )

                    withContext(Dispatchers.IO) {
                        database.emergencyDao().insertEvent(entity)
                    }

                    // 6. Start live tracking
                    locationManager.startLiveTracking(15000L)

                    currentState = EmergencyState.Triggered(entity)
                    onStateChanged?.invoke(currentState)

                    notificationManager.showEmergencyAlertNotification(
                        "🚨 JASHPI Emergency Activated",
                        "Primary call and emergency alerts dispatched."
                    )

                    // 7. Backend relay in background
                    withContext(Dispatchers.IO) {
                        communicationManager.relayToBackend("https://ais-dev-6l3vuipgslv6aenq2omyfs-618460563269.asia-southeast1.run.app", entity)
                    }
                }
            }
        }
    }
}
