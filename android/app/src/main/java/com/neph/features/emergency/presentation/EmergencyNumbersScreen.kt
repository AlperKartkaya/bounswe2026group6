package com.neph.features.emergency.presentation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.neph.ui.components.buttons.TextActionButton
import com.neph.ui.components.display.SectionCard
import com.neph.ui.components.display.SectionHeader
import com.neph.ui.layout.AppScaffold
import com.neph.ui.theme.LocalNephSpacing

private data class EmergencyContact(
    val name: String,
    val number: String,
    val note: String,
)

private val emergencyContacts = listOf(
    EmergencyContact(
        name = "Emergency Call Center",
        number = "112",
        note = "Primary emergency line in Turkey for urgent medical, fire, police, and rescue support.",
    ),
    EmergencyContact(
        name = "AFAD",
        number = "122",
        note = "Disaster and emergency management contact line.",
    ),
)

@Composable
fun EmergencyNumbersScreen(
    onNavigateBack: () -> Unit,
) {
    val spacing = LocalNephSpacing.current

    AppScaffold(
        title = "Emergency numbers",
        topBar = {
            TextActionButton(
                text = "Go back",
                onClick = onNavigateBack,
            )
        },
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(spacing.lg)) {
            emergencyContacts.forEach { contact ->
                SectionCard {
                    Column(verticalArrangement = Arrangement.spacedBy(spacing.xs)) {
                        SectionHeader(
                            title = contact.name,
                            subtitle = contact.note,
                        )

                        Text(
                            text = contact.number,
                            style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.colorScheme.primary,
                        )
                    }
                }
            }
        }
    }
}
