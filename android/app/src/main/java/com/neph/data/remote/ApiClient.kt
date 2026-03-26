package com.neph.data.remote

import android.os.Build
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

data class AuthUser(
    val userId: String,
    val email: String,
    val isEmailVerified: Boolean,
)

data class LoginResult(
    val message: String,
    val accessToken: String,
    val user: AuthUser,
)

data class HelpRequestLocation(
    val latitude: Double,
    val longitude: Double,
    val isGpsLocation: Boolean,
    val isLastKnown: Boolean,
)

data class HelpRequestItem(
    val id: String,
    val needType: String,
    val description: String?,
    val status: String,
    val createdAt: String,
    val resolvedAt: String?,
    val isSavedLocally: Boolean,
    val location: HelpRequestLocation?,
)

data class CreateHelpRequestResult(
    val request: HelpRequestItem,
    val warnings: List<String>,
)

data class AvailabilityState(
    val volunteerId: String?,
    val userId: String?,
    val isAvailable: Boolean,
    val skills: List<String>,
    val needTypes: List<String>,
    val lastKnownLatitude: Double?,
    val lastKnownLongitude: Double?,
    val locationUpdatedAt: String?,
    val syncStatus: String,
    val storedLocally: Boolean,
)

data class AssignmentItem(
    val assignmentId: String,
    val assignedAt: String,
    val isCancelled: Boolean,
    val request: HelpRequestItem,
)

data class AvailabilitySnapshot(
    val message: String?,
    val availability: AvailabilityState,
    val assignment: AssignmentItem?,
)

class ApiException(
    val statusCode: Int,
    val errorCode: String,
    override val message: String,
) : Exception(message)

