package com.neph.features.myhelprequests.data

import com.neph.core.network.JsonHttpClient

data class MyHelpRequestUiModel(
    val id: String,
    val helpType: String,
    val description: String,
    val shortDescription: String,
    val locationLabel: String,
    val status: String,
    val createdAt: String?
)

object MyHelpRequestsRepository {
    suspend fun fetchMyHelpRequests(token: String): List<MyHelpRequestUiModel> {
        val response = JsonHttpClient.request(
            path = "/help-requests",
            token = token
        )

        val requests = response.optJSONArray("requests") ?: return emptyList()
        return buildList {
            for (index in 0 until requests.length()) {
                val request = requests.optJSONObject(index) ?: continue
                add(mapRequest(request))
            }
        }
    }

    private fun mapRequest(request: org.json.JSONObject): MyHelpRequestUiModel {
        val description = request.optString("description").trim()
        val location = request.optJSONObject("location")
        val latitude = location?.optDouble("latitude", Double.NaN) ?: Double.NaN
        val longitude = location?.optDouble("longitude", Double.NaN) ?: Double.NaN

        return MyHelpRequestUiModel(
            id = request.optString("id"),
            helpType = request.optString("needType").ifBlank { "General Support" },
            description = description,
            shortDescription = buildShortDescription(description),
            locationLabel = if (!latitude.isNaN() && !longitude.isNaN()) {
                "Lat ${"%.4f".format(latitude)}, Lon ${"%.4f".format(longitude)}"
            } else {
                "Location unavailable"
            },
            status = request.optString("status").ifBlank { "Unknown" },
            createdAt = request.optString("createdAt").takeIf { it.isNotBlank() }?.let(::formatTimestamp)
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
