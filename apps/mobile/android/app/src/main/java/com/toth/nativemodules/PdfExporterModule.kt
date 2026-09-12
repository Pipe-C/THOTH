package com.toth.nativemodules

import android.graphics.pdf.PdfDocument
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import java.io.File
import java.io.FileOutputStream

/**
 * PdfExporterModule
 * Bridge nativo para exportación física de entregables académicos
 * a formato PDF o Word (DOCX) desde el dispositivo Android.
 */
class PdfExporterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "PdfExporterModule"
    }

    @ReactMethod
    fun exportToPdf(options: ReadableMap, promise: Promise) {
        try {
            val title = options.getString("title") ?: "Documento_TOTH"
            val content = options.getString("content") ?: ""
            val fileName = "${title.replace(" ", "_")}_${System.currentTimeMillis()}.pdf"
            
            val outputFile = File(reactApplicationContext.cacheDir, fileName)
            
            // Placeholder: generación real de PDF con PdfDocument o iText
            val document = PdfDocument()
            val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create() // A4
            val page = document.startPage(pageInfo)
            
            // En fase de desarrollo: finalizamos y escribimos
            document.finishPage(page)
            val fos = FileOutputStream(outputFile)
            document.writeTo(fos)
            document.close()
            fos.close()

            promise.resolve(outputFile.absolutePath)
        } catch (e: Exception) {
            promise.reject("ERR_PDF_EXPORT", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun exportToWord(options: ReadableMap, promise: Promise) {
        try {
            val title = options.getString("title") ?: "Documento_TOTH"
            val fileName = "${title.replace(" ", "_")}_${System.currentTimeMillis()}.docx"
            val outputFile = File(reactApplicationContext.cacheDir, fileName)
            // Placeholder: Word export path
            promise.resolve(outputFile.absolutePath)
        } catch (e: Exception) {
            promise.reject("ERR_WORD_EXPORT", e.localizedMessage, e)
        }
    }
}
