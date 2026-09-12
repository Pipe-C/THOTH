package com.toth.nativemodules

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.Arguments

/**
 * RoomDatabaseModule
 * Bridge nativo para persistencia local de prompts, documentos e historial
 * utilizando Room SQLite en Android.
 */
class RoomDatabaseModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "RoomDatabaseModule"
    }

    @ReactMethod
    fun saveDocument(docData: ReadableMap, promise: Promise) {
        try {
            // Placeholder para persistencia Room DB local
            val id = docData.getString("id") ?: System.currentTimeMillis().toString()
            promise.resolve(id)
        } catch (e: Exception) {
            promise.reject("ERR_ROOM_SAVE", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun getHistory(limit: Int, promise: Promise) {
        try {
            val results: WritableArray = Arguments.createArray()
            // Placeholder: Retorna lista vacía o cache local Room
            promise.resolve(results)
        } catch (e: Exception) {
            promise.reject("ERR_ROOM_GET_HISTORY", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun deleteDocument(docId: String, promise: Promise) {
        try {
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_ROOM_DELETE", e.localizedMessage, e)
        }
    }
}
