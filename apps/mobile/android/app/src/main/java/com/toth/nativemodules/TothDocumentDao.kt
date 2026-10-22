package com.toth.nativemodules

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface TothDocumentDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun upsert(document: TothDocument)

    @Query("SELECT * FROM documents ORDER BY createdAt DESC LIMIT :limit")
    fun getHistory(limit: Int): List<TothDocument>

    @Query("DELETE FROM documents WHERE id = :id")
    fun deleteById(id: String)
}
