package com.jashpi

import android.annotation.SuppressLint
import android.content.Context
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import kotlinx.coroutines.*
import kotlin.math.sqrt

data class AcousticEvent(
    val type: String, // SCREAM, CRASH, GLASS_BREAK, DISTRESS_LOUD
    val confidence: Float,
    val decibels: Double
)

class AcousticDetector(
    private val context: Context,
    private val onAcousticDistress: (AcousticEvent) -> Unit
) {
    private var isRecording = false
    private var audioRecord: AudioRecord? = null
    private var job: Job? = null

    private val SAMPLE_RATE = 16000
    private val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
    private val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT

    private val DISTRESS_RMS_THRESHOLD = 8000.0 // High loudness
    private val SCREAM_HIGH_FREQ_RATIO = 0.65

    @SuppressLint("MissingPermission")
    fun startListening(): Boolean {
        if (isRecording) return true
        val bufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT)
        if (bufferSize <= 0) return false

        try {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.VOICE_RECOGNITION,
                SAMPLE_RATE,
                CHANNEL_CONFIG,
                AUDIO_FORMAT,
                bufferSize * 2
            )

            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                audioRecord?.release()
                audioRecord = null
                return false
            }

            audioRecord?.startRecording()
            isRecording = true

            job = CoroutineScope(Dispatchers.Default).launch {
                val audioBuffer = ShortArray(bufferSize)
                while (isActive && isRecording) {
                    val read = audioRecord?.read(audioBuffer, 0, bufferSize) ?: -1
                    if (read > 0) {
                        analyzeFrame(audioBuffer, read)
                    }
                    delay(80)
                }
            }
            return true
        } catch (e: SecurityException) {
            e.printStackTrace()
            return false
        } catch (e: Exception) {
            e.printStackTrace()
            return false
        }
    }

    private fun analyzeFrame(buffer: ShortArray, size: Int) {
        var sumSquares = 0.0
        var zeroCrossings = 0
        var prevSign = buffer[0] >= 0

        for (i in 0 until size) {
            val sample = buffer[i].toDouble()
            sumSquares += sample * sample

            val currentSign = buffer[i] >= 0
            if (currentSign != prevSign) {
                zeroCrossings++
                prevSign = currentSign
            }
        }

        val rms = sqrt(sumSquares / size)
        val zcr = zeroCrossings.toDouble() / size
        val db = if (rms > 0) 20 * Math.log10(rms) else 0.0

        // Distress scream or sudden high-frequency impact signature
        if (rms > DISTRESS_RMS_THRESHOLD) {
            if (zcr > 0.18) {
                // High pitch + intense loudness -> scream / distress cry
                val event = AcousticEvent(
                    type = "SCREAM",
                    confidence = 0.88f,
                    decibels = db
                )
                onAcousticDistress(event)
            } else if (rms > DISTRESS_RMS_THRESHOLD * 1.5) {
                // Heavy crash sound
                val event = AcousticEvent(
                    type = "CRASH",
                    confidence = 0.82f,
                    decibels = db
                )
                onAcousticDistress(event)
            }
        }
    }

    fun stopListening() {
        isRecording = false
        job?.cancel()
        job = null
        try {
            audioRecord?.stop()
            audioRecord?.release()
        } catch (_: Exception) {}
        audioRecord = null
    }
}
