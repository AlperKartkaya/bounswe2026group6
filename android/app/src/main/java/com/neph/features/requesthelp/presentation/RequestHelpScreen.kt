package com.neph.features.requesthelp.presentation

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import com.neph.core.network.ApiException
import com.neph.features.auth.data.AuthRepository
import com.neph.features.auth.data.AuthSessionStore
import com.neph.features.auth.util.countryCodeOptions
import com.neph.features.profile.data.ProfileData
import com.neph.features.profile.data.ProfileRepository
import com.neph.features.profile.data.PhoneParts
import com.neph.features.profile.data.bloodTypeOptions
import com.neph.features.profile.data.combinePhoneNumber
import com.neph.features.profile.data.locationData
import com.neph.features.profile.data.normalizePhoneParts
import com.neph.features.profile.presentation.components.LocationSelector
import com.neph.features.requesthelp.data.RequestHelpRepository
import com.neph.features.requesthelp.data.RequestHelpSubmission
import com.neph.ui.components.buttons.PrimaryButton
import com.neph.ui.components.buttons.SecondaryButton
import com.neph.ui.components.display.HelperText
import com.neph.ui.components.display.SectionCard
import com.neph.ui.components.display.SectionHeader
import com.neph.ui.components.inputs.AppDropdown
import com.neph.ui.components.inputs.AppTextArea
import com.neph.ui.components.inputs.AppTextField
import com.neph.ui.components.selection.AppCheckbox
import com.neph.ui.components.selection.AppMultiSelectChipGroup
import com.neph.ui.layout.AppScaffold
import com.neph.ui.theme.LocalNephSpacing
import com.neph.ui.theme.NephTheme
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch

private val helpTypeOptions = listOf(
    "First Aid",
    "Search & Rescue",
    "Fire Brigade",
    "Evacuation / Transport",
    "Food & Water",
    "Shelter",
    "Security Support",
    "Other"
)

private val riskFlagOptions = listOf(
    "Fire",
    "Gas Leak",
    "Collapse Risk",
    "Flooding",
    "Electric Hazard",
    "Blocked Access / Debris"
)

private val vulnerableGroupOptions = listOf(
    "Children",
    "Elderly",
    "Disabled",
    "Pregnant",
    "Chronic Condition"
)

private data class RequestHelpFormState(
    val helpTypes: List<String> = emptyList(),
    val otherHelpType: String = "",
    val affectedPeopleCount: String = "",
    val riskFlags: List<String> = emptyList(),
    val vulnerableGroups: List<String> = emptyList(),
    val situationDescription: String = "",
    val bloodType: String = "",
    val country: String = "",
    val city: String = "",
    val district: String = "",
    val neighborhood: String = "",
    val shortAddress: String = "",
    val fullName: String = "",
    val countryCode: String = "+90",
    val phoneNumber: String = "",
    val alternativePhone: String = "",
    val confirmationAccepted: Boolean = false
)

private data class RequestHelpFieldErrors(
    val helpTypes: String? = null,
    val affectedPeopleCount: String? = null,
    val situationDescription: String? = null,
    val country: String? = null,
    val city: String? = null,
    val district: String? = null,
    val neighborhood: String? = null,
    val shortAddress: String? = null,
    val fullName: String? = null,
    val phoneNumber: String? = null,
    val confirmationAccepted: String? = null
)

private fun buildPrefilledForm(profile: ProfileData): RequestHelpFormState {
    val phoneParts: PhoneParts = normalizePhoneParts(profile.phone)

    return RequestHelpFormState(
        bloodType = profile.bloodType.orEmpty(),
        country = profile.country.orEmpty(),
        city = profile.city.orEmpty(),
        district = profile.district.orEmpty(),
        neighborhood = profile.neighborhood.orEmpty(),
        shortAddress = profile.extraAddress.orEmpty(),
        fullName = profile.fullName.orEmpty(),
        countryCode = phoneParts.countryCode,
        phoneNumber = phoneParts.phone
    )
}

private fun toggleSelection(current: List<String>, option: String): List<String> {
    return if (option in current) {
        current - option
    } else {
        current + option
    }
}

private fun findCountryLabel(countryKey: String): String =
    locationData[countryKey]?.label.orEmpty()

private fun findCityLabel(countryKey: String, cityKey: String): String =
    locationData[countryKey]?.cities?.get(cityKey)?.label.orEmpty()

private fun findDistrictLabel(countryKey: String, cityKey: String, districtKey: String): String =
    locationData[countryKey]?.cities?.get(cityKey)?.districts?.get(districtKey)?.label.orEmpty()

