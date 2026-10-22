package com.toth.nativemodules

import android.graphics.Color
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import android.os.Environment
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import android.text.TextUtils
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import java.io.BufferedOutputStream
import java.io.File
import java.io.FileOutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

/**
 * PdfExporterModule
 * Bridge nativo para exportación física de entregables académicos
 * a formato PDF o Word (DOCX) desde el dispositivo Android.
 */
class PdfExporterModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

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
            .replace(Regex("[^A-Za-z0-9_-]+"), "_")
            .trim('_')
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

    private fun escapeXml(value: String): String =
        value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&apos;")

    private fun ReadableMap.optionalString(key: String): String =
        if (hasKey(key) && !isNull(key)) getString(key).orEmpty() else ""
}
