package com.neph.data.session

import android.content.Context

class SessionStore(context: Context) {
    private val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)

    fun getAccessToken(): String? = preferences.getString(KEY_ACCESS_TOKEN, null)

    fun getUserEmail(): String? = preferences.getString(KEY_USER_EMAIL, null)

    fun saveSession(accessToken: String, email: String) {
        preferences.edit()
            .putString(KEY_ACCESS_TOKEN, accessToken)
            .putString(KEY_USER_EMAIL, email)
            .apply()
    }

    fun clearSession() {
        preferences.edit().clear().apply()
    }

    private companion object {
        const val PREFERENCES_NAME = "neph.session"
        const val KEY_ACCESS_TOKEN = "neph.accessToken"
        const val KEY_USER_EMAIL = "neph.userEmail"
    }
}
