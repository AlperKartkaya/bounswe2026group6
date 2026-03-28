package com.neph.features.auth.presentation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.neph.features.profile.data.ProfileRepository
import com.neph.features.profile.data.sanitizeDecimalInput
import com.neph.features.profile.presentation.components.GenderSelector
import com.neph.features.profile.presentation.components.LocationSelector
import com.neph.features.profile.data.bloodTypeOptions
import com.neph.features.profile.data.locationData
import com.neph.ui.components.display.SaveActionBar
import com.neph.ui.components.inputs.*
import com.neph.ui.components.selection.AppToggleSwitch
import com.neph.ui.layout.AuthScaffold
import com.neph.ui.theme.LocalNephSpacing

@Composable
fun CompleteProfileScreen(
    onComplete: () -> Unit,
    onNavigateBack: () -> Unit
) {
    var gender by rememberSaveable { mutableStateOf("") }
    var height by rememberSaveable { mutableStateOf("") }
    var weight by rememberSaveable { mutableStateOf("") }
    var bloodType by rememberSaveable { mutableStateOf("") }
    var birthDate by rememberSaveable { mutableStateOf("") }
    var medicalHistory by rememberSaveable { mutableStateOf("") }
    var country by rememberSaveable { mutableStateOf("") }
    var city by rememberSaveable { mutableStateOf("") }
    var district by rememberSaveable { mutableStateOf("") }
    var neighborhood by rememberSaveable { mutableStateOf("") }
    var extraAddress by rememberSaveable { mutableStateOf("") }
    var shareLocation by rememberSaveable { mutableStateOf(false) }
    var error by rememberSaveable { mutableStateOf("") }

    var profession by rememberSaveable { mutableStateOf<String?>(null) }
    var expertise by rememberSaveable { mutableStateOf<List<String>>(emptyList()) }

    var showDatePicker by remember { mutableStateOf(false) }
    val datePickerState = rememberDatePickerState()

    val spacing = LocalNephSpacing.current

    val professionOptions = listOf("Doctor", "Firefighter", "Nurse", "Engineer", "Volunteer")
    val expertiseOptions = listOf("First Aid", "Driving", "Search & Rescue", "Cooking", "Logistics")

    fun handleSave() {
        if (height.isBlank() || weight.isBlank() || birthDate.isBlank() ||
            country.isBlank() || city.isBlank() || district.isBlank() || neighborhood.isBlank()
        ) {
            error = "Please fill in all required fields."
            return
        }

        if (!birthDate.matches(Regex("\\d{4}-\\d{2}-\\d{2}"))) {
            error = "Invalid date format (YYYY-MM-DD)"
            return
        }

        val heightFloat = height.toFloatOrNull()
        val weightFloat = weight.toFloatOrNull()

        if (heightFloat == null || weightFloat == null || heightFloat <= 0f || weightFloat <= 0f) {
            error = "Height and weight must be valid positive numbers"
            return
        }

        ProfileRepository.saveProfile(
            ProfileRepository.getProfile().copy(
                gender = gender.ifBlank { null },
                height = heightFloat,
                weight = weightFloat,
                bloodType = bloodType.ifBlank { null },
                birthDate = birthDate,
                medicalHistory = medicalHistory.ifBlank { null },
                country = country,
                city = city,
                district = district,
                neighborhood = neighborhood,
                extraAddress = extraAddress.ifBlank { null },
                shareLocation = shareLocation,
                profession = profession,
                expertise = expertise
            )
        )

        error = ""
        onComplete()
    }

    AuthScaffold(
        title = "Complete Your Profile",
        subtitle = "Set up your account details"
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(spacing.md)) {

            Row(horizontalArrangement = Arrangement.spacedBy(spacing.sm)) {
                AppTextField(
                    value = height,
                    onValueChange = { height = sanitizeDecimalInput(it, maxLen = 3) },
                    label = "Height (cm)",
                    modifier = Modifier.weight(1f),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                )

                AppTextField(
                    value = weight,
                    onValueChange = { weight = sanitizeDecimalInput(it, maxLen = 3) },
                    label = "Weight (kg)",
                    modifier = Modifier.weight(1f),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                )
            }

            GenderSelector(value = gender, onValueChange = { gender = it })

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(spacing.sm)
            ) {
                AppTextField(
                    value = birthDate,
                    onValueChange = { birthDate = it },
                    label = "Date of Birth",
                    placeholder = "YYYY-MM-DD",
                    modifier = Modifier.weight(1f)
                )
                TextButton(onClick = { showDatePicker = true }) {
                    Text("Pick date")
                }
            }

            Text("Medical Information (optional)", style = MaterialTheme.typography.titleMedium)

            AppDropdown(
                value = bloodType,
                onValueChange = { bloodType = it },
                label = "Blood Type",
                options = bloodTypeOptions,
                selectedTextMapper = { it.label }
            )

            AppTextArea(
                value = medicalHistory,
                onValueChange = { medicalHistory = it },
                label = "Medical History (optional — comma-separated)"
            )

            Text("Profession", style = MaterialTheme.typography.titleMedium)

            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                professionOptions.forEach { option ->
                    FilterChip(
                        selected = profession == option,
                        onClick = {
                            profession = if (profession == option) null else option
                        },
                        label = { Text(option) }
                    )
                }
            }

            if (profession != null) {
                Text("Expertise (optional)", style = MaterialTheme.typography.titleMedium)

                Column {
                    expertiseOptions.forEach { skill ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Checkbox(
                                checked = expertise.contains(skill),
                                onCheckedChange = {
                                    expertise = if (it) expertise + skill else expertise - skill
                                }
                            )
                            Text(skill)
                        }
                    }
                }
            }

            Text("Location", style = MaterialTheme.typography.titleMedium)

            LocationSelector(
                country = country,
                city = city,
                district = district,
                neighborhood = neighborhood,
                onCountryChange = {
                    country = it
                    city = ""
                    district = ""
                    neighborhood = ""
                },
                onCityChange = {
                    city = it
                    district = ""
                    neighborhood = ""
                },
                onDistrictChange = {
                    district = it
                    neighborhood = ""
                },
                onNeighborhoodChange = { neighborhood = it },
                locationData = locationData
            )

            AppTextField(
                value = extraAddress,
                onValueChange = { extraAddress = it },
                label = "Extra Address"
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                AppToggleSwitch(
                    checked = shareLocation,
                    onCheckedChange = { shareLocation = it },
                    label = "Share Current Location"
                )
            }

            if (error.isNotBlank()) {
                Text(error, color = MaterialTheme.colorScheme.error)
            }

            SaveActionBar(onSave = ::handleSave)
        }

        if (showDatePicker) {
            DatePickerDialog(
                onDismissRequest = { showDatePicker = false },
                confirmButton = {
                    TextButton(
                        onClick = {
                            val selectedDate = datePickerState.selectedDateMillis
                            if (selectedDate != null) {
                                birthDate = android.text.format.DateFormat.format(
                                    "yyyy-MM-dd",
                                    selectedDate
                                ).toString()
                            }
                            showDatePicker = false
                        }
                    ) {
                        Text("OK")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDatePicker = false }) {
                        Text("Cancel")
                    }
                }
            ) {
                DatePicker(state = datePickerState)
            }
        }
    }
}
