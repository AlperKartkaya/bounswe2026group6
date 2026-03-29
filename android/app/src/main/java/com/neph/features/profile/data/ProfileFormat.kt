package com.neph.features.profile.data

/** Display/editing helpers for profile numeric fields stored as [Float]. */
fun Float?.toEditableString(): String =
    when (this) {
        null -> ""
        else ->
            if (this % 1f == 0f) {
                this.toInt().toString()
            } else {
                toString()
            }
    }

/** Allows typing decimals with at most one `.` and a bounded length. */
fun sanitizeDecimalInput(raw: String, maxLen: Int = 8): String {
    val sb = StringBuilder()
    var dotSeen = false
    for (c in raw) {
        when {
            c.isDigit() -> if (sb.length < maxLen) sb.append(c)
            c == '.' && !dotSeen -> {
                dotSeen = true
                if (sb.length < maxLen) sb.append('.')
            }
        }
    }
    return sb.toString()
}

fun parseBirthDateToMillis(iso: String?): Long? {
    if (iso.isNullOrBlank()) return null
    return try {
        val ld = java.time.LocalDate.parse(iso)
        ld.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli()
    } catch (_: Exception) {
        null
    }
}
