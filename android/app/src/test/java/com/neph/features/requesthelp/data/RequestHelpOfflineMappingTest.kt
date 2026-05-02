package com.neph.features.requesthelp.data

import com.neph.core.sync.LocalOwnerType
import com.neph.core.sync.SyncStatus
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.json.JSONArray
import org.json.JSONObject

class RequestHelpOfflineMappingTest {
    @Test
    fun submissionCreatesPendingLocalEntityForOfflineWrite() {
        val submission = sampleSubmission()
        val entity = submission.toEntity(
            localId = "local-test",
            ownerType = LocalOwnerType.GUEST,
            now = 1234L,
            syncStatus = SyncStatus.PENDING_CREATE
        )

        assertEquals("local-test", entity.localId)
        assertEquals(LocalOwnerType.GUEST, entity.ownerType)
        assertEquals(SyncStatus.PENDING_CREATE, entity.syncStatus)
        assertEquals("PENDING_SYNC", entity.status)
        assertEquals("Need water and medication", entity.description)
        assertEquals(listOf("food_water", "first_aid"), entity.helpTypesJson.jsonArrayToStringList())
        assertFalse(entity.isDeleted)
    }

    @Test
    fun submissionJsonMatchesBackendContractForCreate() {
        val json = sampleSubmission().toJson()

        assertEquals(2, json.getJSONArray("helpTypes").length())
        assertEquals("food_water", json.getJSONArray("helpTypes").getString(0))
        assertEquals(3, json.getInt("affectedPeopleCount"))
        assertEquals("Kadikoy", json.getJSONObject("location").getString("district"))
        assertEquals(5551234567L, json.getJSONObject("contact").getLong("phone"))
        assertTrue(json.getBoolean("consentGiven"))
    }

    @Test
    fun submissionJsonIncludesCoordinatesWhenAvailable() {
        val submission = sampleSubmission().copy(
            location = RequestHelpLocationSubmission(
                country = "Turkey",
                city = "Istanbul",
                district = "Kadikoy",
                neighborhood = "Moda",
                extraAddress = "Near park",
                latitude = 40.987,
                longitude = 29.025,
                coordinateSource = "DEVICE_GPS",
                coordinateCapturedAt = "2026-05-02T10:00:00.000Z"
            )
        )
        val json = submission.toJson()
        val entity = submission.toEntity(
            localId = "local-with-location",
            ownerType = LocalOwnerType.AUTHENTICATED,
            now = 1234L,
            syncStatus = SyncStatus.PENDING_CREATE
        )

        val location = json.getJSONObject("location")
        assertEquals(40.987, location.getDouble("latitude"), 0.0)
        assertEquals(29.025, location.getDouble("longitude"), 0.0)
        assertEquals("DEVICE_GPS", location.getJSONObject("coordinate").getString("source"))
        assertEquals("2026-05-02T10:00:00.000Z", location.getJSONObject("coordinate").getString("capturedAt"))
        assertEquals(40.987, entity.latitude ?: 0.0, 0.0)
        assertEquals(29.025, entity.longitude ?: 0.0, 0.0)
        assertEquals("DEVICE_GPS", entity.coordinateSource)
        assertEquals("2026-05-02T10:00:00.000Z", entity.coordinateCapturedAt)
    }

    @Test
    fun remoteMappingPreservesLifecycleAndOperationalMetadata() {
        val entity = JSONObject().apply {
            put("id", "req_remote_1")
            put("helpTypes", JSONArray(listOf("food_water")))
            put("otherHelpText", "")
            put("affectedPeopleCount", 4)
            put("riskFlags", JSONArray(listOf("fire")))
            put("vulnerableGroups", JSONArray(listOf("elderly")))
            put("description", "Need support")
            put("bloodType", "A+")
            put("status", "RESOLVED")
            put("urgencyLevel", "MEDIUM")
            put("priorityLevel", "MEDIUM")
            put("createdAt", "2026-04-26T10:00:00.000Z")
            put("resolvedAt", "2026-04-26T11:30:00.000Z")
            put(
                "location",
                JSONObject().put("country", "Turkey").put("city", "Istanbul").put("district", "Kadikoy")
            )
            put(
                "contact",
                JSONObject().put("fullName", "Ayse Yilmaz").put("phone", "5551234567")
            )
        }.toHelpRequestEntity(
            ownerType = LocalOwnerType.AUTHENTICATED,
            existing = null,
            guestAccessToken = null,
            now = 1234L
        )

        assertEquals("MEDIUM", entity.urgencyLevel)
        assertEquals("MEDIUM", entity.priorityLevel)
        assertEquals("2026-04-26T11:30:00.000Z", entity.resolvedAt)
        assertNull(entity.cancelledAt)
        assertEquals("2026-04-26T10:00:00.000Z", entity.serverCreatedAt)
    }

    private fun sampleSubmission(): RequestHelpSubmission {
        return RequestHelpSubmission(
            helpTypes = listOf("food_water", "first_aid"),
            otherHelpText = "",
            affectedPeopleCount = 3,
            description = "Need water and medication",
            riskFlags = listOf("Flooding"),
            vulnerableGroups = listOf("Elderly"),
            bloodType = "A+",
            location = RequestHelpLocationSubmission(
                country = "Turkey",
                city = "Istanbul",
                district = "Kadikoy",
                neighborhood = "Moda",
                extraAddress = "Near park"
            ),
            contact = RequestHelpContactSubmission(
                fullName = "Ayse Yilmaz",
                phone = 5551234567L,
                alternativePhone = null
            ),
            consentGiven = true
        )
    }
}
