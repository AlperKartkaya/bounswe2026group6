package com.neph.features.assignedrequest.data

import com.neph.core.network.ApiException
import com.neph.core.network.JsonHttpClient

data class AssignedRequestUiModel(
    val assignmentId: String,
    val requestId: String,
    val helpType: String,
    val description: String,
    val shortDescription: String,
    val locationLabel: String,
    val status: String,
    val requesterName: String?,
    val requesterEmail: String?,
    val assignedAt: String?
)

object AssignedRequestRepository {
    suspend fun fetchAssignedRequests(token: String): List<AssignedRequestUiModel> {
        try {
            val response = JsonHttpClient.request(
                path = "/availability/my-assignment",
                token = token
            )

            val assignment = response.optJSONObject("assignment") ?: return emptyList()
            return listOf(mapAssignment(assignment))
        } catch (error: ApiException) {
            if (error.status == 404) {
                return emptyList()
            }
            throw error
        }
    }

    private fun mapAssignment(assignment: org.json.JSONObject): AssignedRequestUiModel {
        val description = assignment.optString("description").trim()
        val firstName = assignment.optString("requester_first_name").trim()
        val lastName = assignment.optString("requester_last_name").trim()
        val requesterName = listOf(firstName, lastName)
            .filter { it.isNotBlank() }
            .joinToString(" ")
            .takeIf { it.isNotBlank() }

        val latitude = assignment.optDouble("latitude", Double.NaN)
        val longitude = assignment.optDouble("longitude", Double.NaN)

        return AssignedRequestUiModel(
            assignmentId = assignment.optString("assignment_id"),
            requestId = assignment.optString("request_id"),
            helpType = assignment.optString("need_type").ifBlank { "General Support" },
            description = description,
            shortDescription = buildShortDescription(description),
            locationLabel = if (!latitude.isNaN() && !longitude.isNaN()) {
                "Lat ${"%.4f".format(latitude)}, Lon ${"%.4f".format(longitude)}"
            } else {
                "Location unavailable"
            },
            status = assignment.optString("request_status").ifBlank { "ASSIGNED" },
            requesterName = requesterName,
            requesterEmail = assignment.optString("requester_email").takeIf { it.isNotBlank() },
            assignedAt = assignment.optString("assigned_at").takeIf { it.isNotBlank() }?.let(::formatTimestamp)
        )
    }

    private fun buildShortDescription(description: String): String {
        val normalized = description.replace('\n', ' ').replace(Regex("\\s+"), " ").trim()
        if (normalized.isBlank()) return "No description provided."
        return if (normalized.length > 160) {
            normalized.take(157).trimEnd() + "..."
        } else {
            normalized
        }
    }

    private fun formatTimestamp(raw: String): String {
        return raw
            .replace('T', ' ')
            .substringBefore('.')
            .substringBefore('Z')
    }
}
