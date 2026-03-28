
package com.neph.features.profile.data
object ProfileRepository {

    private var profile = ProfileData()

    fun saveProfile(new: ProfileData) {
        profile = profile.copy(
            fullName = new.fullName ?: profile.fullName,
            email = new.email ?: profile.email,
            phone = new.phone ?: profile.phone,

            profession = new.profession ?: profile.profession,
            expertise = new.expertise,

            height = new.height ?: profile.height,
            weight = new.weight ?: profile.weight,
            bloodType = new.bloodType ?: profile.bloodType,
            gender = new.gender ?: profile.gender,
            birthDate = new.birthDate ?: profile.birthDate,
            medicalHistory = new.medicalHistory ?: profile.medicalHistory,

            chronicDiseases = new.chronicDiseases ?: profile.chronicDiseases,
            allergies = new.allergies ?: profile.allergies,

            country = new.country ?: profile.country,
            city = new.city ?: profile.city,
            district = new.district ?: profile.district,
            neighborhood = new.neighborhood ?: profile.neighborhood,
            extraAddress = new.extraAddress ?: profile.extraAddress,

            shareLocation = new.shareLocation ?: profile.shareLocation
        )
    }

    fun getProfile(): ProfileData {
        return profile
    }
}