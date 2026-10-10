package com.jashpi

import android.content.Context
import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "emergency_events")
data class EmergencyEventEntity(
    @PrimaryKey
    val eventId: String,
    val timestamp: Long,
    val triggerType: String,
    val emergencyType: String,
    val confidence: Float,
    val latitude: Double?,
    val longitude: Double?,
    val accuracy: Float?,
    val battery: Int?,
    val network: String?,
    val callStatus: String,
    val smsStatus: String,
    val telegramStatus: String,
    val trackingStatus: String,
    val cancelled: Boolean = false
)

@Dao
interface EmergencyDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvent(event: EmergencyEventEntity)

    @Update
    suspend fun updateEvent(event: EmergencyEventEntity)

    @Query("SELECT * FROM emergency_events ORDER BY timestamp DESC")
    fun getAllEvents(): Flow<List<EmergencyEventEntity>>

    @Query("SELECT * FROM emergency_events ORDER BY timestamp DESC")
    suspend fun getAllEventsList(): List<EmergencyEventEntity>

    @Query("SELECT * FROM emergency_events WHERE eventId = :id LIMIT 1")
    suspend fun getEventById(id: String): EmergencyEventEntity?

    @Query("DELETE FROM emergency_events WHERE eventId = :id")
    suspend fun deleteEventById(id: String)

    @Query("DELETE FROM emergency_events")
    suspend fun clearAll()
}

@Database(entities = [EmergencyEventEntity::class], version = 1, exportSchema = false)
abstract class EmergencyRoomDatabase : RoomDatabase() {
    abstract fun emergencyDao(): EmergencyDao

    companion object {
        @Volatile
        private var INSTANCE: EmergencyRoomDatabase? = null

        fun getDatabase(context: Context): EmergencyRoomDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    EmergencyRoomDatabase::class.java,
                    "jashpi_emergency_db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
