package com.neph.features.myhelprequests.presentation

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
import com.neph.features.auth.data.AuthRepository
import com.neph.features.auth.data.AuthSessionStore
import com.neph.features.myhelprequests.data.MyHelpRequestUiModel
import com.neph.features.myhelprequests.data.MyHelpRequestsRepository
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
fun MyHelpRequestsScreen(
    onNavigateToRoute: (String) -> Unit,
    onOpenSettings: (() -> Unit)?,
    isAuthenticated: Boolean
) {
    val spacing = LocalNephSpacing.current
    val token = AuthSessionStore.getAccessToken().orEmpty()

    var loading by remember { mutableStateOf(isAuthenticated) }
    var error by remember { mutableStateOf("") }
    var requests by remember { mutableStateOf<List<MyHelpRequestUiModel>>(emptyList()) }
    var refreshVersion by remember { mutableStateOf(0) }

    AppDrawerScaffold(
        title = "My Help Requests",
        currentRoute = Routes.MyHelpRequests.route,
        onNavigateToRoute = onNavigateToRoute,
        drawerItems = if (isAuthenticated) {
            Routes.authenticatedDrawerItems
        } else {
            Routes.guestDrawerItems
        },
        onOpenSettings = onOpenSettings
    ) {
        LaunchedEffect(isAuthenticated, token, refreshVersion) {
            if (!isAuthenticated || token.isBlank()) {
                loading = false
                error = ""
                requests = emptyList()
                return@LaunchedEffect
            }

            loading = true
            error = ""

            try {
                requests = MyHelpRequestsRepository.fetchMyHelpRequests(token)
            } catch (cancellationException: CancellationException) {
                throw cancellationException
            } catch (errorResponse: ApiException) {
                if (errorResponse.status == 401) {
                    AuthRepository.logout()
                    requests = emptyList()
                    error = "Your session expired. Please log in again to view your help requests."
                } else {
                    error = errorResponse.message.ifBlank { "Could not load your help requests." }
                }
            } catch (_: Exception) {
                error = "Something went wrong while loading your help requests."
            } finally {
                loading = false
            }
        }

        when {
            !isAuthenticated -> {
                Column(verticalArrangement = Arrangement.spacedBy(spacing.lg)) {
                    SectionCard {
                        SectionHeader(
                            title = "My Help Requests",
                            subtitle = "This page shows the requests created from your account."
                        )

                        Text(
                            text = "Login to view your help requests.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            loading -> {
                HelperText(text = "Loading your help requests...")
            }

            error.isNotBlank() -> {
                Column(verticalArrangement = Arrangement.spacedBy(spacing.lg)) {
                    SectionCard {
                        SectionHeader(
                            title = "My Help Requests",
                            subtitle = "We could not load your request history."
                        )

                        HelperText(text = error)

                        SecondaryButton(
                            text = "Retry",
                            onClick = { refreshVersion += 1 }
                        )
                    }
                }
            }

            requests.isEmpty() -> {
                Column(verticalArrangement = Arrangement.spacedBy(spacing.lg)) {
                    SectionCard {
                        SectionHeader(
                            title = "My Help Requests",
                            subtitle = "This page shows the requests created from your account."
                        )

                        Text(
                            text = "You have not created any requests yet.",
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
                    items(requests, key = { it.id }) { request ->
                        MyHelpRequestCard(request = request)
                    }
                }
            }
        }
    }
}

@Composable
private fun MyHelpRequestCard(request: MyHelpRequestUiModel) {
    val spacing = LocalNephSpacing.current

    SectionCard {
        Column(verticalArrangement = Arrangement.spacedBy(spacing.sm)) {
            SectionHeader(
                title = request.helpType,
                subtitle = request.createdAt ?: "Created time unavailable"
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
        }
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun MyHelpRequestsScreenPreview() {
    NephTheme {
        MyHelpRequestsScreen(
            onNavigateToRoute = {},
            onOpenSettings = {},
            isAuthenticated = true
        )
    }
}
