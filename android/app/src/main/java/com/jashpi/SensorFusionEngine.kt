package com.jashpi

data class SensorFusionInput(
    val triggerSource: String, // MANUAL, VOICE, PANIC_BURST, FALL, ACCIDENT, ACOUSTIC
    val voiceConfidence: Float = 0f,
    val panicPhraseCount: Int = 0,
    val acousticConfidence: Float = 0f,
    val fallDetected: Boolean = false,
    val accidentDetected: Boolean = false,
    val batteryPct: Int = 100,
    val isMoving: Boolean = false,
    val userCancelled: Boolean = false
)

data class FusionDecision(
    val riskScore: Int,
    val emergencyType: String,
    val confidence: Float,
    val recommendedAction: String // IMMEDIATE_SOS, COUNTDOWN_CONFIRMATION, MONITORING
)

class SensorFusionEngine {

    fun evaluate(input: SensorFusionInput): FusionDecision {
        if (input.userCancelled) {
            return FusionDecision(
                riskScore = 0,
                emergencyType = "CANCELLED",
                confidence = 1.0f,
                recommendedAction = "CANCEL"
            )
        }

        // Manual SOS always has absolute priority
        if (input.triggerSource == "MANUAL") {
            return FusionDecision(
                riskScore = 100,
                emergencyType = "MANUAL_SOS",
                confidence = 1.0f,
                recommendedAction = "IMMEDIATE_SOS"
            )
        }

        var score = 0
        var type = "UNKNOWN"

        when (input.triggerSource) {
            "ACCIDENT" -> {
                score += 85
                type = "ACCIDENT"
                if (input.acousticConfidence > 0.5f) score += 10
            }
            "FALL" -> {
                score += 80
                type = "FALL"
                if (input.panicPhraseCount > 0) score += 15
            }
            "PANIC_BURST" -> {
                score += 90
                type = "PERSONAL_SAFETY"
            }
            "VOICE" -> {
                score += (input.voiceConfidence * 80).toInt()
                type = "VOICE_TRIGGERED"
            }
            "ACOUSTIC" -> {
                score += (input.acousticConfidence * 75).toInt()
                type = "ACOUSTIC_DISTRESS"
            }
        }

        // Fuse cross-sensor corroboration
        if (input.accidentDetected && input.fallDetected) score += 10
        if (input.panicPhraseCount >= 3) score += 15

        // Cap score at 100
        val finalScore = score.coerceIn(0, 100)
        val calculatedConfidence = (finalScore / 100.0f).coerceIn(0.5f, 0.99f)

        val action = when {
            finalScore >= 80 -> "IMMEDIATE_SOS"
            finalScore >= 50 -> "COUNTDOWN_CONFIRMATION"
            else -> "MONITORING"
        }

        return FusionDecision(
            riskScore = finalScore,
            emergencyType = type,
            confidence = calculatedConfidence,
            recommendedAction = action
        )
    }
}
