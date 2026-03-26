package com.neph.navigation

sealed class Routes(val route: String) {
    data object Login : Routes("login")
    data object EmergencyHub : Routes("emergency_hub")
    data object EmergencyNumbers : Routes("emergency_numbers")
}
