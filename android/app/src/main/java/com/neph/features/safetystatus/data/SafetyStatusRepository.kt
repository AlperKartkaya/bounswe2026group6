package com.neph.features.safetystatus.data

import com.neph.core.network.JsonHttpClient
import com.neph.features.profile.data.CurrentDeviceLocation
import org.json.JSONObject

object SafetyStatusRepository {
    suspend fun markSafe(
        token: String,
        note: String? = null,
        location: CurrentDeviceLocation? = null
    ) {
        val body = JSONObject()
            .put("status", "safe")
            .put("shareLocationConsent", location != null)

        if (!note.isNullOrBlank()) {
            body.put("note", note.trim())
        }

        if (location != null) {
            body.put(
                "location",
                JSONObject()
                    .put("latitude", location.latitude)
                    .put("longitude", location.longitude)
                    .put("accuracyMeters", location.accuracyMeters)
                    .put("source", location.source)
                    .put("capturedAt", location.capturedAt)
            )
        } else {
            body.put("location", JSONObject.NULL)
        }

        JsonHttpClient.request(
            path = "/safety-status/me",
            method = "PATCH",
            token = token,
            body = body
        )
    }
}
