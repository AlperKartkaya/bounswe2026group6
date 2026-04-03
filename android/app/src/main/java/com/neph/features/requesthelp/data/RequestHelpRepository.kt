package com.neph.features.requesthelp.data

import com.neph.core.network.JsonHttpClient
import org.json.JSONObject

data class RequestHelpSubmission(
    val needType: String,
    val description: String,
    val isSavedLocally: Boolean = false
)

object RequestHelpRepository {
    suspend fun hasActiveHelpRequest(token: String): Boolean {
        val response = JsonHttpClient.request(
            path = "/help-requests",
            token = token
        )

        val requests = response.optJSONArray("requests") ?: return false
        for (index in 0 until requests.length()) {
            val request = requests.optJSONObject(index) ?: continue
            val status = request.optString("status").trim().uppercase()
            if (status != "RESOLVED" && status != "CANCELLED") {
                return true
            }
        }

        return false
    }

    suspend fun createHelpRequest(
        token: String,
        submission: RequestHelpSubmission
    ): String {
        val response = JsonHttpClient.request(
            path = "/help-requests",
            method = "POST",
            token = token,
            body = JSONObject().apply {
                put("needType", submission.needType)
                put("description", submission.description)
                put("isSavedLocally", submission.isSavedLocally)
            }
        )

        return response.optJSONObject("request")?.optString("id")
            ?.takeIf { it.isNotBlank() }
            ?: ""
    }
}
