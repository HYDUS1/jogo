package com.jashpi

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.os.Looper
import com.google.android.gms.location.*

data class JashpiLocation(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val timestamp: Long,
    val provider: String,
    val mapsUrl: String
)

class JashpiLocationManager(private val context: Context) {
    private val fusedLocationClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)

    private var lastKnownLocation: JashpiLocation? = null
    private var locationCallback: LocationCallback? = null
    private var onLocationUpdateListener: ((JashpiLocation) -> Unit)? = null

    fun setLocationListener(listener: (JashpiLocation) -> Unit) {
        this.onLocationUpdateListener = listener
    }

    @SuppressLint("MissingPermission")
    fun getLastLocation(onResult: (JashpiLocation?) -> Unit) {
        try {
            fusedLocationClient.lastLocation.addOnSuccessListener { loc: Location? ->
                if (loc != null) {
                    val jLoc = toJashpiLocation(loc)
                    lastKnownLocation = jLoc
                    onResult(jLoc)
                } else {
                    onResult(lastKnownLocation)
                }
            }.addOnFailureListener {
                onResult(lastKnownLocation)
            }
        } catch (e: SecurityException) {
            e.printStackTrace()
            onResult(null)
        }
    }

    @SuppressLint("MissingPermission")
    fun startLiveTracking(intervalMs: Long = 10000L) {
        stopLiveTracking()
        try {
            val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, intervalMs)
                .setMinUpdateIntervalMillis(intervalMs / 2)
                .setWaitForAccurateLocation(false)
                .build()

            locationCallback = object : LocationCallback() {
                override fun onLocationResult(result: LocationResult) {
                    val loc = result.lastLocation ?: return
                    val jLoc = toJashpiLocation(loc)
                    lastKnownLocation = jLoc
                    onLocationUpdateListener?.invoke(jLoc)
                }
            }

            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback as LocationCallback,
                Looper.getMainLooper()
            )
        } catch (e: SecurityException) {
            e.printStackTrace()
        }
    }

    fun stopLiveTracking() {
        locationCallback?.let {
            fusedLocationClient.removeLocationUpdates(it)
            locationCallback = null
        }
    }

    private fun toJashpiLocation(loc: Location): JashpiLocation {
        val mapsUrl = "https://www.google.com/maps?q=${loc.latitude},${loc.longitude}"
        return JashpiLocation(
            latitude = loc.latitude,
            longitude = loc.longitude,
            accuracy = loc.accuracy,
            timestamp = loc.time,
            provider = loc.provider ?: "fused",
            mapsUrl = mapsUrl
        )
    }

    fun getCachedLocation(): JashpiLocation? = lastKnownLocation
}
