package com.jashpi

import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.telephony.SmsManager
import android.telephony.TelephonyManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

sealed class CallResult {
    data class Success(val message: String) : CallResult()
    data class FallbackDialer(val message: String) : CallResult()
    data class Failure(val reason: String) : CallResult()
}

class CommunicationManager(private val context: Context) {
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    fun isNetworkAvailable(): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return false
        val activeNetwork = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(activeNetwork) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    fun initiateDirectCall(phoneNumber: String): CallResult {
        val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
        if (tm != null && tm.simState != TelephonyManager.SIM_STATE_READY) {
            return CallResult.Failure("SIM card is not ready or missing (SIM State: ${tm.simState})")
        }

        val cleaned = phoneNumber.replace("[^0-9+]".toRegex(), "")
        if (cleaned.isBlank()) {
            return CallResult.Failure("Invalid phone number")
        }

        val callIntent = Intent(Intent.ACTION_CALL).apply {
            data = Uri.parse("tel:$cleaned")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }

        return try {
            context.startActivity(callIntent)
            CallResult.Success("Telephony call intent dispatched for $cleaned")
        } catch (e: SecurityException) {
            // CALL_PHONE permission denied or Android restriction - fallback to ACTION_DIAL
            val dialIntent = Intent(Intent.ACTION_DIAL).apply {
                data = Uri.parse("tel:$cleaned")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            try {
                context.startActivity(dialIntent)
                CallResult.FallbackDialer("CALL_PHONE restricted. Opened dialer interface for $cleaned")
            } catch (err: Exception) {
                CallResult.Failure("Failed to launch dialer: ${err.message}")
            }
        } catch (e: Exception) {
            CallResult.Failure("Call launch error: ${e.message}")
        }
    }

    fun sendEmergencySms(phoneNumber: String, messageText: String): Boolean {
        return try {
            val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                context.getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }

            val parts = smsManager.divideMessage(messageText)
            if (parts.size > 1) {
                smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null)
            } else {
                smsManager.sendTextMessage(phoneNumber, null, messageText, null, null)
            }
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    suspend fun relayToBackend(
        backendUrl: String,
        eventEntity: EmergencyEventEntity
    ): Boolean = withContext(Dispatchers.IO) {
        if (!isNetworkAvailable()) return@withContext false
        try {
            val payload = JSONObject().apply {
                put("eventId", eventEntity.eventId)
                put("timestamp", eventEntity.timestamp)
                put("triggerType", eventEntity.triggerType)
                put("emergencyType", eventEntity.emergencyType)
                put("confidence", eventEntity.confidence.toDouble())
                put("latitude", eventEntity.latitude)
                put("longitude", eventEntity.longitude)
                put("accuracy", eventEntity.accuracy?.toDouble())
                put("battery", eventEntity.battery)
                put("network", if (isNetworkAvailable()) "ONLINE" else "OFFLINE")
            }

            val request = Request.Builder()
                .url("$backendUrl/api/emergency")
                .post(payload.toString().toRequestBody(jsonMediaType))
                .build()

            httpClient.newCall(request).execute().use { response ->
                response.isSuccessful
            }
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    suspend fun sendTelegramAlert(
        botToken: String,
        chatId: String,
        message: String,
        lat: Double? = null,
        lng: Double? = null
    ): Boolean = withContext(Dispatchers.IO) {
        if (botToken.isBlank() || chatId.isBlank() || !isNetworkAvailable()) return@withContext false
        try {
            val textPayload = JSONObject().apply {
                put("chat_id", chatId)
                put("text", message)
                put("parse_mode", "Markdown")
            }

            val textRequest = Request.Builder()
                .url("https://api.telegram.org/bot$botToken/sendMessage")
                .post(textPayload.toString().toRequestBody(jsonMediaType))
                .build()

            val success = httpClient.newCall(textRequest).execute().use { it.isSuccessful }

            if (success && lat != null && lng != null) {
                val locPayload = JSONObject().apply {
                    put("chat_id", chatId)
                    put("latitude", lat)
                    put("longitude", lng)
                }
                val locRequest = Request.Builder()
                    .url("https://api.telegram.org/bot$botToken/sendLocation")
                    .post(locPayload.toString().toRequestBody(jsonMediaType))
                    .build()
                httpClient.newCall(locRequest).execute().close()
            }

            success
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    fun openWhatsAppShare(phone: String, text: String) {
        try {
            val cleaned = phone.replace("[^0-9]".toRegex(), "")
            val url = if (cleaned.isNotEmpty()) {
                "https://api.whatsapp.com/send?phone=$cleaned&text=${Uri.encode(text)}"
            } else {
                "https://api.whatsapp.com/send?text=${Uri.encode(text)}"
            }
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (_: Exception) {}
    }
}
