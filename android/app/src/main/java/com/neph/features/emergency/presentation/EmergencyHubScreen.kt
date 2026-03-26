package com.neph.features.emergency.presentation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.neph.data.remote.ApiClient
import com.neph.data.remote.AvailabilitySnapshot
import com.neph.data.remote.ApiException
import com.neph.data.remote.HelpRequestItem
import com.neph.data.session.SessionStore
import com.neph.ui.components.buttons.PrimaryButton
import com.neph.ui.components.buttons.SecondaryButton
import com.neph.ui.components.buttons.TextActionButton
import com.neph.ui.components.display.HelperText
import com.neph.ui.components.display.SectionCard
import com.neph.ui.components.display.SectionHeader
import com.neph.ui.components.inputs.AppDropdown
import com.neph.ui.components.inputs.AppTextArea
import com.neph.ui.components.inputs.AppTextField
import com.neph.ui.components.inputs.DropdownOption
import com.neph.ui.components.selection.AppToggleSwitch
import com.neph.ui.layout.AppScaffold
import com.neph.ui.theme.LocalNephSpacing
import kotlinx.coroutines.launch

private val needTypeOptions = listOf(
    DropdownOption(label = "General", value = "general"),
    DropdownOption(label = "Medical", value = "medical"),
    DropdownOption(label = "Supplies", value = "supplies"),
    DropdownOption(label = "Transport", value = "transport"),
    DropdownOption(label = "Shelter", value = "shelter"),
)