private fun findNeighborhoodLabel(
    countryKey: String,
    cityKey: String,
    districtKey: String,
    neighborhoodKey: String
): String =
    locationData[countryKey]
        ?.cities
        ?.get(cityKey)
        ?.districts
        ?.get(districtKey)
        ?.neighborhoods
        ?.firstOrNull { it.value == neighborhoodKey }
        ?.label
        .orEmpty()

private fun validateForm(state: RequestHelpFormState): RequestHelpFieldErrors {
    val affectedPeople = state.affectedPeopleCount.toIntOrNull()

    return RequestHelpFieldErrors(
        helpTypes = if (state.helpTypes.isEmpty()) "Select at least one help type." else null,
        affectedPeopleCount = when {
            state.affectedPeopleCount.isBlank() -> "Affected people count is required."
            affectedPeople == null || affectedPeople < 1 -> "Enter a valid number greater than or equal to 1."
            else -> null
        },
        situationDescription = if (state.situationDescription.isBlank()) {
            "Situation description cannot be blank."
        } else {
            null
        },
        country = if (state.country.isBlank()) "Country is required." else null,
        city = if (state.city.isBlank()) "City is required." else null,
        district = if (state.district.isBlank()) "District is required." else null,
        neighborhood = if (state.neighborhood.isBlank()) "Neighborhood is required." else null,
        shortAddress = if (state.shortAddress.isBlank()) "Short address is required." else null,
        fullName = if (state.fullName.isBlank()) "Full name cannot be blank." else null,
        phoneNumber = if (state.phoneNumber.isBlank()) "Phone number cannot be blank." else null,
        confirmationAccepted = if (!state.confirmationAccepted) {
            "You must confirm information sharing before sending."
        } else {
            null
        }
    )
}

private fun RequestHelpFieldErrors.hasAny(): Boolean {
    return listOf(
        helpTypes,
        affectedPeopleCount,
        situationDescription,
        country,
        city,
        district,
        neighborhood,
        shortAddress,
        fullName,
        phoneNumber,
        confirmationAccepted
    ).any { !it.isNullOrBlank() }
}

private fun buildSubmission(state: RequestHelpFormState): RequestHelpSubmission {
    val needType = state.helpTypes.joinToString(", ").ifBlank { "general" }
    val countryLabel = findCountryLabel(state.country)
    val cityLabel = findCityLabel(state.country, state.city)
    val districtLabel = findDistrictLabel(state.country, state.city, state.district)
    val neighborhoodLabel = findNeighborhoodLabel(
        state.country,
        state.city,
        state.district,
        state.neighborhood
    )

    val descriptionLines = buildList {
        add("Situation Description: ${state.situationDescription.trim()}")
        add("Affected People Count: ${state.affectedPeopleCount.trim()}")

        if (state.helpTypes.contains("Other") && state.otherHelpType.isNotBlank()) {
            add("Other Help Type Details: ${state.otherHelpType.trim()}")
        }

        if (state.riskFlags.isNotEmpty()) {
            add("Risk Flags: ${state.riskFlags.joinToString(", ")}")
        }

        if (state.vulnerableGroups.isNotEmpty()) {
            add("Vulnerable Groups: ${state.vulnerableGroups.joinToString(", ")}")
        }

        if (state.bloodType.isNotBlank()) {
            add("Blood Type: ${state.bloodType}")
        }

        add(
            "Location: ${listOf(countryLabel, cityLabel, districtLabel, neighborhoodLabel).filter { it.isNotBlank() }.joinToString(" / ")}"
        )
        add("Address Description: ${state.shortAddress.trim()}")
        add("Full Name: ${state.fullName.trim()}")
        add("Phone Number: ${combinePhoneNumber(state.countryCode, state.phoneNumber)}")

        if (state.alternativePhone.isNotBlank()) {
            add("Alternative Phone: ${state.alternativePhone.trim()}")
        }
    }

    return RequestHelpSubmission(
        needType = needType,
        description = descriptionLines.joinToString("\n"),
        isSavedLocally = false
    )
}

