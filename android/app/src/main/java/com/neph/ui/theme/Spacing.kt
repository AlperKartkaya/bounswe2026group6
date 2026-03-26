package com.neph.ui.theme

import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

data class NephSpacing(
    val xs: Dp = 6.dp,
    val sm: Dp = 10.dp,
    val md: Dp = 16.dp,
    val lg: Dp = 20.dp,
    val xl: Dp = 24.dp,
    val xxl: Dp = 28.dp,
    val xxxl: Dp = 36.dp,
    val huge: Dp = 44.dp
)

val LocalNephSpacing = staticCompositionLocalOf { NephSpacing() }
