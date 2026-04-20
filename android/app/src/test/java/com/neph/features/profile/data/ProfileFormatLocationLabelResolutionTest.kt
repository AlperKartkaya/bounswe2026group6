package com.neph.features.profile.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ProfileFormatLocationLabelResolutionTest {
    private val sampleLocations: LocationData = mapOf(
        "tr" to Country(
            label = "Turkey",
            cities = mapOf(
                "istanbul" to City(
                    label = "Istanbul",
                    districts = mapOf(
                        "kadikoy" to District(
                            label = "Kadıköy",
                            neighborhoods = listOf(
                                Neighborhood("Bostancı", "bostanci")
                            )
                        )
                    )
                )
            )
        )
    )

    @Test
    fun resolvesLocationLabelsFromSelectionKeys() {
        assertEquals("Turkey", resolveCountryLabel("tr", sampleLocations))
        assertEquals("Istanbul", resolveCityLabel("tr", "istanbul", sampleLocations))
        assertEquals("Kadıköy", resolveDistrictLabel("tr", "istanbul", "kadikoy", sampleLocations))
        assertEquals(
            "Bostancı",
            resolveNeighborhoodLabel("tr", "istanbul", "kadikoy", "bostanci", sampleLocations)
        )
    }

    @Test
    fun keepsLocationLabelsWhenAlreadyProvidedAsLabels() {
        assertEquals("Turkey", resolveCountryLabel("Turkey", sampleLocations))
        assertEquals("Istanbul", resolveCityLabel("tr", "Istanbul", sampleLocations))
        assertEquals("Kadıköy", resolveDistrictLabel("tr", "istanbul", "Kadıköy", sampleLocations))
        assertEquals(
            "Bostancı",
            resolveNeighborhoodLabel("tr", "istanbul", "kadikoy", "Bostancı", sampleLocations)
        )
    }

    @Test
    fun returnsNullWhenSelectionIsBlank() {
        assertNull(resolveCountryLabel("", sampleLocations))
        assertNull(resolveCityLabel("tr", "", sampleLocations))
        assertNull(resolveDistrictLabel("tr", "istanbul", "", sampleLocations))
        assertNull(resolveNeighborhoodLabel("tr", "istanbul", "kadikoy", "", sampleLocations))
    }
}
