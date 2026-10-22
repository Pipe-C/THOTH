package com.toth.nativemodules

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [TothDocument::class],
    version = 1,
    exportSchema = false,
)
abstract class TothDatabase : RoomDatabase() {
    abstract fun documentDao(): TothDocumentDao

    companion object {
        private const val DATABASE_NAME = "toth.db"

        @Volatile
        private var instance: TothDatabase? = null

        fun get(context: Context): TothDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    TothDatabase::class.java,
                    DATABASE_NAME,
                ).build().also { instance = it }
            }
    }
}
