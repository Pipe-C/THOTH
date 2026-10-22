package com.toth.nativemodules

import android.content.ClipData
import android.content.ContentValues
import android.content.Intent
import android.graphics.Color
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import android.text.TextUtils
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import java.io.BufferedOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

/**
 * PdfExporterModule
 * Bridge nativo para exportación física de entregables académicos
 * a formato PDF o Word (DOCX) desde el dispositivo Android.
 */
class PdfExporterModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private companion object {
        const val TAG = "PdfExporterModule"
    }

    override fun getName(): String = "PdfExporterModule"

    @ReactMethod
    fun exportToPdf(options: ReadableMap, promise: Promise) {
        try {
            val title = options.optionalString("title").ifBlank { "Documento_TOTH" }
            val content = options.optionalString("content").ifBlank { " " }
            val outputFile = buildOutputFile(title, "pdf")

            writePdf(title, content, outputFile)
            promise.resolve(outputFile.absolutePath)
        } catch (e: Exception) {
            promise.reject("ERR_PDF_EXPORT", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun exportToWord(options: ReadableMap, promise: Promise) {
        try {
            val title = options.optionalString("title").ifBlank { "Documento_TOTH" }
            val content = options.optionalString("content")
            val outputFile = buildOutputFile(title, "docx")

            writeDocx(title, content, outputFile)
            promise.resolve(outputFile.absolutePath)
        } catch (e: Exception) {
            promise.reject("ERR_WORD_EXPORT", e.localizedMessage, e)
        }
    }

    /**
     * Publica una exportación en la carpeta pública Descargas/TOTH para que sea
     * visible desde el administrador de archivos. En Android 10+ usa MediaStore,
     * que no requiere permisos de almacenamiento. Devuelve un content:// URI
     * listo para compartir.
     */
    @ReactMethod
    fun publishToDownloads(filePath: String, mimeType: String, promise: Promise) {
        try {
            val file = File(filePath)
            if (!file.exists() || !file.isFile) {
                throw IOException("El archivo exportado no existe: $filePath")
            }

            val publishedUri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                publishWithMediaStore(file, mimeType)
            } else {
                null
            }

            val shareUri = publishedUri ?: fileProviderUri(file)
            val result = Arguments.createMap().apply {
                putString("fileName", file.name)
                putString("filePath", file.absolutePath)
                putString("uri", shareUri.toString())
                putString("mimeType", mimeType)
                putBoolean("published", publishedUri != null)
                putString(
                    "location",
                    if (publishedUri != null) {
                        "${Environment.DIRECTORY_DOWNLOADS}/TOTH/${file.name}"
                    } else {
                        file.absolutePath
                    },
                )
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERR_PUBLISH_EXPORT", e.localizedMessage, e)
        }
    }

    /** Abre la hoja de compartir de Android con el archivo exportado. */
    @ReactMethod
    fun shareFile(uriString: String, mimeType: String, promise: Promise) {
        try {
            val uri = Uri.parse(uriString)
            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = mimeType
                putExtra(Intent.EXTRA_STREAM, uri)
                clipData = ClipData.newUri(
                    reactApplicationContext.contentResolver,
                    "Documento TOTH",
                    uri,
                )
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            val chooser = Intent.createChooser(shareIntent, "Compartir documento")

            val activity = reactApplicationContext.currentActivity
            if (activity != null) {
                activity.startActivity(chooser)
            } else {
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startActivity(chooser)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_SHARE_FILE", e.localizedMessage, e)
        }
    }

    @RequiresApi(Build.VERSION_CODES.Q)
    private fun publishWithMediaStore(file: File, mimeType: String): Uri? {
        val resolver = reactApplicationContext.contentResolver
        val values = ContentValues().apply {
            put(MediaStore.Downloads.DISPLAY_NAME, file.name)
            put(MediaStore.Downloads.MIME_TYPE, mimeType)
            put(
                MediaStore.Downloads.RELATIVE_PATH,
                "${Environment.DIRECTORY_DOWNLOADS}/TOTH",
            )
            put(MediaStore.Downloads.IS_PENDING, 1)
        }

        val collection = MediaStore.Downloads.EXTERNAL_CONTENT_URI
        val uri = resolver.insert(collection, values) ?: return null

        return try {
            val output = resolver.openOutputStream(uri)
                ?: throw IOException("No se pudo abrir el destino en Descargas.")
            output.use { target ->
                file.inputStream().use { source -> source.copyTo(target) }
            }

            values.clear()
            values.put(MediaStore.Downloads.IS_PENDING, 0)
            resolver.update(uri, values, null, null)
            uri
        } catch (e: Exception) {
            Log.w(TAG, "No fue posible publicar en Descargas; se usará el archivo local.", e)
            resolver.delete(uri, null, null)
            null
        }
    }

    private fun fileProviderUri(file: File): Uri = FileProvider.getUriForFile(
        reactApplicationContext,
        "${reactApplicationContext.packageName}.fileprovider",
        file,
    )

    private fun buildOutputFile(title: String, extension: String): File {
        val baseDir = reactApplicationContext.getExternalFilesDir(
            Environment.DIRECTORY_DOCUMENTS,
        ) ?: reactApplicationContext.filesDir
        val exportsDir = File(baseDir, "TOTH")
        if (!exportsDir.exists() && !exportsDir.mkdirs()) {
            throw IllegalStateException("No fue posible crear el directorio de exportación.")
        }

        val safeTitle = title
            .trim()
            .replace(Regex("""[\\/:*?"<>|\u0000-\u001F]"""), "_")
            .replace(Regex("""\s+"""), "_")
            .trim('_', ' ', '.')
            .take(60)
            .ifBlank { "Documento_TOTH" }

        return File(
            exportsDir,
            "${safeTitle}_${System.currentTimeMillis()}.$extension",
        )
    }

    private fun writePdf(title: String, content: String, outputFile: File) {
        val document = PdfDocument()
        val pageWidth = 595
        val pageHeight = 842
        val margin = 48f
        val contentWidth = (pageWidth - margin * 2).toInt()
        val contentBottom = pageHeight - margin - 24f

        val titlePaint = Paint().apply {
            color = Color.rgb(45, 74, 62)
            textSize = 16f
            isAntiAlias = true
            isFakeBoldText = true
        }
        val bodyPaint = TextPaint().apply {
            color = Color.rgb(30, 41, 59)
            textSize = 11f
            isAntiAlias = true
        }
        val footerPaint = Paint().apply {
            color = Color.rgb(100, 116, 139)
            textSize = 8f
            isAntiAlias = true
        }

        val titleLayout = StaticLayout.Builder
            .obtain(title, 0, title.length, TextPaint(bodyPaint).apply {
                textSize = titlePaint.textSize
                color = titlePaint.color
                isFakeBoldText = true
            }, contentWidth)
            .setAlignment(Layout.Alignment.ALIGN_NORMAL)
            .setIncludePad(false)
            .setMaxLines(2)
            .setEllipsize(TextUtils.TruncateAt.END)
            .build()

        val contentLayout = StaticLayout.Builder
            .obtain(content, 0, content.length, bodyPaint, contentWidth)
            .setAlignment(Layout.Alignment.ALIGN_NORMAL)
            .setLineSpacing(0f, 1.2f)
            .setIncludePad(false)
            .build()

        val lineHeight = bodyPaint.fontSpacing
        val firstPageTop = margin + titleLayout.height + 18f
        val nextPageTop = margin + 12f

        var lineIndex = 0
        var pageNumber = 1

        do {
            val pageInfo = PdfDocument.PageInfo.Builder(
                pageWidth,
                pageHeight,
                pageNumber,
            ).create()
            val page = document.startPage(pageInfo)
            val canvas = page.canvas
            val pageTop = if (pageNumber == 1) firstPageTop else nextPageTop

            if (pageNumber == 1) {
                canvas.save()
                canvas.translate(margin, margin)
                titleLayout.draw(canvas)
                canvas.restore()
            }

            val availableHeight = (contentBottom - pageTop).coerceAtLeast(lineHeight)
            val linesPerPage = (availableHeight / lineHeight).toInt().coerceAtLeast(1)
            val endLine = (lineIndex + linesPerPage).coerceAtMost(contentLayout.lineCount)

            canvas.save()
            canvas.clipRect(
                margin,
                pageTop,
                margin + contentWidth,
                contentBottom,
            )
            canvas.translate(margin, pageTop - contentLayout.getLineTop(lineIndex))
            contentLayout.draw(canvas)
            canvas.restore()

            canvas.drawText(
                "TOTH · I.U. Pascual Bravo",
                margin,
                pageHeight - 26f,
                footerPaint,
            )
            canvas.drawText(
                pageNumber.toString(),
                pageWidth - margin - 12f,
                pageHeight - 26f,
                footerPaint,
            )

            document.finishPage(page)
            lineIndex = endLine
            pageNumber += 1
        } while (lineIndex < contentLayout.lineCount)

        FileOutputStream(outputFile).use { output ->
            document.writeTo(output)
        }
        document.close()
    }

    private fun writeDocx(title: String, content: String, outputFile: File) {
        val paragraphs = buildString {
            append(paragraph(title, bold = true))
            content.split(Regex("\\r?\\n")).forEach { line ->
                append(paragraph(line))
            }
        }

        val documentXml = """
            <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
              <w:body>
                $paragraphs
                <w:sectPr>
                  <w:pgSz w:w="11906" w:h="16838"/>
                  <w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418"/>
                </w:sectPr>
              </w:body>
            </w:document>
        """.trimIndent()

        val contentTypes = """
            <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
              <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
              <Default Extension="xml" ContentType="application/xml"/>
              <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
            </Types>
        """.trimIndent()

        val rootRels = """
            <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
              <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
            </Relationships>
        """.trimIndent()

        val documentRels = """
            <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>
        """.trimIndent()

        ZipOutputStream(BufferedOutputStream(FileOutputStream(outputFile))).use { zip ->
            writeEntry(zip, "[Content_Types].xml", contentTypes)
            writeEntry(zip, "_rels/.rels", rootRels)
            writeEntry(zip, "word/document.xml", documentXml)
            writeEntry(zip, "word/_rels/document.xml.rels", documentRels)
        }
    }

    private fun paragraph(text: String, bold: Boolean = false): String {
        if (text.isBlank()) return "<w:p/>"
        val runProperties = if (bold) "<w:rPr><w:b/></w:rPr>" else ""
        return "<w:p><w:r>$runProperties<w:t xml:space=\"preserve\">" +
            escapeXml(text) +
            "</w:t></w:r></w:p>"
    }

    private fun writeEntry(zip: ZipOutputStream, name: String, content: String) {
        zip.putNextEntry(ZipEntry(name))
        zip.write(content.toByteArray(Charsets.UTF_8))
        zip.closeEntry()
    }

    private fun escapeXml(value: String): String {
        val out = StringBuilder(value.length + 16)
        var index = 0
        while (index < value.length) {
            val codePoint = value.codePointAt(index)
            when {
                codePoint == 0x26 -> out.append("&amp;")
                codePoint == 0x3C -> out.append("&lt;")
                codePoint == 0x3E -> out.append("&gt;")
                codePoint == 0x22 -> out.append("&quot;")
                codePoint == 0x27 -> out.append("&apos;")
                codePoint == 0x09 || codePoint == 0x0A || codePoint == 0x0D ->
                    out.appendCodePoint(codePoint)
                // Caracteres de control inválidos en XML 1.0 y surrogates sueltos.
                codePoint < 0x20 || codePoint in 0xD800..0xDFFF ||
                    codePoint == 0xFFFE || codePoint == 0xFFFF -> Unit
                else -> out.appendCodePoint(codePoint)
            }
            index += Character.charCount(codePoint)
        }
        return out.toString()
    }

    private fun ReadableMap.optionalString(key: String): String =
        if (hasKey(key) && !isNull(key)) getString(key).orEmpty() else ""
}
