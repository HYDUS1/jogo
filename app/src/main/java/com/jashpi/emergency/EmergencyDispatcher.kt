package com.jashpi.emergency

import android.content.Context
import android.content.Intent
import android.net.Uri

/**
 * Emergency Dispatcher for JASHPI AI.
 * Handles instant direct cellular emergency calls to 112, 108, and emergency contacts.
 */
object EmergencyDispatcher {

    const val NATIONAL_EMERGENCY_NUMBER = "112"
    const val AMBULANCE_NUMBER = "108"
    const val POLICE_NUMBER = "100"
    const val WOMEN_HELPLINE_NUMBER = "1091"
    const val CYBER_FRAUD_NUMBER = "1930"

    fun callEmergencyNumber(context: Context, number: String = NATIONAL_EMERGENCY_NUMBER) {
        val intent = Intent(Intent.ACTION_DIAL).apply {
            data = Uri.parse("tel:$number")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }

    fun dispatchSmsBroadcast(context: Context, phone: String, message: String) {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            data = Uri.parse("smsto:$phone")
            putExtra("sms_body", message)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }
}
