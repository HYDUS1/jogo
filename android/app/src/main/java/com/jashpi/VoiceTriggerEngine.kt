package com.jashpi

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import java.util.Locale

sealed class VoiceEvent {
    object WakeWordDetected : VoiceEvent()
    data class EmergencyCommandDetected(val command: String, val emergencyType: String, val confidence: Float) : VoiceEvent()
    data class PanicBurstDetected(val phrase: String, val count: Int) : VoiceEvent()
    object CancelCommandDetected : VoiceEvent()
    data class PartialText(val text: String) : VoiceEvent()
    data class Error(val message: String) : VoiceEvent()
}

class VoiceTriggerEngine(
    private val context: Context,
    private val onVoiceEvent: (VoiceEvent) -> Unit
) {
    private var speechRecognizer: SpeechRecognizer? = null
    private var isListening = false
    private val handler = Handler(Looper.getMainLooper())

    private val panicTimestamps = mutableListOf<Long>()
    private val PANIC_BURST_WINDOW_MS = 10000L
    private val PANIC_BURST_THRESHOLD = 3

    private val emergencyKeywords = mapOf(
        "bachao" to "PERSONAL_SAFETY",
        "bachao mujhe" to "PERSONAL_SAFETY",
        "help" to "DISTRESS",
        "help me" to "DISTRESS",
        "emergency" to "CRITICAL",
        "accident" to "ACCIDENT",
        "i had an accident" to "ACCIDENT",
        "accident ho gaya" to "ACCIDENT",
        "call my family" to "CALL_FAMILY",
        "call emergency contact" to "CALL_CONTACT",
        "send my location" to "LOCATION_BROADCAST",
        "i am not safe" to "PERSONAL_SAFETY",
        "someone is hurting me" to "VIOLENCE",
        "medical emergency" to "MEDICAL",
        "fire" to "FIRE",
        "police" to "POLICE",
        "ambulance" to "MEDICAL"
    )

    private val cancelKeywords = listOf("cancel", "i'm ok", "im ok", "stop", "i am ok", "galat tha")

    private val recognitionListener = object : RecognitionListener {
        override fun onReadyForSpeech(params: Bundle?) {}
        override fun onBeginningOfSpeech() {}
        override fun onRmsChanged(rmsdB: Float) {}
        override fun onBufferReceived(buffer: ByteArray?) {}
        override fun onEndOfSpeech() {
            // Restart listening if still active
            restartListeningDelayed(300)
        }

        override fun onError(error: Int) {
            val errMsg = when (error) {
                SpeechRecognizer.ERROR_NO_MATCH -> "No match"
                SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "Speech timeout"
                SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
                SpeechRecognizer.ERROR_CLIENT -> "Client error"
                SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Permissions missing"
                SpeechRecognizer.ERROR_NETWORK -> "Network issue"
                SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
                SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognizer busy"
                SpeechRecognizer.ERROR_SERVER -> "Server error"
                else -> "Unknown speech error ($error)"
            }

            // For non-fatal errors, automatically loop back
            if (isListening) {
                restartListeningDelayed(1000)
            }
        }

        override fun onResults(results: Bundle?) {
            val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            val confidences = results?.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES)
            if (!matches.isNullOrEmpty()) {
                val bestMatch = matches[0]
                val conf = confidences?.firstOrNull() ?: 0.9f
                processRecognizedText(bestMatch, conf)
            }
            if (isListening) {
                restartListeningDelayed(300)
            }
        }

        override fun onPartialResults(partialResults: Bundle?) {
            val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            if (!matches.isNullOrEmpty()) {
                val partial = matches[0]
                onVoiceEvent(VoiceEvent.PartialText(partial))
                processRecognizedText(partial, 0.75f)
            }
        }

        override fun onEvent(eventType: Int, params: Bundle?) {}
    }

    fun startListening() {
        if (isListening) return
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            onVoiceEvent(VoiceEvent.Error("Speech recognition not available on this device"))
            return
        }

        handler.post {
            try {
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
                    setRecognitionListener(this@VoiceTriggerEngine.recognitionListener)
                }
                isListening = true
                startInternal()
            } catch (e: Exception) {
                onVoiceEvent(VoiceEvent.Error("Failed to init recognizer: ${e.message}"))
            }
        }
    }

    private fun startInternal() {
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-IN")
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "hi-IN")
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
            putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.packageName)
        }
        try {
            speechRecognizer?.startListening(intent)
        } catch (e: Exception) {
            onVoiceEvent(VoiceEvent.Error("Start listening failed: ${e.message}"))
        }
    }

    private fun restartListeningDelayed(delayMs: Long) {
        if (!isListening) return
        handler.postDelayed({
            if (isListening && speechRecognizer != null) {
                try {
                    speechRecognizer?.cancel()
                    startInternal()
                } catch (_: Exception) {}
            }
        }, delayMs)
    }

    fun stopListening() {
        isListening = false
        handler.post {
            try {
                speechRecognizer?.stopListening()
                speechRecognizer?.cancel()
                speechRecognizer?.destroy()
                speechRecognizer = null
            } catch (_: Exception) {}
        }
    }

    private fun processRecognizedText(text: String, confidence: Float) {
        val cleaned = text.lowercase(Locale.getDefault()).trim()

        // 1. Check for Cancel
        for (kw in cancelKeywords) {
            if (cleaned.contains(kw)) {
                onVoiceEvent(VoiceEvent.CancelCommandDetected)
                return
            }
        }

        // 2. Check for Wake Phrase: "Hello Jashpi"
        if (cleaned.contains("hello jashpi") || cleaned.contains("jashpi")) {
            onVoiceEvent(VoiceEvent.WakeWordDetected)
        }

        // 3. Check for Panic Burst (Repeated phrase count)
        val isPanicWord = cleaned.contains("bachao") || cleaned.contains("help")
        if (isPanicWord) {
            val now = System.currentTimeMillis()
            panicTimestamps.add(now)
            // Prune timestamps older than window
            panicTimestamps.removeAll { now - it > PANIC_BURST_WINDOW_MS }
            if (panicTimestamps.size >= PANIC_BURST_THRESHOLD) {
                onVoiceEvent(VoiceEvent.PanicBurstDetected(cleaned, panicTimestamps.size))
                panicTimestamps.clear()
                return
            }
        }

        // 4. Check for Emergency Keywords
        for ((keyword, type) in emergencyKeywords) {
            if (cleaned.contains(keyword)) {
                onVoiceEvent(VoiceEvent.EmergencyCommandDetected(cleaned, type, confidence))
                return
            }
        }
    }
}