class ApiClient(
    private val baseUrl: String = defaultBaseUrl(),
) {
    suspend fun login(email: String, password: String): LoginResult {
        val payload = JSONObject()
            .put("email", email)
            .put("password", password)

        val response = request(
            path = "/auth/login",
            method = "POST",
            body = payload,
        )

        return LoginResult(
            message = response.optString("message"),
            accessToken = response.getString("accessToken"),
            user = response.getJSONObject("user").toAuthUser(),
        )
    }

    suspend fun createHelpRequest(
        accessToken: String,
        needType: String,
        description: String,
        latitude: Double?,
        longitude: Double?,
        isSavedLocally: Boolean,
    ): CreateHelpRequestResult {
        val payload = JSONObject().put("isSavedLocally", isSavedLocally)

        if (needType.isNotBlank()) {
            payload.put("needType", needType)
        }

        if (description.isNotBlank()) {
            payload.put("description", description)
        }

        if (latitude != null && longitude != null) {
            payload.put(
                "location",
                JSONObject()
                    .put("latitude", latitude)
                    .put("longitude", longitude)
                    .put("isGpsLocation", false)
                    .put("isLastKnown", true),
            )
        }

        val response = request(
            path = "/help-requests",
            method = "POST",
            accessToken = accessToken,
            body = payload,
        )

        val warnings = buildList {
            val warningArray = response.optJSONArray("warnings") ?: JSONArray()
            for (index in 0 until warningArray.length()) {
                add(warningArray.getString(index))
            }
        }

        return CreateHelpRequestResult(
            request = response.getJSONObject("request").toHelpRequestItem(),
            warnings = warnings,
        )
    }

    suspend fun getMyHelpRequests(accessToken: String): List<HelpRequestItem> {
        val response = request(
            path = "/help-requests",
            method = "GET",
            accessToken = accessToken,
        )

        val requestsArray = response.optJSONArray("requests") ?: JSONArray()
        return List(requestsArray.length()) { index ->
            requestsArray.getJSONObject(index).toHelpRequestItem()
        }
    }

    suspend fun updateHelpRequestStatus(
        accessToken: String,
        requestId: String,
        status: String,
    ): HelpRequestItem {
        val payload = JSONObject().put("status", status)
        val response = request(
            path = "/help-requests/$requestId/status",
            method = "PATCH",
            accessToken = accessToken,
            body = payload,
        )

        return response.getJSONObject("request").toHelpRequestItem()
    }

    suspend fun getMyAvailability(accessToken: String): AvailabilitySnapshot {
        val response = request(
            path = "/availability/me",
            method = "GET",
            accessToken = accessToken,
        )

        return response.toAvailabilitySnapshot()
    }

    suspend fun updateAvailability(
        accessToken: String,
        isAvailable: Boolean,
        needType: String,
        latitude: Double?,
        longitude: Double?,
        storedLocally: Boolean,
    ): AvailabilitySnapshot {
        val payload = JSONObject()
            .put("isAvailable", isAvailable)
            .put("storedLocally", storedLocally)

        if (needType.isNotBlank()) {
            payload.put("needTypes", JSONArray().put(needType))
        }

        if (latitude != null && longitude != null) {
            payload.put("lastKnownLatitude", latitude)
            payload.put("lastKnownLongitude", longitude)
        }

        val response = request(
            path = "/availability/me",
            method = "PATCH",
            accessToken = accessToken,
            body = payload,
        )

        return response.toAvailabilitySnapshot()
    }

    suspend fun cancelAssignment(accessToken: String, assignmentId: String): AvailabilitySnapshot {
        val response = request(
            path = "/availability/assignments/$assignmentId/cancel",
            method = "PATCH",
            accessToken = accessToken,
        )

        return response.toAvailabilitySnapshot()
    }

    suspend fun resolveAssignment(accessToken: String, assignmentId: String): AvailabilitySnapshot {
        val response = request(
            path = "/availability/assignments/$assignmentId/resolve",
            method = "PATCH",
            accessToken = accessToken,
        )

        return response.toAvailabilitySnapshot()
    }

    private suspend fun request(
        path: String,
        method: String,
        accessToken: String? = null,
        body: JSONObject? = null,
    ): JSONObject = withContext(Dispatchers.IO) {
        val connection = (URL(baseUrl + path).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            doInput = true
            setRequestProperty("Accept", "application/json")

            if (body != null) {
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
            }

            if (!accessToken.isNullOrBlank()) {
                setRequestProperty("Authorization", "Bearer $accessToken")
            }
        }

        try {
            if (body != null) {
                connection.outputStream.use { outputStream ->
                    outputStream.write(body.toString().toByteArray())
                }
            }

            val statusCode = connection.responseCode
            val stream = if (statusCode in 200..299) connection.inputStream else connection.errorStream
            val rawBody = stream?.bufferedReader()?.use(BufferedReader::readText).orEmpty()
            val payload = if (rawBody.isBlank()) JSONObject() else JSONObject(rawBody)

            if (statusCode !in 200..299) {
                throw ApiException(
                    statusCode = statusCode,
                    errorCode = payload.optString("code", "UNKNOWN_ERROR"),
                    message = payload.optString("message", "Unexpected server error"),
                )
            }

            payload
        } finally {
            connection.disconnect()
        }
    }

    private fun JSONObject.toAuthUser(): AuthUser {
        return AuthUser(
            userId = getString("userId"),
            email = getString("email"),
            isEmailVerified = getBoolean("isEmailVerified"),
        )
    }

    private fun JSONObject.toHelpRequestItem(): HelpRequestItem {
        val locationPayload = optJSONObject("location")

        return HelpRequestItem(
            id = getString("id"),
            needType = getString("needType"),
            description = optString("description").takeIf { it.isNotBlank() },
            status = getString("status"),
            createdAt = getString("createdAt"),
            resolvedAt = optString("resolvedAt").takeIf { it.isNotBlank() },
            isSavedLocally = getBoolean("isSavedLocally"),
            location = locationPayload?.let {
                HelpRequestLocation(
                    latitude = it.getDouble("latitude"),
                    longitude = it.getDouble("longitude"),
                    isGpsLocation = it.getBoolean("isGpsLocation"),
                    isLastKnown = it.getBoolean("isLastKnown"),
                )
            },
        )
    }

    private fun JSONObject.toAvailabilitySnapshot(): AvailabilitySnapshot {
        val assignmentPayload = optJSONObject("assignment")
        val availabilityPayload = getJSONObject("availability")

        return AvailabilitySnapshot(
            message = optString("message").takeIf { it.isNotBlank() },
            availability = AvailabilityState(
                volunteerId = availabilityPayload.optString("volunteerId").takeIf { it.isNotBlank() },
                userId = availabilityPayload.optString("userId").takeIf { it.isNotBlank() },
                isAvailable = availabilityPayload.getBoolean("isAvailable"),
                skills = availabilityPayload.optJSONArray("skills")?.toStringList().orEmpty(),
                needTypes = availabilityPayload.optJSONArray("needTypes")?.toStringList().orEmpty(),
                lastKnownLatitude = availabilityPayload.optDoubleOrNull("lastKnownLatitude"),
                lastKnownLongitude = availabilityPayload.optDoubleOrNull("lastKnownLongitude"),
                locationUpdatedAt = availabilityPayload.optString("locationUpdatedAt").takeIf { it.isNotBlank() },
                syncStatus = availabilityPayload.optString("syncStatus", "SYNCED"),
                storedLocally = availabilityPayload.optBoolean("storedLocally", false),
            ),
            assignment = assignmentPayload?.let {
                AssignmentItem(
                    assignmentId = it.getString("assignmentId"),
                    assignedAt = it.getString("assignedAt"),
                    isCancelled = it.getBoolean("isCancelled"),
                    request = it.getJSONObject("request").toHelpRequestItem(),
                )
            },
        )
    }

    private fun JSONArray.toStringList(): List<String> {
        return List(length()) { index -> getString(index) }
    }

    private fun JSONObject.optDoubleOrNull(key: String): Double? {
        return if (isNull(key)) null else getDouble(key)
    }

    private companion object {
        fun defaultBaseUrl(): String {
            val isEmulator = Build.FINGERPRINT.contains("generic", ignoreCase = true) ||
                Build.MODEL.contains("Emulator", ignoreCase = true) ||
                Build.PRODUCT.contains("sdk", ignoreCase = true)

            return if (isEmulator) {
                "http://10.0.2.2:3000/api"
            } else {
                "http://127.0.0.1:3000/api"
            }
        }
    }
}
