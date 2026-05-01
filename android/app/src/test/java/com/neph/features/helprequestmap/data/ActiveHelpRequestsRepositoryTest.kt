package com.neph.features.helprequestmap.data

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Test

class ActiveHelpRequestsRepositoryTest {
    @Test
    fun parseActiveHelpRequestsResponse_mapsWaitingUnassignedRequestsAndHidesAssignedOnes() {
        val response = JSONObject()
            .put(
                "requests",
                JSONArray()
                    .put(
                        JSONObject()
                            .put("requestId", "req-first-aid")
                            .put("type", "first_aid")
                            .put("status", "PENDING")
                            .put("urgencyLevel", "HIGH")
                            .put("createdAt", "2026-05-01T10:15:00.000Z")
                            .put("assignmentState", "UNASSIGNED")
                            .put(
                                "location",
                                JSONObject()
                                    .put("latitude", 41.043)
                                    .put("longitude", 29.009)
                                    .put("city", "istanbul")
                                    .put("district", "besiktas")
                            )
                    )
                    .put(
                        JSONObject()
                            .put("requestId", "req-assigned")
                            .put("type", "search_and_rescue")
                            .put("status", "PENDING")
                            .put("urgencyLevel", "HIGH")
                            .put("createdAt", "2026-05-01T10:05:00.000Z")
                            .put("assignmentState", "ASSIGNED")
                            .put(
                                "location",
                                JSONObject()
                                    .put("latitude", 41.079)
                                    .put("longitude", 29.022)
                                    .put("city", "istanbul")
                                    .put("district", "sariyer")
                            )
                    )
                    .put(
                        JSONObject()
                            .put("requestId", "req-resolved")
                            .put("type", "shelter")
                            .put("status", "RESOLVED")
                            .put("urgencyLevel", "MEDIUM")
                            .put("createdAt", "2026-05-01T09:55:00.000Z")
                            .put("assignmentState", "UNASSIGNED")
                            .put(
                                "location",
                                JSONObject()
                                    .put("latitude", 41.0)
                                    .put("longitude", 29.0)
                                    .put("city", "istanbul")
                                    .put("district", "sisli")
                            )
                    )
            )
            .put("total", 3)
            .put("pagination", JSONObject().put("limit", 300).put("offset", 0))

        val parsed = ActiveHelpRequestsRepository.parseActiveHelpRequestsResponse(response)

        assertEquals(1, parsed.requests.size)
        assertEquals(2, parsed.skippedCount)
        assertEquals(3, parsed.total)
        assertEquals(300, parsed.limit)
        assertEquals("req-first-aid", parsed.requests.first().requestId)
        assertEquals(CrisisRequestType.FIRST_AID, parsed.requests.first().type)
        assertEquals("First Aid", parsed.requests.first().typeLabel)
        assertEquals("HIGH", parsed.requests.first().priorityLevel)
    }

    @Test
    fun normalizeRequestType_groupsFoodWaterAndSearchRescueTypes() {
        assertEquals(CrisisRequestType.FOOD_WATER, ActiveHelpRequestsRepository.normalizeRequestType("food"))
        assertEquals(CrisisRequestType.FOOD_WATER, ActiveHelpRequestsRepository.normalizeRequestType("water"))
        assertEquals(CrisisRequestType.FOOD_WATER, ActiveHelpRequestsRepository.normalizeRequestType("food_water"))
        assertEquals(CrisisRequestType.SEARCH_AND_RESCUE, ActiveHelpRequestsRepository.normalizeRequestType("fire_brigade"))
        assertEquals(CrisisRequestType.SEARCH_AND_RESCUE, ActiveHelpRequestsRepository.normalizeRequestType("search_and_rescue"))
        assertEquals(CrisisRequestType.OTHER, ActiveHelpRequestsRepository.normalizeRequestType("unknown"))
    }
}
