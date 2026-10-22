package com.toth.nativemodules

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import java.util.UUID

/**
 * RoomDatabaseModule
 * Bridge nativo para persistencia local de prompts, documentos e historial
 * utilizando Room SQLite en Android.
 */
class RoomDatabaseModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "RoomDatabaseModule"

    @ReactMethod
    fun saveDocument(docData: ReadableMap, promise: Promise) {
        try {
            val content = docData.optionalString("content")
            if (content.isBlank()) {
                promise.reject("ERR_ROOM_SAVE", "El documento no tiene contenido.")
                return
            }

            val id = docData.optionalString("id").ifBlank {
                UUID.randomUUID().toString()
            }
            val document = TothDocument(
                id = id,
                title = docData.optionalString("title").ifBlank { "Documento TOTH" },
                content = content,
                documentType = docData.optionalString("documentType").ifBlank { null },
                profile = docData.optionalString("profile").ifBlank { null },
                createdAt = if (docData.hasKey("createdAt") && !docData.isNull("createdAt")) {
                    docData.getDouble("createdAt").toLong()
                } else {
                    System.currentTimeMillis()
                },
            )

            TothDatabase.get(reactApplicationContext)
                .documentDao()
                .upsert(document)

            promise.resolve(id)
        } catch (e: Exception) {
            promise.reject("ERR_ROOM_SAVE", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun getHistory(limit: Int, promise: Promise) {
        try {
            val safeLimit = limit.coerceIn(1, 100)
            val documents = TothDatabase.get(reactApplicationContext)
                .documentDao()
                .getHistory(safeLimit)

            val results: WritableArray = Arguments.createArray()
            documents.forEach { document ->
                results.pushMap(
                    Arguments.createMap().apply {
                        putString("id", document.id)
                        putString("title", document.title)
                        putString("content", document.content)
                        putString("documentType", document.documentType)
                        putString("profile", document.profile)
                        putDouble("createdAt", document.createdAt.toDouble())
                    },
                )
            }

            promise.resolve(results)
        } catch (e: Exception) {
            promise.reject("ERR_ROOM_GET_HISTORY", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun deleteDocument(docId: String, promise: Promise) {
        try {
            TothDatabase.get(reactApplicationContext)
                .documentDao()
                .deleteById(docId)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_ROOM_DELETE", e.localizedMessage, e)
        }
    }

    private fun ReadableMap.optionalString(key: String): String =
        if (hasKey(key) && !isNull(key)) getString(key).orEmpty() else ""
}
