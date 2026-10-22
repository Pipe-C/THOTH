package com.toth.nativemodules

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "documents")
data class TothDocument(
    @PrimaryKey val id: String,
    val title: String,
    val content: String,
    val documentType: String?,
    val profile: String?,
    val createdAt: Long,
)
