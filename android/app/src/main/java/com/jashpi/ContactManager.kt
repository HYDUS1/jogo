package com.jashpi

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

data class EmergencyContact(
    val id: String,
    val name: String,
    val phone: String,
    val relationship: String,
    val priority: Int = 1,
    val callEnabled: Boolean = true,
    val smsEnabled: Boolean = true,
    val telegramEnabled: Boolean = false,
    val whatsappEnabled: Boolean = true
)

class ContactManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("jashpi_contacts", Context.MODE_PRIVATE)

    fun getContacts(): List<EmergencyContact> {
        val raw = prefs.getString("contacts_json", null) ?: return defaultContacts()
        val list = mutableListOf<EmergencyContact>()
        try {
            val jsonArray = JSONArray(raw)
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                list.add(
                    EmergencyContact(
                        id = obj.optString("id", i.toString()),
                        name = obj.optString("name", "Emergency Contact"),
                        phone = obj.optString("phone", ""),
                        relationship = obj.optString("relationship", "Family"),
                        priority = obj.optInt("priority", i + 1),
                        callEnabled = obj.optBoolean("callEnabled", true),
                        smsEnabled = obj.optBoolean("smsEnabled", true),
                        telegramEnabled = obj.optBoolean("telegramEnabled", false),
                        whatsappEnabled = obj.optBoolean("whatsappEnabled", true)
                    )
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
            return defaultContacts()
        }
        return list.sortedBy { it.priority }
    }

    fun saveContacts(contacts: List<EmergencyContact>) {
        val jsonArray = JSONArray()
        for (c in contacts) {
            val obj = JSONObject()
            obj.put("id", c.id)
            obj.put("name", c.name)
            obj.put("phone", c.phone)
            obj.put("relationship", c.relationship)
            obj.put("priority", c.priority)
            obj.put("callEnabled", c.callEnabled)
            obj.put("smsEnabled", c.smsEnabled)
            obj.put("telegramEnabled", c.telegramEnabled)
            obj.put("whatsappEnabled", c.whatsappEnabled)
            jsonArray.put(obj)
        }
        prefs.edit().putString("contacts_json", jsonArray.toString()).apply()
    }

    fun getPrimaryContact(): EmergencyContact? {
        val list = getContacts()
        return list.firstOrNull { it.callEnabled && it.phone.isNotBlank() } ?: list.firstOrNull()
    }

    fun addContact(contact: EmergencyContact): Boolean {
        val list = getContacts().toMutableList()
        // Prevent duplicate phone numbers
        if (list.any { it.phone.replace("\\s".toRegex(), "") == contact.phone.replace("\\s".toRegex(), "") }) {
            return false
        }
        list.add(contact)
        saveContacts(list)
        return true
    }

    fun removeContact(id: String) {
        val list = getContacts().filterNot { it.id == id }
        saveContacts(list)
    }

    private fun defaultContacts(): List<EmergencyContact> {
        return listOf(
            EmergencyContact("1", "National Emergency (112)", "112", "Emergency Services", 1, true, true, false, false),
            EmergencyContact("2", "Ambulance (108)", "108", "Medical Service", 2, true, true, false, false)
        )
    }
}