@Composable
fun EmergencyHubScreen(
    sessionStore: SessionStore,
    apiClient: ApiClient,
    onNavigateToLogin: () -> Unit,
    onNavigateToEmergencyNumbers: () -> Unit,
    onLogout: () -> Unit,
) {
    val spacing = LocalNephSpacing.current
    val scope = rememberCoroutineScope()
    val accessToken = sessionStore.getAccessToken()
    val userEmail = sessionStore.getUserEmail().orEmpty()
    val isAuthenticated = !accessToken.isNullOrBlank()

    var selectedNeedType by remember { mutableStateOf("medical") }
    var description by remember { mutableStateOf("") }
    var latitudeText by remember { mutableStateOf("") }
    var longitudeText by remember { mutableStateOf("") }
    var storeOffline by remember { mutableStateOf(false) }
    var requestFormOpen by remember { mutableStateOf(false) }
    var requests by remember { mutableStateOf<List<HelpRequestItem>>(emptyList()) }
    var availabilitySnapshot by remember { mutableStateOf<AvailabilitySnapshot?>(null) }
    var statusMessage by remember { mutableStateOf("Loading your requests...") }
    var availabilityMessage by remember { mutableStateOf("Loading your availability...") }
    var formError by remember { mutableStateOf<String?>(null) }
    var availabilityError by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var isSubmitting by remember { mutableStateOf(false) }
    var volunteerNeedType by remember { mutableStateOf("medical") }
    var volunteerLatitudeText by remember { mutableStateOf("") }
    var volunteerLongitudeText by remember { mutableStateOf("") }
    var volunteerStoreOffline by remember { mutableStateOf(false) }
    var volunteerAvailable by remember { mutableStateOf(false) }
    var isUpdatingAvailability by remember { mutableStateOf(false) }

    suspend fun refreshRequests() {
        if (!isAuthenticated) {
            requests = emptyList()
            statusMessage = "Sign in to view your requests and updates."
            isLoading = false
            return
        }

        try {
            requests = apiClient.getMyHelpRequests(accessToken)
            statusMessage = if (requests.isEmpty()) {
                "You do not have any requests yet."
            } else {
                "Your latest request updates are shown below."
            }
        } catch (error: Exception) {
            statusMessage = when (error) {
                is ApiException -> error.message
                else -> "We could not load your requests right now."
            }
        } finally {
            isLoading = false
        }
    }

    fun applyAvailability(snapshot: AvailabilitySnapshot) {
        availabilitySnapshot = snapshot
        volunteerAvailable = snapshot.availability.isAvailable
        volunteerStoreOffline = snapshot.availability.storedLocally
        volunteerLatitudeText = snapshot.availability.lastKnownLatitude?.toString().orEmpty()
        volunteerLongitudeText = snapshot.availability.lastKnownLongitude?.toString().orEmpty()
        volunteerNeedType = snapshot.availability.needTypes.firstOrNull() ?: volunteerNeedType
        availabilityMessage = snapshot.message
            ?: if (snapshot.assignment != null) {
                "Assigned to ${snapshot.assignment.request.needType} request."
            } else {
                if (snapshot.availability.isAvailable) {
                    "You are available to help."
                } else {
                    "You are not currently available to help."
                }
            }
    }

    suspend fun refreshAvailability() {
        if (!isAuthenticated) {
            availabilitySnapshot = null
            availabilityMessage = "Sign in to offer help and receive requests."
            return
        }

        try {
            val snapshot = apiClient.getMyAvailability(accessToken)
            applyAvailability(snapshot)
        } catch (error: Exception) {
            availabilityMessage = when (error) {
                is ApiException -> error.message
                else -> "We could not load your availability right now."
            }
        }
    }

    LaunchedEffect(accessToken) {
        refreshRequests()
        refreshAvailability()
    }

    AppScaffold(
        title = "Emergency support",
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = spacing.xl, vertical = spacing.md),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(
                    text = if (isAuthenticated) userEmail else "Emergency access",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )

                TextActionButton(
                    text = if (isAuthenticated) "Sign out" else "Sign in",
                    onClick = {
                        if (isAuthenticated) {
                            onLogout()
                        } else {
                            onNavigateToLogin()
                        }
                    },
                )
            }
        },
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(spacing.lg)) {
            SectionCard {
                Column(verticalArrangement = Arrangement.spacedBy(spacing.md)) {
                    SectionHeader(
                        title = "Request help",
                        subtitle = if (isAuthenticated) {
                            if (requestFormOpen) {
                                "Share what you need so people nearby can respond quickly."
                            } else {
                                "Tap the large button below to start a request right away."
                            }
                        } else {
                            "Tap the large button below to begin. You will be asked to sign in before sending your request."
                        },
                    )

                    if (!requestFormOpen) {
                        Button(
                            onClick = {
                                requestFormOpen = true
                                formError = null
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(min = 260.dp),
                            shape = MaterialTheme.shapes.large,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary,
                                contentColor = MaterialTheme.colorScheme.onPrimary,
                            ),
                        ) {
                            Column(
                                verticalArrangement = Arrangement.spacedBy(spacing.md),
                                horizontalAlignment = Alignment.CenterHorizontally,
                            ) {
                                Text(
                                    text = "Request help",
                                    style = MaterialTheme.typography.headlineMedium,
                                    color = MaterialTheme.colorScheme.onPrimary,
                                )
                                Text(
                                    text = if (isAuthenticated) {
                                        "Start a help request now"
                                    } else {
                                        "Tap here to begin"
                                    },
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = MaterialTheme.colorScheme.onPrimary,
                                )
                            }
                        }
                    } else {
                        AppDropdown(
                            value = selectedNeedType,
                            onValueChange = { selectedNeedType = it },
                            label = "Type of help needed",
                            options = needTypeOptions,
                        )

                        AppTextArea(
                            value = description,
                            onValueChange = { description = it },
                            label = "Description",
                            placeholder = "Describe the help you need",
                        )

                        Row(horizontalArrangement = Arrangement.spacedBy(spacing.md)) {
                            AppTextField(
                                value = latitudeText,
                                onValueChange = { latitudeText = it; formError = null },
                                label = "Location latitude",
                                placeholder = "41.0151",
                                modifier = Modifier.weight(1f),
                            )

                            AppTextField(
                                value = longitudeText,
                                onValueChange = { longitudeText = it; formError = null },
                                label = "Location longitude",
                                placeholder = "28.9795",
                                modifier = Modifier.weight(1f),
                            )
                        }

                        AppToggleSwitch(
                            checked = storeOffline,
                            onCheckedChange = { storeOffline = it },
                            label = "Save and send when online",
                            description = "Turn this on to save your request now and send it when your connection returns.",
                        )

                        if (!formError.isNullOrBlank()) {
                            HelperText(text = formError!!)
                        }

                        PrimaryButton(
                            text = if (isAuthenticated) {
                                if (isSubmitting) "Creating request..." else "Create help request"
                            } else {
                                "Sign in to send request"
                            },
                            loading = isSubmitting,
                            onClick = {
                                val latitude = latitudeText.trim().takeIf { it.isNotEmpty() }?.toDoubleOrNull()
                                val longitude = longitudeText.trim().takeIf { it.isNotEmpty() }?.toDoubleOrNull()

                                if ((latitude == null) != (longitude == null)) {
                                    formError = "Enter both latitude and longitude together."
                                    return@PrimaryButton
                            }

                                scope.launch {
                                    isSubmitting = true
                                    formError = null

                                    val token = accessToken
                                    if (token == null) {
                                        formError = "Sign in to send your request and track updates."
                                        isSubmitting = false
                                        onNavigateToLogin()
                                        return@launch
                                    }

                                try {
                                    val result = apiClient.createHelpRequest(
                                            accessToken = token,
                                            needType = selectedNeedType,
                                            description = description.trim(),
                                            latitude = latitude,
                                            longitude = longitude,
                                            isSavedLocally = storeOffline,
                                        )

                                        description = ""
                                        latitudeText = ""
                                        longitudeText = ""
                                        storeOffline = false

                                        val warningSummary = if (result.warnings.isEmpty()) {
                                            ""
                                        } else {
                                            " ${result.warnings.joinToString(" ")}"
                                        }

                                        statusMessage = "Your request was created. Status: ${result.request.status}.$warningSummary"
                                        refreshRequests()
                                    } catch (error: Exception) {
                                        formError = when (error) {
                                            is ApiException -> error.message
                                            else -> "We could not send your request right now."
                                        }
                                    } finally {
                                        isSubmitting = false
                                    }
                                }
                            },
                        )
                    }

                    if (!formError.isNullOrBlank() && !requestFormOpen) {
                        HelperText(text = formError!!)
                    }
                }
            }

            if (isAuthenticated) {
                SectionCard {
                    Column(verticalArrangement = Arrangement.spacedBy(spacing.md)) {
                        SectionHeader(
                            title = "Volunteer availability",
                            subtitle = availabilityMessage,
                        )

                        AppToggleSwitch(
                            checked = volunteerAvailable,
                            onCheckedChange = {
                                volunteerAvailable = it
                                availabilityError = null
                            },
                            label = "I can help right now",
                            description = "Turn this on when you are ready to receive a request you can help with.",
                        )

                        AppDropdown(
                            value = volunteerNeedType,
                            onValueChange = { volunteerNeedType = it },
                            label = "Type of help you can provide",
                            options = needTypeOptions,
                        )

                        Row(horizontalArrangement = Arrangement.spacedBy(spacing.md)) {
                            AppTextField(
                                value = volunteerLatitudeText,
                                onValueChange = {
                                    volunteerLatitudeText = it
                                    availabilityError = null
                                },
                                label = "Your latitude",
                                placeholder = "41.0152",
                                modifier = Modifier.weight(1f),
                            )

                            AppTextField(
                                value = volunteerLongitudeText,
                                onValueChange = {
                                    volunteerLongitudeText = it
                                    availabilityError = null
                                },
                                label = "Your longitude",
                                placeholder = "28.9796",
                                modifier = Modifier.weight(1f),
                            )
                        }

                        AppToggleSwitch(
                            checked = volunteerStoreOffline,
                            onCheckedChange = { volunteerStoreOffline = it },
                            label = "Save and send when online",
                            description = "Turn this on to save your availability now and send it when your connection returns.",
                        )

                        if (!availabilityError.isNullOrBlank()) {
                            HelperText(text = availabilityError!!)
                        }

                        Column(verticalArrangement = Arrangement.spacedBy(spacing.sm)) {
                            PrimaryButton(
                                text = if (isUpdatingAvailability) "Saving..." else "Save availability",
                                loading = isUpdatingAvailability,
                                onClick = {
                                    val latitude = volunteerLatitudeText.trim().takeIf { it.isNotEmpty() }?.toDoubleOrNull()
                                    val longitude = volunteerLongitudeText.trim().takeIf { it.isNotEmpty() }?.toDoubleOrNull()

                                    if ((latitude == null) != (longitude == null)) {
                                        availabilityError = "Enter both latitude and longitude together."
                                        return@PrimaryButton
                                    }

                                    scope.launch {
                                        isUpdatingAvailability = true
                                        availabilityError = null

                                        try {
                                            val snapshot = apiClient.updateAvailability(
                                                accessToken = accessToken,
                                                isAvailable = volunteerAvailable,
                                                needType = volunteerNeedType,
                                                latitude = latitude,
                                                longitude = longitude,
                                                storedLocally = volunteerStoreOffline,
                                            )
                                            applyAvailability(snapshot)
                                            refreshRequests()
                                        } catch (error: Exception) {
                                            availabilityError = when (error) {
                                                is ApiException -> error.message
                                                else -> "We could not update your availability right now."
                                            }
                                        } finally {
                                            isUpdatingAvailability = false
                                        }
                                    }
                                },
                            )

                            SecondaryButton(
                                text = "Refresh",
                                enabled = !isUpdatingAvailability,
                                onClick = {
                                    scope.launch {
                                        isUpdatingAvailability = true
                                        refreshAvailability()
                                        isUpdatingAvailability = false
                                    }
                                },
                            )
                        }

                        availabilitySnapshot?.assignment?.let { assignment ->
                            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                            Column(verticalArrangement = Arrangement.spacedBy(spacing.sm)) {
                                Text(
                                    text = "Assigned request",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = MaterialTheme.colorScheme.onSurface,
                                )
                                HelperText(text = "Assigned on ${assignment.assignedAt}")
                                Text(
                                    text = assignment.request.needType.replaceFirstChar { it.uppercase() },
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = MaterialTheme.colorScheme.onSurface,
                                )
                                if (!assignment.request.description.isNullOrBlank()) {
                                    Text(
                                        text = assignment.request.description,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                                assignment.request.location?.let { location ->
                                    HelperText(text = "Location: ${location.latitude}, ${location.longitude}")
                                }

                                Column(verticalArrangement = Arrangement.spacedBy(spacing.sm)) {
                                    SecondaryButton(
                                        text = "Cancel request",
                                        enabled = !isUpdatingAvailability,
                                        onClick = {
                                            scope.launch {
                                                isUpdatingAvailability = true
                                                try {
                                                    val snapshot = apiClient.cancelAssignment(
                                                        accessToken = accessToken,
                                                        assignmentId = assignment.assignmentId,
                                                    )
                                                    applyAvailability(snapshot)
                                                    refreshRequests()
                                                } catch (error: Exception) {
                                                    availabilityError = when (error) {
                                                        is ApiException -> error.message
                                                        else -> "We could not cancel this request right now."
                                                    }
                                                } finally {
                                                    isUpdatingAvailability = false
                                                }
                                            }
                                        },
                                    )

                                    PrimaryButton(
                                        text = if (isUpdatingAvailability) "Saving..." else "Mark as resolved",
                                        enabled = !isUpdatingAvailability,
                                        onClick = {
                                            scope.launch {
                                                isUpdatingAvailability = true
                                                try {
                                                    val snapshot = apiClient.resolveAssignment(
                                                        accessToken = accessToken,
                                                        assignmentId = assignment.assignmentId,
                                                    )
                                                    applyAvailability(snapshot)
                                                    refreshRequests()
                                                } catch (error: Exception) {
                                                    availabilityError = when (error) {
                                                        is ApiException -> error.message
                                                        else -> "We could not mark this request as resolved right now."
                                                    }
                                                } finally {
                                                    isUpdatingAvailability = false
                                                }
                                            }
                                        },
                                    )
                                }
                            }
                        }
                    }
                }

                SectionCard {
                    Column(verticalArrangement = Arrangement.spacedBy(spacing.md)) {
                        SectionHeader(
                            title = "My requests",
                            subtitle = statusMessage,
                        )

                        SecondaryButton(
                            text = if (isLoading) "Refreshing..." else "Refresh",
                            enabled = !isLoading,
                            onClick = {
                                scope.launch {
                                    isLoading = true
                                    refreshRequests()
                                }
                            },
                        )

                        requests.forEachIndexed { index, request ->
                            if (index > 0) {
                                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                            }

                            Column(verticalArrangement = Arrangement.spacedBy(spacing.xs)) {
                                Text(
                                    text = request.needType.replaceFirstChar { it.uppercase() },
                                    style = MaterialTheme.typography.titleMedium,
                                    color = MaterialTheme.colorScheme.onSurface,
                                )
                                HelperText(text = "Status: ${request.status} • Created: ${request.createdAt}")

                                if (!request.description.isNullOrBlank()) {
                                    Text(
                                        text = request.description,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }

                                request.location?.let { location ->
                                    HelperText(
                                        text = "Location: ${location.latitude}, ${location.longitude}",
                                    )
                                }

                                Column(verticalArrangement = Arrangement.spacedBy(spacing.sm)) {
                                    if (request.status == "PENDING_SYNC") {
                                        SecondaryButton(
                                            text = "Send now",
                                            onClick = {
                                                scope.launch {
                                                    isLoading = true
                                                    try {
                                                        apiClient.updateHelpRequestStatus(accessToken, request.id, "SYNCED")
                                                        refreshRequests()
                                                    } catch (error: Exception) {
                                                        statusMessage = when (error) {
                                                            is ApiException -> error.message
                                                            else -> "We could not send the request right now."
                                                        }
                                                        isLoading = false
                                                    }
                                                }
                                            },
                                        )
                                    }

                                    if (request.status != "RESOLVED") {
                                        TextActionButton(
                                            text = "Mark as resolved",
                                            onClick = {
                                                scope.launch {
                                                    isLoading = true
                                                    try {
                                                        apiClient.updateHelpRequestStatus(accessToken, request.id, "RESOLVED")
                                                        refreshRequests()
                                                    } catch (error: Exception) {
                                                        statusMessage = when (error) {
                                                            is ApiException -> error.message
                                                            else -> "We could not update the request right now."
                                                        }
                                                        isLoading = false
                                                    }
                                                }
                                            },
                                        )
                                    }
                                }
                            }
                        }

                        if (requests.isEmpty() && !isLoading) {
                            HelperText(text = "No requests yet.")
                        }
                    }
                }
            } else {
                SectionCard {
                    Column(verticalArrangement = Arrangement.spacedBy(spacing.md)) {
                        SectionHeader(
                            title = "Stay ready",
                            subtitle = "Sign in to send requests, follow updates, and offer help to others.",
                        )

                        PrimaryButton(
                            text = "Sign in to continue",
                            onClick = onNavigateToLogin,
                        )
                    }
                }
            }

            SectionCard {
                Column(verticalArrangement = Arrangement.spacedBy(spacing.md)) {
                    SectionHeader(
                        title = "Emergency numbers",
                        subtitle = "See emergency contact numbers quickly when you need them.",
                    )

                    SecondaryButton(
                        text = "View emergency numbers",
                        onClick = onNavigateToEmergencyNumbers,
                    )
                }
            }
        }
    }
}
