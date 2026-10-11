package com.jashpi.emergency

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.hardware.camera2.CameraManager
import android.location.Location
import android.location.LocationManager
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.Settings
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.jashpi.emergency.databinding.ActivityMainBinding
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var downloadId: Long = -1L
    private var downloadedFile: File? = null

    // Torch & Siren states
    private var isTorchOn: Boolean = false
    private var isSirenRunning: Boolean = false
    private var sirenThread: Thread? = null

    companion object {
        const val APK_DOWNLOAD_URL = "https://github.com/HYDUS1/jogo/releases/download/v1.0/app-debug.apk"
        const val APK_FILE_NAME = "app-debug.apk"
    }

    // Android 8+ Unknown App Sources permission request launcher
    private val installPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (packageManager.canRequestPackageInstalls()) {
                Toast.makeText(this, "Permission granted. Starting APK download...", Toast.LENGTH_SHORT).show()
                startApkDownload()
            } else {
                Toast.makeText(this, "Install permission required to install APK update.", Toast.LENGTH_LONG).show()
            }
        }
    }

    // Download complete broadcast receiver
    private val onDownloadCompleteReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L)
            if (id != -1L && id == downloadId) {
                binding.cardDownloadStatus.visibility = View.GONE
                binding.btnInstallApk.isEnabled = true
                binding.btnInstallApk.text = getString(R.string.install_apk)

                val file = downloadedFile?.takeIf { it.exists() }
                    ?: File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), APK_FILE_NAME)
                if (file.exists()) {
                    Toast.makeText(context, "Download complete. Opening installer...", Toast.LENGTH_SHORT).show()
                    installApk(file)
                } else {
                    Toast.makeText(context, "Downloaded file not found. Please try again.", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupListeners()
        registerDownloadReceiver()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopSiren()
        turnOffTorch()
        try {
            unregisterReceiver(onDownloadCompleteReceiver)
        } catch (e: Exception) {
            // Receiver already unregistered
        }
    }

    private fun registerDownloadReceiver() {
        val filter = IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.registerReceiver(
                this,
                onDownloadCompleteReceiver,
                filter,
                ContextCompat.RECEIVER_EXPORTED
            )
        } else {
            registerReceiver(onDownloadCompleteReceiver, filter)
        }
    }

    private fun setupListeners() {
        // 1. Top Right Working Install Button (DownloadManager + FileProvider)
        binding.btnInstallApk.setOnClickListener {
            handleInstallButtonClick()
        }

        // 2. Giant SOS Button (Alerts Police 112 + WhatsApp + Siren)
        binding.btnSos.setOnClickListener {
            toggleSiren(true)
            shareWhatsAppLocation()
            val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:112"))
            startActivity(dialIntent)
        }

        // 3. 112 Police Button
        binding.btnCallPolice.setOnClickListener {
            val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:112"))
            startActivity(dialIntent)
        }

        // 4. 108 Ambulance Button
        binding.btnCallAmbulance.setOnClickListener {
            val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:108"))
            startActivity(dialIntent)
        }

        // 5. WhatsApp Live GPS Location Button
        binding.btnWhatsappLocation.setOnClickListener {
            shareWhatsAppLocation()
        }

        // 6. Telegram Emergency Alert Button
        binding.btnTelegramAlert.setOnClickListener {
            sendTelegramEmergencyAlert()
        }

        // 7. Flashlight / Torch Toggle Button
        binding.btnTorch.setOnClickListener {
            toggleTorch()
        }

        // 8. Loud Emergency Siren Button
        binding.btnSiren.setOnClickListener {
            toggleSiren()
        }
    }

    /**
     * Handles the Install button click on the top right.
     * Verifies Android 8+ REQUEST_INSTALL_PACKAGES permission before starting download.
     */
    private fun handleInstallButtonClick() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (!packageManager.canRequestPackageInstalls()) {
                AlertDialog.Builder(this)
                    .setTitle("Permission Needed")
                    .setMessage("To install the APK update, please enable 'Allow from this source' on the next screen.")
                    .setPositiveButton("Settings") { _, _ ->
                        val intent = Intent(
                            Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                            Uri.parse("package:$packageName")
                        )
                        installPermissionLauncher.launch(intent)
                    }
                    .setNegativeButton("Cancel", null)
                    .show()
                return
            }
        }

        startApkDownload()
    }

    /**
     * Initiates the APK file download via Android DownloadManager.
     */
    private fun startApkDownload() {
        try {
            val downloadDir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
            if (downloadDir != null && !downloadDir.exists()) {
                downloadDir.mkdirs()
            }

            val apkFile = File(downloadDir, APK_FILE_NAME)
            if (apkFile.exists()) {
                apkFile.delete()
            }
            downloadedFile = apkFile

            val request = DownloadManager.Request(Uri.parse(APK_DOWNLOAD_URL)).apply {
                setTitle("JASHPI AI - App Update")
                setDescription("Downloading $APK_FILE_NAME...")
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                setDestinationInExternalFilesDir(
                    this@MainActivity,
                    Environment.DIRECTORY_DOWNLOADS,
                    APK_FILE_NAME
                )
                setMimeType("application/vnd.android.package-archive")
            }

            val downloadManager = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            downloadId = downloadManager.enqueue(request)

            binding.cardDownloadStatus.visibility = View.VISIBLE
            binding.btnInstallApk.isEnabled = false
            binding.btnInstallApk.text = getString(R.string.installing)

            Toast.makeText(this, "Downloading APK update...", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            binding.cardDownloadStatus.visibility = View.GONE
            binding.btnInstallApk.isEnabled = true
            binding.btnInstallApk.text = getString(R.string.install_apk)
            Toast.makeText(this, "Failed to start download: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    /**
     * Opens the package installer using FileProvider with authority ${applicationId}.provider
     */
    private fun installApk(file: File) {
        try {
            val contentUri: Uri = FileProvider.getUriForFile(
                this,
                "$packageName.provider",
                file
            )

            val installIntent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(contentUri, "application/vnd.android.package-archive")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
            }

            startActivity(installIntent)
        } catch (e: Exception) {
            Toast.makeText(this, "Installer error: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    /**
     * Acquires last known location and opens WhatsApp with live location text and Google Maps pin.
     */
    private fun shareWhatsAppLocation() {
        try {
            val loc = getLastKnownLocation()
            val mapsLink = if (loc != null) {
                "https://www.google.com/maps?q=${loc.latitude},${loc.longitude}"
            } else {
                "Location not fixed yet (GPS scanning)"
            }

            val text = "🚨 *JASHPI EMERGENCY SOS ALERT* 🚨\n" +
                    "Immediate help required!\n" +
                    "Live Location: $mapsLink\n" +
                    "Time: ${java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date())}"

            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("https://api.whatsapp.com/send?text=${Uri.encode(text)}")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(this, "WhatsApp error: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    /**
     * Broadcasts emergency alert to Telegram Bot API in background thread.
     */
    private fun sendTelegramEmergencyAlert() {
        Toast.makeText(this, "Broadcasting emergency alert to Telegram...", Toast.LENGTH_SHORT).show()
        thread {
            try {
                val loc = getLastKnownLocation()
                val mapsLink = if (loc != null) {
                    "https://www.google.com/maps?q=${loc.latitude},${loc.longitude}"
                } else {
                    "Coordinates pending fix"
                }

                // Default relay endpoint or direct Telegram share
                val shareUrl = "https://t.me/share/url?url=${Uri.encode(mapsLink)}&text=${Uri.encode("🚨 JASHPI EMERGENCY SOS!")}"
                runOnUiThread {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(shareUrl)).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    startActivity(intent)
                }
            } catch (e: Exception) {
                runOnUiThread {
                    Toast.makeText(this, "Telegram alert: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    /**
     * Toggles device LED flashlight via CameraManager.
     */
    private fun toggleTorch() {
        try {
            val cameraManager = getSystemService(Context.CAMERA_SERVICE) as CameraManager
            val cameraId = cameraManager.cameraIdList.firstOrNull() ?: return
            isTorchOn = !isTorchOn
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                cameraManager.setTorchMode(cameraId, isTorchOn)
            }
            binding.btnTorch.text = if (isTorchOn) "Torch ON" else "Flashlight"
            Toast.makeText(this, if (isTorchOn) "Flashlight ON" else "Flashlight OFF", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Toast.makeText(this, "Torch error: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun turnOffTorch() {
        if (isTorchOn) {
            try {
                val cameraManager = getSystemService(Context.CAMERA_SERVICE) as CameraManager
                val cameraId = cameraManager.cameraIdList.firstOrNull() ?: return
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    cameraManager.setTorchMode(cameraId, false)
                }
                isTorchOn = false
            } catch (e: Exception) {}
        }
    }

    /**
     * Toggles high-decibel synthetic emergency siren tone using AudioTrack.
     */
    private fun toggleSiren(forceStart: Boolean = false) {
        if (isSirenRunning && !forceStart) {
            stopSiren()
            binding.btnSiren.text = "Alarm Siren"
            Toast.makeText(this, "Siren silenced", Toast.LENGTH_SHORT).show()
        } else {
            startSiren()
            binding.btnSiren.text = "Stop Siren"
            Toast.makeText(this, "🚨 Loud Siren Activated!", Toast.LENGTH_SHORT).show()
        }
    }

    private fun startSiren() {
        if (isSirenRunning) return
        isSirenRunning = true

        sirenThread = thread {
            try {
                val sampleRate = 44100
                val minBufferSize = AudioTrack.getMinBufferSize(
                    sampleRate,
                    AudioFormat.CHANNEL_OUT_MONO,
                    AudioFormat.ENCODING_PCM_16BIT
                )

                val audioTrack = AudioTrack(
                    AudioManager.STREAM_ALARM,
                    sampleRate,
                    AudioFormat.CHANNEL_OUT_MONO,
                    AudioFormat.ENCODING_PCM_16BIT,
                    minBufferSize * 2,
                    AudioTrack.MODE_STREAM
                )

                audioTrack.play()

                val buffer = ShortArray(1024)
                var currentFreq = 600.0
                var goingUp = true

                while (isSirenRunning) {
                    if (goingUp) {
                        currentFreq += 15.0
                        if (currentFreq >= 1200.0) goingUp = false
                    } else {
                        currentFreq -= 15.0
                        if (currentFreq <= 600.0) goingUp = true
                    }

                    for (i in buffer.indices) {
                        val angle = 2.0 * Math.PI * i / (sampleRate / currentFreq)
                        buffer[i] = (Math.sin(angle) * Short.MAX_VALUE).toInt().toShort()
                    }

                    audioTrack.write(buffer, 0, buffer.size)
                }

                audioTrack.stop()
                audioTrack.release()
            } catch (e: Exception) {}
        }
    }

    private fun stopSiren() {
        isSirenRunning = false
        sirenThread?.interrupt()
        sirenThread = null
    }

    private fun getLastKnownLocation(): Location? {
        val lm = getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return null
        return try {
            val gpsLoc = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            val netLoc = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            gpsLoc ?: netLoc
        } catch (e: SecurityException) {
            null
        }
    }
}
