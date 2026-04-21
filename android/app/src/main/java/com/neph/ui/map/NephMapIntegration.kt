package com.neph.ui.map

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import com.neph.features.profile.data.LocationData
import com.neph.features.profile.data.locationData
import com.neph.features.profile.data.resolveCityLabel
import com.neph.features.profile.data.resolveCountryLabel
import com.neph.features.profile.data.resolveDistrictLabel
import com.neph.features.profile.data.resolveNeighborhoodLabel
import java.util.Locale

object NephMapIntegration {
    fun openCoordinates(
        context: Context,
        latitude: Double,
        longitude: Double,
        label: String
    ): Boolean {
        val encodedLabel = Uri.encode(label.ifBlank { "Location" })
        val geoUri = Uri.parse("geo:$latitude,$longitude?q=$latitude,$longitude($encodedLabel)")
        val geoIntent = Intent(Intent.ACTION_VIEW, geoUri)

        return runCatching {
            context.startActivity(geoIntent)
            true
        }.recoverCatching {
            if (it is ActivityNotFoundException) {
                val browserUri = Uri.parse(
                    "https://www.openstreetmap.org/?mlat=$latitude&mlon=$longitude#map=17/$latitude/$longitude"
                )
                context.startActivity(Intent(Intent.ACTION_VIEW, browserUri))
                true
            } else {
                throw it
            }
        }.getOrElse { false }
    }

    fun openLocationQuery(
        context: Context,
        query: String
    ): Boolean {
        val normalizedQuery = query.trim()
        if (normalizedQuery.isBlank()) {
            return false
        }

        val encodedQuery = Uri.encode(normalizedQuery)
        val geoUri = Uri.parse("geo:0,0?q=$encodedQuery")
        val geoIntent = Intent(Intent.ACTION_VIEW, geoUri)

        return runCatching {
            context.startActivity(geoIntent)
            true
        }.recoverCatching {
            if (it is ActivityNotFoundException) {
                val browserUri = Uri.parse("https://www.openstreetmap.org/search?query=$encodedQuery")
                context.startActivity(Intent(Intent.ACTION_VIEW, browserUri))
                true
            } else {
                throw it
            }
        }.getOrElse { false }
    }
}

fun buildLocationSelectionMapQuery(
    countryKeyOrLabel: String?,
    cityKeyOrLabel: String?,
    districtKeyOrLabel: String?,
    neighborhoodValueOrLabel: String?,
    extraAddress: String?,
    locations: LocationData = locationData
): String {
    val countryLabel = resolveCountryLabel(countryKeyOrLabel, locations)
    val cityLabel = resolveCityLabel(countryKeyOrLabel, cityKeyOrLabel, locations)
    val districtLabel = resolveDistrictLabel(countryKeyOrLabel, cityKeyOrLabel, districtKeyOrLabel, locations)
    val neighborhoodLabel = resolveNeighborhoodLabel(
        countryKeyOrLabel,
        cityKeyOrLabel,
        districtKeyOrLabel,
        neighborhoodValueOrLabel,
        locations
    )
    val normalizedExtraAddress = extraAddress?.trim().orEmpty().takeIf { it.isNotBlank() }

    return listOf(
        normalizedExtraAddress,
        neighborhoodLabel,
        districtLabel,
        cityLabel,
        countryLabel
    ).filterNotNull().filter { it.isNotBlank() }.joinToString(", ")
}

fun formatMapCoordinate(value: Double): String {
    return String.format(Locale.US, "%.5f", value)
}
