package com.neph.navigation

sealed class Routes(val route: String) {
    data object Login : Routes("login")
    data object Signup : Routes("signup")
    data object VerifyEmail : Routes("verify_email")

    data object Profile : Routes("profile")
    data object Privacy : Routes("privacy")
    data object Security : Routes("security")

    data object Home : Routes("home")
}