@Composable
fun RequestHelpScreen(
    onNavigateBack: () -> Unit,
    onNavigateToLogin: () -> Unit
) {
    val spacing = LocalNephSpacing.current
    val scope = rememberCoroutineScope()
    val sessionToken = AuthSessionStore.getAccessToken().orEmpty()
    val isLoggedIn = sessionToken.isNotBlank()

    var formState by remember {
        mutableStateOf(
            if (isLoggedIn) buildPrefilledForm(ProfileRepository.getProfile()) else RequestHelpFormState()
        )
    }
    var fieldErrors by remember { mutableStateOf(RequestHelpFieldErrors()) }
    var loading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf("") }
    var infoMessage by remember { mutableStateOf("") }

    LaunchedEffect(sessionToken) {
        if (!isLoggedIn) {
            formState = RequestHelpFormState()
            return@LaunchedEffect
        }

        try {
            val profile = ProfileRepository.fetchAndCacheRemoteProfile()
            formState = buildPrefilledForm(profile)
        } catch (cancellationException: CancellationException) {
            throw cancellationException
        } catch (error: ApiException) {
            if (error.status == 401) {
                AuthRepository.logout()
                errorMessage = "Your session expired. Please log in again before sending a help request."
            } else {
                formState = buildPrefilledForm(ProfileRepository.getProfile())
                infoMessage = "Could not refresh profile details. Using saved information where available."
            }
        } catch (_: Exception) {
            formState = buildPrefilledForm(ProfileRepository.getProfile())
            infoMessage = "Could not refresh profile details. Using saved information where available."
        }
    }

    fun handleSubmit() {
        val nextFieldErrors = validateForm(formState)
        fieldErrors = nextFieldErrors
        errorMessage = ""
        infoMessage = ""

        if (nextFieldErrors.hasAny()) {
            return
        }

        if (!isLoggedIn) {
            errorMessage = "Please log in to send this help request. The current backend endpoint requires authentication."
            return
        }

        loading = true
        scope.launch {
            try {
                val hasActiveRequest = RequestHelpRepository.hasActiveHelpRequest(sessionToken)
                if (hasActiveRequest) {
                    errorMessage = "You can only have one active help request at a time."
                    return@launch
                }

                RequestHelpRepository.createHelpRequest(
                    token = sessionToken,
                    submission = buildSubmission(formState)
                )
                infoMessage = "Help request sent successfully."
                onNavigateBack()
            } catch (cancellationException: CancellationException) {
                throw cancellationException
            } catch (error: ApiException) {
                if (error.status == 401) {
                    AuthRepository.logout()
                    errorMessage = "Your session expired. Please log in again to send your request."
                    onNavigateToLogin()
                    return@launch
                } else {
                    errorMessage = error.message.ifBlank { "Could not send your help request." }
                }
            } catch (_: Exception) {
                errorMessage = "Something went wrong while sending your help request."
            } finally {
                loading = false
            }
        }
    }

    AppScaffold(
        title = "Request Help",
        onNavigateBack = onNavigateBack
    ) {
        Column(
            verticalArrangement = Arrangement.spacedBy(spacing.lg)
        ) {
            SectionCard {
                Column(verticalArrangement = Arrangement.spacedBy(spacing.md)) {
                    SectionHeader(
                        title = "Help Types",
                        subtitle = if (isLoggedIn) {
                            "Select the support you need. Shared fields are prefilled from your profile when available."
                        } else {
                            "Fill the same request form manually as a guest. Sending currently requires login because the backend endpoint is authenticated."
                        }
                    )

                    AppMultiSelectChipGroup(
                        label = "Required help",
                        options = helpTypeOptions,
                        selectedOptions = formState.helpTypes,
                        onOptionToggle = {
                            formState = formState.copy(
                                helpTypes = toggleSelection(formState.helpTypes, it),
                                otherHelpType = if (it == "Other" && "Other" in formState.helpTypes) "" else formState.otherHelpType
                            )
                        },
                        error = fieldErrors.helpTypes
                    )

                    if ("Other" in formState.helpTypes) {
                        AppTextField(
                            value = formState.otherHelpType,
                            onValueChange = { formState = formState.copy(otherHelpType = it) },
                            label = "Other Help Type Details",
                            placeholder = "Add a short detail if needed"
                        )
                    }
                }
            }

            SectionCard {
                Column(verticalArrangement = Arrangement.spacedBy(spacing.md)) {
                    SectionHeader(
                        title = "Situation Details",
                        subtitle = "Share a concise summary so the backend request record contains enough coordination context."
                    )

                    AppTextField(
                        value = formState.affectedPeopleCount,
                        onValueChange = {
                            formState = formState.copy(
                                affectedPeopleCount = it.filter(Char::isDigit)
                            )
                        },
                        label = "Affected People Count",
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        error = fieldErrors.affectedPeopleCount
                    )

                    AppMultiSelectChipGroup(
                        label = "Risk Flags",
                        options = riskFlagOptions,
                        selectedOptions = formState.riskFlags,
                        onOptionToggle = {
                            formState = formState.copy(
                                riskFlags = toggleSelection(formState.riskFlags, it)
                            )
                        }
                    )

                    AppMultiSelectChipGroup(
                        label = "Vulnerable Groups",
                        options = vulnerableGroupOptions,
                        selectedOptions = formState.vulnerableGroups,
                        onOptionToggle = {
                            formState = formState.copy(
                                vulnerableGroups = toggleSelection(formState.vulnerableGroups, it)
                            )
                        }
                    )

                    AppTextArea(
                        value = formState.situationDescription,
                        onValueChange = { formState = formState.copy(situationDescription = it) },
                        label = "Situation Description",
                        placeholder = "Describe the situation briefly",
                        error = fieldErrors.situationDescription
                    )

                    AppDropdown(
                        value = formState.bloodType,
                        onValueChange = { formState = formState.copy(bloodType = it) },
                        label = "Blood Type",
                        options = bloodTypeOptions,
                        placeholder = "Select blood type",
                        selectedTextMapper = { it.label }
                    )
                }
            }

            SectionCard {
                Column(verticalArrangement = Arrangement.spacedBy(spacing.md)) {
                    SectionHeader(
                        title = "Location",
                        subtitle = "Use the same location structure as your profile."
                    )

                    LocationSelector(
                        country = formState.country,
                        city = formState.city,
                        district = formState.district,
                        neighborhood = formState.neighborhood,
                        onCountryChange = {
                            formState = formState.copy(country = it, city = "", district = "", neighborhood = "")
                        },
                        onCityChange = {
                            formState = formState.copy(city = it, district = "", neighborhood = "")
                        },
                        onDistrictChange = {
                            formState = formState.copy(district = it, neighborhood = "")
                        },
                        onNeighborhoodChange = {
                            formState = formState.copy(neighborhood = it)
                        },
                        locationData = locationData,
                        countryError = fieldErrors.country,
                        cityError = fieldErrors.city,
                        districtError = fieldErrors.district,
                        neighborhoodError = fieldErrors.neighborhood
                    )

                    AppTextField(
                        value = formState.shortAddress,
                        onValueChange = { formState = formState.copy(shortAddress = it) },
                        label = "Short Address / Address Description",
                        error = fieldErrors.shortAddress
                    )
                }
            }

            SectionCard {
                Column(verticalArrangement = Arrangement.spacedBy(spacing.md)) {
                    SectionHeader(
                        title = "Contact Information",
                        subtitle = "Shared profile fields are prefilled for logged-in users and remain editable."
                    )

                    AppTextField(
                        value = formState.fullName,
                        onValueChange = { formState = formState.copy(fullName = it) },
                        label = "Full Name",
                        error = fieldErrors.fullName
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(spacing.sm)
                    ) {
                        AppDropdown(
                            value = formState.countryCode,
                            onValueChange = { formState = formState.copy(countryCode = it) },
                            label = "Code",
                            options = countryCodeOptions,
                            modifier = Modifier.weight(0.42f),
                            selectedTextMapper = { it.value }
                        )

                        AppTextField(
                            value = formState.phoneNumber,
                            onValueChange = {
                                formState = formState.copy(phoneNumber = it.filter(Char::isDigit))
                            },
                            label = "Phone Number",
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                            modifier = Modifier.weight(0.58f),
                            error = fieldErrors.phoneNumber
                        )
                    }

                    AppTextField(
                        value = formState.alternativePhone,
                        onValueChange = {
                            formState = formState.copy(alternativePhone = it.filter(Char::isDigit))
                        },
                        label = "Alternative Phone (optional)",
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone)
                    )
                }
            }

            SectionCard {
                Column(verticalArrangement = Arrangement.spacedBy(spacing.md)) {
                    SectionHeader(
                        title = "Confirmation",
                        subtitle = "Review the information before sending."
                    )

                    AppCheckbox(
                        checked = formState.confirmationAccepted,
                        onCheckedChange = {
                            formState = formState.copy(confirmationAccepted = it)
                        },
                        label = "I confirm this information can be shared for emergency coordination.",
                        error = fieldErrors.confirmationAccepted
                    )
                }
            }

            if (errorMessage.isNotBlank()) {
                HelperText(text = errorMessage)
            }

            if (infoMessage.isNotBlank()) {
                HelperText(text = infoMessage)
            }

            PrimaryButton(
                text = "Send Help Request",
                onClick = ::handleSubmit,
                loading = loading
            )

            SecondaryButton(
                text = "Cancel",
                onClick = onNavigateBack,
                enabled = !loading
            )
        }
    }
}
@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun RequestHelpScreenPreview() {
    NephTheme {
        RequestHelpScreen(
            onNavigateBack = {},
            onNavigateToLogin = {}
        )
    }
}
