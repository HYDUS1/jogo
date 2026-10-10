package com.jashpi.emergency

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
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

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var downloadId: Long = -1L
    private var downloadedFile: File? = null

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
                Toast.makeText(this, "Install permission is required to install APK update.", Toast.LENGTH_LONG).show()
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
        // Top Right Working Install Button
        binding.btnInstallApk.setOnClickListener {
            handleInstallButtonClick()
        }

        // SOS Button
        binding.btnSos.setOnClickListener {
            val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:112"))
            startActivity(dialIntent)
        }

        // 112 Police Button
        binding.btnCallPolice.setOnClickListener {
            val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:112"))
            startActivity(dialIntent)
        }

        // 108 Ambulance Button
        binding.btnCallAmbulance.setOnClickListener {
            val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:108"))
            startActivity(dialIntent)
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
}
