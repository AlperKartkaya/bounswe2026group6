package com.neph.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.neph.data.remote.ApiClient
import com.neph.data.session.SessionStore
import com.neph.features.auth.presentation.LoginScreen
import com.neph.features.emergency.presentation.EmergencyHubScreen
import com.neph.features.emergency.presentation.EmergencyNumbersScreen

@Composable
fun AppNavGraph(
    navController: NavHostController,
    sessionStore: SessionStore,
    apiClient: ApiClient,
    startDestination: String = Routes.Login.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Routes.Login.route) {
            LoginScreen(
                sessionStore = sessionStore,
                apiClient = apiClient,
                onLoginSuccess = {
                    val returned = navController.popBackStack()

                    if (!returned) {
                        navController.navigate(Routes.EmergencyHub.route) {
                            popUpTo(Routes.Login.route) { inclusive = true }
                        }
                    }
                },
                onNavigateToEmergencyNumbers = {
                    navController.navigate(Routes.EmergencyNumbers.route)
                },
            )
        }

        composable(Routes.EmergencyHub.route) {
            EmergencyHubScreen(
                sessionStore = sessionStore,
                apiClient = apiClient,
                onNavigateToLogin = {
                    navController.navigate(Routes.Login.route)
                },
                onNavigateToEmergencyNumbers = {
                    navController.navigate(Routes.EmergencyNumbers.route)
                },
                onLogout = {
                    sessionStore.clearSession()
                    navController.navigate(Routes.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.EmergencyNumbers.route) {
            EmergencyNumbersScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}
