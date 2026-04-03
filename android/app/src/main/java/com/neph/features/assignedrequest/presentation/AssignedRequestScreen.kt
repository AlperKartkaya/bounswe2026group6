package com.neph.features.assignedrequest.presentation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import com.neph.core.network.ApiException
import com.neph.features.assignedrequest.data.AssignedRequestRepository
import com.neph.features.assignedrequest.data.AssignedRequestUiModel
import com.neph.features.auth.data.AuthRepository
import com.neph.features.auth.data.AuthSessionStore
import com.neph.navigation.Routes
import com.neph.ui.components.buttons.SecondaryButton
import com.neph.ui.components.display.HelperText
import com.neph.ui.components.display.SectionCard
import com.neph.ui.components.display.SectionHeader
import com.neph.ui.layout.AppDrawerScaffold
import com.neph.ui.theme.LocalNephSpacing
import com.neph.ui.theme.NephTheme
import kotlinx.coroutines.CancellationException

@Composable
fun AssignedRequestScreen(
    onNavigateToRoute: (String) -> Unit,
    onOpenSettings: () -> Unit,
    onNavigateToLogin: () -> Unit
) {
    val spacing = LocalNephSpacing.current
    val token = AuthSessionStore.getAccessToken().orEmpty()

    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    var requests by remember { mutableStateOf<List<AssignedRequestUiModel>>(emptyList()) }
    var refreshVersion by remember { mutableStateOf(0) }

    fun loadAssignedRequests() {
        loading = true
        error = ""
    }

    LaunchedEffect(token, refreshVersion) {
        if (token.isBlank()) {
            loading = false
            onNavigateToLogin()
            return@LaunchedEffect
        }

        loadAssignedRequests()

        try {
            requests = AssignedRequestRepository.fetchAssignedRequests(token)
        } catch (cancellationException: CancellationException) {
            throw cancellationException
        } catch (errorResponse: ApiException) {
            when (errorResponse.status) {
                401 -> {
                    AuthRepository.logout()
                    onNavigateToLogin()
                    return@LaunchedEffect
                }
                else -> {
                    error = errorResponse.message.ifBlank {
                        "Could not load your assigned requests."
                    }
                }
            }
        } catch (_: Exception) {
            error = "Something went wrong while loading your assigned requests."
        } finally {
            loading = false
        }
    }

    AppDrawerScaffold(
        title = "Assigned Request",
        currentRoute = Routes.AssignedRequest.route,
        onNavigateToRoute = onNavigateToRoute,
        onOpenSettings = onOpenSettings
    ) {
        when {
            loading -> {
                HelperText(text = "Loading your assigned requests...")
            }

            error.isNotBlank() -> {
                Column(verticalArrangement = Arrangement.spacedBy(spacing.lg)) {
                    SectionCard {
                        SectionHeader(
                            title = "Assigned Request",
                            subtitle = "We could not load your current assignment."
                        )

                        HelperText(text = error)

                        SecondaryButton(
                            text = "Retry",
                            onClick = {
                                refreshVersion += 1
                            }
                        )
                    }
                }
            }

            requests.isEmpty() -> {
                Column(verticalArrangement = Arrangement.spacedBy(spacing.lg)) {
                    SectionCard {
                        SectionHeader(
                            title = "Assigned Request",
                            subtitle = "This page shows requests currently assigned to you."
                        )

                        Text(
                            text = "No assigned requests yet.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(spacing.lg)
                ) {
                    items(requests, key = { it.assignmentId }) { request ->
                        AssignedRequestCard(request = request)
                    }
                }
            }
        }
    }
}

@Composable
private fun AssignedRequestCard(request: AssignedRequestUiModel) {
    val spacing = LocalNephSpacing.current

    SectionCard {
        Column(verticalArrangement = Arrangement.spacedBy(spacing.sm)) {
            SectionHeader(
                title = request.helpType,
                subtitle = request.requesterName
                    ?: request.requesterEmail
                    ?: "Requester details unavailable"
            )

            Text(
                text = request.shortDescription,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Text(
                text = "Location: ${request.locationLabel}",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurface
            )

            Text(
                text = "Status: ${request.status}",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary
            )

            request.assignedAt?.let {
                Text(
                    text = "Assigned: $it",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun AssignedRequestScreenPreview() {
    NephTheme {
        AssignedRequestScreen(
            onNavigateToRoute = {},
            onOpenSettings = {},
            onNavigateToLogin = {}
        )
    }
}
