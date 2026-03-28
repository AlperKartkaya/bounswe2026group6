package com.neph.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.neph.features.auth.presentation.LoginScreen
import com.neph.features.auth.presentation.SignupScreen
import com.neph.features.auth.presentation.VerifyEmailScreen
import com.neph.features.privacy.presentation.PrivacyScreen
import com.neph.features.profile.presentation.ProfileScreen

@Composable
fun AppNavGraph(
    navController: NavHostController,
    startDestination: String = Routes.Login.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Routes.Login.route) {
            LoginScreen(
                onNavigateToSignup = {
                    navController.navigate(Routes.Signup.route)
                },
                onLoginSuccess = {
                    navController.navigate(Routes.Profile.route) {
                        popUpTo(Routes.Login.route) { inclusive = true }
                    }
                },
                onNavigateToVerifyEmail = {
                    navController.navigate(Routes.VerifyEmail.route)
                }
            )
        }

        composable(Routes.Signup.route) {
            SignupScreen(
                onNavigateToLogin = {
                    navController.popBackStack()
                },
                onSignupSuccess = {
                    navController.navigate(Routes.VerifyEmail.route)
                }
            )
        }

        composable(Routes.VerifyEmail.route) {
            VerifyEmailScreen(
                onVerificationSuccess = {
                    navController.navigate(Routes.Profile.route) {
                        popUpTo(Routes.Login.route) { inclusive = true }
                    }
                },
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable(Routes.Profile.route) {
            ProfileScreen(
                onNavigateToPrivacy = {
                    navController.navigate(Routes.Privacy.route)
                },
                onNavigateToSecurity = {
                    navController.navigate(Routes.Security.route)
                },
                onLogout = {
                    navController.navigate(Routes.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.Privacy.route) {
            PrivacyScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable(Routes.Security.route) {
            SecurityPlaceholderScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}