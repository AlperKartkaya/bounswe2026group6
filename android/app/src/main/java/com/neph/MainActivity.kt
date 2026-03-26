package com.neph

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.Composable
import androidx.compose.material3.Text
import androidx.compose.runtime.remember
import androidx.navigation.compose.rememberNavController
import androidx.compose.ui.tooling.preview.Preview
import com.neph.data.remote.ApiClient
import com.neph.data.session.SessionStore
import com.neph.navigation.AppNavGraph
import com.neph.navigation.Routes
import com.neph.ui.theme.NephTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val sessionStore = SessionStore(applicationContext)

        setContent {
            NephApp(sessionStore = sessionStore)
        }
    }
}

@Composable
fun NephApp(sessionStore: SessionStore) {
    val navController = rememberNavController()

    NephTheme {
        AppNavGraph(
            navController = navController,
            sessionStore = sessionStore,
            apiClient = remember { ApiClient() },
            startDestination = Routes.EmergencyHub.route,
        )
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
fun NephAppPreview() {
    NephTheme {
        Text(text = "NEPH Android preview")
    }
}
