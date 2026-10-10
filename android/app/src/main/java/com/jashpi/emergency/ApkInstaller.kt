package com.jashpi.emergency

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import androidx.core.content.FileProvider
import java.io.File

/**
 * APK Installer helper managing DownloadManager and FileProvider intent launching.
 */
class ApkInstaller(private val context: Context) {

    companion object {
        const val DEFAULT_APK_URL = "https://github.com/HYDUS1/jogo/releases/download/v1.0/app-debug.apk"
        const val APK_NAME = "app-debug.apk"
    }

    /**
     * Checks if the app has permission to install unknown apps (Android 8.0+).
     */
    fun canRequestPackageInstalls(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.packageManager.canRequestPackageInstalls()
        } else {
            true
        }
    }

    /**
     * Creates intent to open unknown sources settings.
     */
    fun createManageUnknownSourcesIntent(): Intent {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${context.packageName}"))
        } else {
            Intent(Settings.ACTION_SECURITY_SETTINGS)
        }
    }

    /**
     * Enqueues download of APK via Android DownloadManager.
     */
    fun downloadApk(url: String = DEFAULT_APK_URL): Long {
        val downloadDir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
        if (downloadDir != null && !downloadDir.exists()) {
            downloadDir.mkdirs()
        }

        val destinationFile = File(downloadDir, APK_NAME)
        if (destinationFile.exists()) {
            destinationFile.delete()
        }

        val request = DownloadManager.Request(Uri.parse(url)).apply {
            setTitle("JASHPI AI - APK Update")
            setDescription("Downloading latest release APK...")
            setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            setDestinationUri(Uri.fromFile(destinationFile))
            setMimeType("application/vnd.android.package-archive")
        }

        val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        return dm.enqueue(request)
    }

    /**
     * Opens package installer for the downloaded file using FileProvider.
     */
    fun openInstaller(file: File) {
        val contentUri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.provider",
            file
        )

        val installIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(contentUri, "application/vnd.android.package-archive")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
        }

        context.startActivity(installIntent)
    }

    fun getDownloadedFile(): File {
        val downloadDir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
        return File(downloadDir, APK_NAME)
    }
}
