package com.neph.features.auth.presentation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import com.neph.data.remote.ApiClient
import com.neph.data.remote.ApiException
import com.neph.data.session.SessionStore
import com.neph.ui.components.buttons.PrimaryButton
import com.neph.ui.components.buttons.TextActionButton
import com.neph.ui.components.display.HelperText
import com.neph.ui.components.inputs.AppTextField
import com.neph.ui.components.inputs.PasswordField
import com.neph.ui.layout.AuthScaffold
import com.neph.ui.theme.LocalNephSpacing
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(
    sessionStore: SessionStore,
    apiClient: ApiClient,
    onLoginSuccess: () -> Unit,
    onNavigateToEmergencyNumbers: () -> Unit,
) {
    val spacing = LocalNephSpacing.current
    val scope = rememberCoroutineScope()

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isSubmitting by remember { mutableStateOf(false) }

    AuthScaffold(
        title = "Sign in",
        subtitle = "Sign in to request help, offer support, and stay connected during an emergency.",
        footerContent = {
            TextActionButton(
                text = "View emergency numbers",
                onClick = onNavigateToEmergencyNumbers,
            )
        },
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(spacing.md)) {
            AppTextField(
                value = email,
                onValueChange = {
                    email = it
                    errorMessage = null
                },
                label = "Email address",
                placeholder = "you@example.com",
            )

            PasswordField(
                value = password,
                onValueChange = {
                    password = it
                    errorMessage = null
                },
                label = "Password",
                placeholder = "Password",
            )

            if (!errorMessage.isNullOrBlank()) {
                HelperText(text = errorMessage!!)
            }

            PrimaryButton(
                text = if (isSubmitting) "Signing in..." else "Sign in",
                loading = isSubmitting,
                onClick = {
                    scope.launch {
                        isSubmitting = true

                        try {
                            val result = apiClient.login(
                                email = email.trim(),
                                password = password,
                            )
                            sessionStore.saveSession(result.accessToken, result.user.email)
                            onLoginSuccess()
                        } catch (error: Exception) {
                            errorMessage = when (error) {
                                is ApiException -> error.message
                                else -> "We couldn't sign you in right now."
                            }
                        } finally {
                            isSubmitting = false
                        }
                    }
                },
                enabled = email.isNotBlank() && password.isNotBlank(),
            )
        }
    }
}
