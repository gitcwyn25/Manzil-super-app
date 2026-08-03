# Manzil Android Consumer App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a native Android consumer app in Kotlin/Compose that lets people in Tashkent discover, compare, save and review local businesses against the live Manzil API, shipped to Google Play.

**Architecture:** A single Gradle module at `apps/android`, organised by feature package rather than by Gradle module. Retrofit + kotlinx.serialization talk to the existing NestJS API; every response is `{ data: … }` so one `ApiEnvelope<T>` covers all of them. Repositories map DTOs to domain models and network failures to a closed `ManzilError` set, which the UI renders as designed states rather than generic errors. One ViewModel per screen exposes a single `StateFlow<XUiState>`. Navigation Compose with type-safe serializable routes drives a single activity.

**Tech Stack:** Kotlin 2.2.10, AGP 9.2.0, JDK 17, Compose BOM 2026.06.01 (Material 3 1.4.0), Hilt, Retrofit 2 + OkHttp 4 + kotlinx.serialization, DataStore Preferences, Coil 3, Clerk Android SDK, 2GIS Mobile SDK 13, Play Services Location. Tests: JUnit4, Turbine, MockWebServer, kotlinx-coroutines-test, Compose UI test.

**Spec:** `docs/superpowers/specs/2026-08-03-android-consumer-app-design.md`

---

## Global Constraints

Every task's requirements implicitly include this section.

- **Module path:** `apps/android`. Application ID `com.manzil.consumer`. Namespace `com.manzil.consumer`.
- **SDK levels:** `minSdk = 24` (Clerk Android SDK floor), `compileSdk = 36`, `targetSdk = 36`. Google Play requires new apps to target API 36 from 2026-08-31; this app targets 36 from the first build.
- **Java/Kotlin:** JDK 17 toolchain (Clerk requires 17+). Kotlin 2.2.10 with the Compose compiler plugin (`org.jetbrains.kotlin.plugin.compose`).
- **Typeface:** display = **Unbounded**, body = **IBM Plex Sans**. Archivo is NOT used — its Google Fonts `METADATA.pb` declares only `latin`, `latin-ext`, `menu`, `vietnamese`, so Russian headings would silently fall back. Both chosen faces declare `cyrillic` and `cyrillic-ext`. Fonts are bundled in `res/font/`, never fetched at runtime.
- **Dynamic colour is disabled.** Never call `dynamicLightColorScheme`/`dynamicDarkColorScheme`. Wallpaper-derived colour would destroy the teal/gold identity.
- **Brand colours:** `primary #005454`, `primarySoft #A1F0EF`, `primaryContainer #0F6E6E`, `primaryDark #002020`, `gold #FEB300`, `goldSoft #FFDEAC`, `ink #1A1C1B`, `muted #3E4948`, `subtle #6E7979`, `background #F9F9F7`, `surface #FFFFFF`, `surfaceSoft #F4F4F2`, `surfaceHigh #E8E8E6`, `outline #BEC9C8`, `danger #BA1A1A`, `success #0F6E4B`. Gold is reserved for ratings and exactly one primary CTA per screen.
- **Default locale is Uzbek.** `res/values/strings.xml` is uz. `values-ru/` and `values-en/` are overlays. No user-facing string is ever hardcoded in Kotlin.
- **No secrets in git.** `dgissdk.key`, the release keystore, and the Clerk publishable key are supplied via `local.properties` / CI secrets and read through `buildConfigField`. Add `apps/android/local.properties`, `apps/android/app/src/main/assets/dgissdk.key`, and `*.jks` to `.gitignore`.
- **API base URL** comes from a Gradle `buildConfigField`, never a hardcoded literal in Kotlin.
- **Accessibility:** minimum 48dp touch targets, WCAG AA contrast, every icon-only control carries a `contentDescription`, colour is never the sole indicator of rating, verification, error or saved state.
- **Every task ends with a commit.** Conventional Commits, scope `android`.

### API facts this plan depends on

Verified against `apps/api` source on 2026-08-03:

- Every response is `{ "data": … }`.
- `GET /v1/home?locale=` cards carry **no `lat`/`lng`** and an **unnormalised `priceTier`** (raw DB value: may be `budget`/`premium`/`luxury`/`$`/`$$`/`$$$`/`null`). `GET /v1/search` businesses carry `lat`/`lng` and a `priceTier` already normalised to `$`/`$$`/`$$$`. The client normalises both through one function.
- `GET /v1/search` currently returns unclaimed and merged listings — the `status`/`mergedIntoId` filter is missing server-side. That is Workstream B. **This app filters defensively client-side** so it is correct against today's API and stays correct after the fix.
- `ThrottleGurman` = 10 requests / 15 min then a 30-minute block. `ThrottleWrite` (review submit, helpful vote, report) = 20 / min then 2 minutes. `ThrottleSearch` = 30 / min then 1 minute. All three need designed 429 states.
- `POST /v1/gurman/ask` returns `available: false` with empty text when `ANTHROPIC_API_KEY` is unset — a normal 200, not an error. It needs its own designed state.

---

## File Structure

```
apps/android/
  settings.gradle.kts                     module include, repositories (incl. 2GIS artifactory)
  build.gradle.kts                        root, plugins declared apply-false
  gradle.properties                       jvmargs, AndroidX, non-transitive R
  gradle/libs.versions.toml               single source of truth for every version
  local.properties.example                documents required keys, committed
  app/build.gradle.kts                    android block, buildConfigFields, signing, R8
  app/proguard-rules.pro
  app/src/main/AndroidManifest.xml
  app/src/main/assets/dgissdk.key         gitignored, supplied per developer
  app/src/main/res/font/                  unbounded_*.ttf, ibm_plex_sans_*.ttf
  app/src/main/res/values/strings.xml     uz — default and fallback
  app/src/main/res/values-ru/strings.xml
  app/src/main/res/values-en/strings.xml
  app/src/main/res/xml/locales_config.xml
  app/src/main/java/com/manzil/consumer/
    ManzilApp.kt                          @HiltAndroidApp, Clerk + DGis init
    MainActivity.kt                       single activity, edge-to-edge, ManzilTheme
    core/design/Color.kt Type.kt Shape.kt Theme.kt
    core/ui/BusinessCard.kt TypographicCover.kt RatingRow.kt ManzilChip.kt
           StatPill.kt EmptyState.kt ErrorState.kt LoadingState.kt
    core/model/Business.kt Review.kt HomeFeed.kt PriceTier.kt ConciergeReply.kt
    core/result/ManzilResult.kt ManzilError.kt
    data/remote/ManzilApi.kt ApiEnvelope.kt AuthInterceptor.kt ErrorMapper.kt
    data/remote/dto/…                     one file per response group
    data/local/SavedStore.kt PrefsStore.kt
    data/repo/HomeRepository.kt SearchRepository.kt BusinessRepository.kt
              ReviewRepository.kt ConciergeRepository.kt AuthRepository.kt
    data/location/LocationProvider.kt
    di/NetworkModule.kt StoreModule.kt
    feature/home/HomeScreen.kt HomeViewModel.kt
    feature/search/SearchScreen.kt SearchViewModel.kt
    feature/detail/DetailScreen.kt DetailViewModel.kt
    feature/review/ReviewScreen.kt ReviewViewModel.kt
    feature/saved/SavedScreen.kt SavedViewModel.kt
    feature/concierge/ConciergeScreen.kt ConciergeViewModel.kt
    feature/profile/ProfileScreen.kt ProfileViewModel.kt
    feature/auth/AuthSheet.kt AuthViewModel.kt
    feature/map/MapScreen.kt
    nav/ManzilNavHost.kt Routes.kt
  app/src/test/java/com/manzil/consumer/  unit + contract tests
  app/src/test/resources/fixtures/        JSON captured from the live API
  app/src/androidTest/java/com/manzil/consumer/  Compose UI tests
```

---

## Task Sequence

| # | Task | Deliverable |
|---|---|---|
| 1 | Gradle scaffold and version catalog | App builds and installs |
| 2 | Design system | Themed, dark-mode-ready surface |
| 3 | Result and error model | `ManzilResult`/`ManzilError` with localised mapping |
| 4 | DTOs and Retrofit service | Typed API surface |
| 5 | Contract tests from live fixtures | DTO drift caught in CI |
| 6 | Repositories | Domain models, defensive filtering |
| 7 | DataStore | Saved slugs and preferences persist |
| 8 | Core UI components | Card, typographic cover, states |
| 9 | Clerk auth | Google + phone sign-in, token on requests |
| 10 | Navigation scaffold | Tabs, type-safe routes, deep links |
| 11 | Home screen | Live feed, three shapes |
| 12 | Search screen | Query, filters, distance sort |
| 13 | Business detail | Carousel, collapsing toolbar, visit ping |
| 14 | Review submission | Auth gate, 429 state |
| 15 | Saved screen | Device-local saves |
| 16 | Concierge | 429 and unavailable states |
| 17 | Profile | Locale switch, deletion, sign out |
| 18 | Location | Coarse permission, three states |
| 19 | 2GIS map | Map view and near-me |
| 20 | Localisation | uz/ru/en resources, per-app language |
| 21 | Play readiness | R8, baseline profile, Sentry, AAB |
| 22 | Retire the Expo prototype | Repo cleanup |

---

### Task 1: Gradle scaffold and version catalog

**Files:**
- Create: `apps/android/settings.gradle.kts`
- Create: `apps/android/build.gradle.kts`
- Create: `apps/android/gradle.properties`
- Create: `apps/android/gradle/libs.versions.toml`
- Create: `apps/android/local.properties.example`
- Create: `apps/android/app/build.gradle.kts`
- Create: `apps/android/app/src/main/AndroidManifest.xml`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/ManzilApp.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/MainActivity.kt`
- Modify: `.gitignore`
- Test: `apps/android/app/src/test/java/com/manzil/consumer/BuildConfigTest.kt`

**Interfaces:**
- Consumes: nothing.
- Produces: `ManzilApp` (`@HiltAndroidApp`), `MainActivity`, and `BuildConfig.API_BASE_URL: String`, `BuildConfig.CLERK_PUBLISHABLE_KEY: String` for every later task.

- [ ] **Step 1: Write the failing test**

`apps/android/app/src/test/java/com/manzil/consumer/BuildConfigTest.kt`:

```kotlin
package com.manzil.consumer

import org.junit.Assert.assertTrue
import org.junit.Test

class BuildConfigTest {
    @Test
    fun `api base url is configured and versioned`() {
        assertTrue(
            "API_BASE_URL must be absolute and end with /v1/",
            BuildConfig.API_BASE_URL.startsWith("http") && BuildConfig.API_BASE_URL.endsWith("/v1/")
        )
    }

    @Test
    fun `clerk publishable key is present and is a publishable key`() {
        assertTrue(
            "CLERK_PUBLISHABLE_KEY must start with pk_test_ or pk_live_",
            BuildConfig.CLERK_PUBLISHABLE_KEY.startsWith("pk_test_") ||
                BuildConfig.CLERK_PUBLISHABLE_KEY.startsWith("pk_live_")
        )
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest`
Expected: FAIL — no Gradle project exists yet.

- [ ] **Step 3: Create the version catalog**

`apps/android/gradle/libs.versions.toml`:

```toml
[versions]
agp = "9.2.0"
kotlin = "2.2.10"
ksp = "2.2.10-2.0.2"
composeBom = "2026.06.01"
activityCompose = "1.11.0"
lifecycle = "2.9.2"
navigation = "2.9.5"
hilt = "2.57"
hiltNavigation = "1.2.0"
retrofit = "2.11.0"
okhttp = "4.12.0"
serialization = "1.9.0"
retrofitSerialization = "1.0.0"
datastore = "1.1.7"
coil = "3.1.0"
dgis = "13.0.0"
playLocation = "21.3.0"
clerk = "1.0.0"
junit = "4.13.2"
turbine = "1.2.0"
coroutinesTest = "1.10.2"
mockwebserver = "4.12.0"
androidxTest = "1.6.1"

[libraries]
compose-bom = { module = "androidx.compose:compose-bom", version.ref = "composeBom" }
compose-ui = { module = "androidx.compose.ui:ui" }
compose-ui-tooling = { module = "androidx.compose.ui:ui-tooling" }
compose-ui-tooling-preview = { module = "androidx.compose.ui:ui-tooling-preview" }
compose-material3 = { module = "androidx.compose.material3:material3" }
compose-material-icons-extended = { module = "androidx.compose.material:material-icons-extended" }
compose-ui-test-junit4 = { module = "androidx.compose.ui:ui-test-junit4" }
compose-ui-test-manifest = { module = "androidx.compose.ui:ui-test-manifest" }
activity-compose = { module = "androidx.activity:activity-compose", version.ref = "activityCompose" }
lifecycle-runtime-compose = { module = "androidx.lifecycle:lifecycle-runtime-compose", version.ref = "lifecycle" }
lifecycle-viewmodel-compose = { module = "androidx.lifecycle:lifecycle-viewmodel-compose", version.ref = "lifecycle" }
navigation-compose = { module = "androidx.navigation:navigation-compose", version.ref = "navigation" }
hilt-android = { module = "com.google.dagger:hilt-android", version.ref = "hilt" }
hilt-compiler = { module = "com.google.dagger:hilt-android-compiler", version.ref = "hilt" }
hilt-navigation-compose = { module = "androidx.hilt:hilt-navigation-compose", version.ref = "hiltNavigation" }
retrofit = { module = "com.squareup.retrofit2:retrofit", version.ref = "retrofit" }
retrofit-serialization = { module = "com.jakewharton.retrofit:retrofit2-kotlinx-serialization-converter", version.ref = "retrofitSerialization" }
okhttp = { module = "com.squareup.okhttp3:okhttp", version.ref = "okhttp" }
okhttp-logging = { module = "com.squareup.okhttp3:logging-interceptor", version.ref = "okhttp" }
kotlinx-serialization-json = { module = "org.jetbrains.kotlinx:kotlinx-serialization-json", version.ref = "serialization" }
datastore-preferences = { module = "androidx.datastore:datastore-preferences", version.ref = "datastore" }
coil-compose = { module = "io.coil-kt.coil3:coil-compose", version.ref = "coil" }
coil-network-okhttp = { module = "io.coil-kt.coil3:coil-network-okhttp", version.ref = "coil" }
dgis-sdk-map = { module = "ru.dgis.sdk:sdk-map", version.ref = "dgis" }
dgis-compose-map = { module = "ru.dgis.sdk:compose-map", version.ref = "dgis" }
play-location = { module = "com.google.android.gms:play-services-location", version.ref = "playLocation" }
clerk-android-api = { module = "com.clerk:clerk-android-api", version.ref = "clerk" }
junit = { module = "junit:junit", version.ref = "junit" }
turbine = { module = "app.cash.turbine:turbine", version.ref = "turbine" }
coroutines-test = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-test", version.ref = "coroutinesTest" }
mockwebserver = { module = "com.squareup.okhttp3:mockwebserver", version.ref = "mockwebserver" }
androidx-test-runner = { module = "androidx.test:runner", version.ref = "androidxTest" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
kotlin-serialization = { id = "org.jetbrains.kotlin.plugin.serialization", version.ref = "kotlin" }
ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }
hilt = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }
```

> If Gradle reports any coordinate above as unresolvable, bump only that
> version to the newest stable release and keep `agp`/`kotlin`/`ksp` as a
> matching triple. Do not downgrade `compileSdk`/`targetSdk` below 36.

- [ ] **Step 4: Create the settings and root build files**

`apps/android/settings.gradle.kts`:

```kotlin
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        // 2GIS Mobile SDK is not published to Maven Central.
        maven { url = uri("https://artifactory.2gis.dev/sdk-maven-release") }
    }
}

rootProject.name = "manzil-android"
include(":app")
```

`apps/android/build.gradle.kts`:

```kotlin
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.kotlin.serialization) apply false
    alias(libs.plugins.ksp) apply false
    alias(libs.plugins.hilt) apply false
}
```

`apps/android/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g
org.gradle.parallel=true
org.gradle.caching=true
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
```

- [ ] **Step 5: Create the app build file**

`apps/android/app/build.gradle.kts`:

```kotlin
import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt)
}

// Secrets live outside version control. local.properties.example documents them.
val localProps = Properties().apply {
    val file = rootProject.file("local.properties")
    if (file.exists()) file.inputStream().use { load(it) }
}
fun secret(key: String, fallback: String): String =
    (localProps.getProperty(key) ?: System.getenv(key) ?: fallback)

android {
    namespace = "com.manzil.consumer"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.manzil.consumer"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        resourceConfigurations += listOf("uz", "ru", "en")
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            buildConfigField(
                "String", "API_BASE_URL",
                "\"${secret("API_BASE_URL_DEBUG", "https://api.manzil.uz/v1/")}\""
            )
            buildConfigField(
                "String", "CLERK_PUBLISHABLE_KEY",
                "\"${secret("CLERK_PUBLISHABLE_KEY_DEBUG", "pk_test_placeholder")}\""
            )
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            buildConfigField(
                "String", "API_BASE_URL",
                "\"${secret("API_BASE_URL_RELEASE", "https://api.manzil.uz/v1/")}\""
            )
            buildConfigField(
                "String", "CLERK_PUBLISHABLE_KEY",
                "\"${secret("CLERK_PUBLISHABLE_KEY_RELEASE", "pk_live_placeholder")}\""
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlin { jvmToolchain(17) }

    testOptions {
        unitTests.isReturnDefaultValues = true
    }

    packaging {
        resources.excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
}

dependencies {
    implementation(platform(libs.compose.bom))
    androidTestImplementation(platform(libs.compose.bom))

    implementation(libs.compose.ui)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.compose.material3)
    implementation(libs.compose.material.icons.extended)
    implementation(libs.activity.compose)
    implementation(libs.lifecycle.runtime.compose)
    implementation(libs.lifecycle.viewmodel.compose)
    implementation(libs.navigation.compose)

    implementation(libs.hilt.android)
    implementation(libs.hilt.navigation.compose)
    ksp(libs.hilt.compiler)

    implementation(libs.retrofit)
    implementation(libs.retrofit.serialization)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.datastore.preferences)
    implementation(libs.coil.compose)
    implementation(libs.coil.network.okhttp)

    debugImplementation(libs.compose.ui.tooling)
    debugImplementation(libs.compose.ui.test.manifest)

    testImplementation(libs.junit)
    testImplementation(libs.turbine)
    testImplementation(libs.coroutines.test)
    testImplementation(libs.mockwebserver)

    androidTestImplementation(libs.compose.ui.test.junit4)
    androidTestImplementation(libs.androidx.test.runner)
}
```

`apps/android/local.properties.example` (committed; `local.properties` is not):

```properties
# Copy to local.properties and fill in. Never commit local.properties.
sdk.dir=/path/to/Android/sdk
API_BASE_URL_DEBUG=https://api.manzil.uz/v1/
API_BASE_URL_RELEASE=https://api.manzil.uz/v1/
CLERK_PUBLISHABLE_KEY_DEBUG=pk_test_xxx
CLERK_PUBLISHABLE_KEY_RELEASE=pk_live_xxx
```

- [ ] **Step 6: Create the manifest, Application and Activity**

`apps/android/app/src/main/AndroidManifest.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:name=".ManzilApp"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="false"
        android:theme="@style/Theme.Manzil">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize"
            android:theme="@style/Theme.Manzil">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

`ManzilApp.kt`:

```kotlin
package com.manzil.consumer

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class ManzilApp : Application()
```

`MainActivity.kt`:

```kotlin
package com.manzil.consumer

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MaterialTheme {
                Surface { Text("Manzil") }
            }
        }
    }
}
```

Add a placeholder `res/values/strings.xml` with `<string name="app_name">Manzil</string>` and a `res/values/themes.xml` declaring `Theme.Manzil` as a child of `android:Theme.Material.Light.NoActionBar`. Copy the adaptive icon assets from `apps/mobile/assets/` into `res/mipmap-anydpi-v26/` as `ic_launcher`.

- [ ] **Step 7: Ignore secrets**

Append to the repo-root `.gitignore`:

```gitignore
# Android
apps/android/local.properties
apps/android/.gradle/
apps/android/build/
apps/android/app/build/
apps/android/app/src/main/assets/dgissdk.key
*.jks
*.keystore
!apps/mobile/android/app/debug.keystore
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest`
Expected: PASS — both assertions hold against the placeholder values.

Run: `cd apps/android && ./gradlew :app:assembleDebug`
Expected: BUILD SUCCESSFUL.

- [ ] **Step 9: Commit**

```bash
git add apps/android .gitignore
git commit -m "feat(android): gradle scaffold, version catalog and app shell"
```

---

### Task 2: Design system

**Files:**
- Create: `apps/android/app/src/main/java/com/manzil/consumer/core/design/Color.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/core/design/Type.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/core/design/Shape.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/core/design/Theme.kt`
- Create: `apps/android/app/src/main/res/font/` (Unbounded + IBM Plex Sans `.ttf`)
- Modify: `apps/android/app/src/main/java/com/manzil/consumer/MainActivity.kt`
- Test: `apps/android/app/src/test/java/com/manzil/consumer/core/design/ColorContrastTest.kt`

**Interfaces:**
- Consumes: Task 1's module.
- Produces: `ManzilTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit)`, the `ManzilColors` object, and `ManzilTypography` — every screen wraps in `ManzilTheme` and reads colour via `MaterialTheme.colorScheme` and type via `MaterialTheme.typography`.

- [ ] **Step 1: Write the failing test**

`ColorContrastTest.kt`:

```kotlin
package com.manzil.consumer.core.design

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.max
import kotlin.math.min

class ColorContrastTest {

    private fun contrast(a: Color, b: Color): Double {
        val la = a.luminance() + 0.05
        val lb = b.luminance() + 0.05
        return max(la, lb) / min(la, lb).toDouble()
    }

    @Test
    fun `body text on light background meets WCAG AA`() {
        assertTrue(contrast(ManzilColors.Ink, ManzilColors.Background) >= 4.5)
    }

    @Test
    fun `muted text on light background meets WCAG AA`() {
        assertTrue(contrast(ManzilColors.Muted, ManzilColors.Background) >= 4.5)
    }

    @Test
    fun `white text on primary teal meets WCAG AA`() {
        assertTrue(contrast(Color.White, ManzilColors.Primary) >= 4.5)
    }

    @Test
    fun `ink on gold meets WCAG AA so the gold CTA is readable`() {
        assertTrue(contrast(ManzilColors.Ink, ManzilColors.Gold) >= 4.5)
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*ColorContrastTest'`
Expected: FAIL — `ManzilColors` is unresolved.

- [ ] **Step 3: Write Color.kt**

```kotlin
package com.manzil.consumer.core.design

import androidx.compose.ui.graphics.Color

/** Brand constants. Never read these directly in a screen — go through MaterialTheme.colorScheme. */
object ManzilColors {
    val Ink = Color(0xFF1A1C1B)
    val Muted = Color(0xFF3E4948)
    val Subtle = Color(0xFF6E7979)
    val Background = Color(0xFFF9F9F7)
    val Surface = Color(0xFFFFFFFF)
    val SurfaceSoft = Color(0xFFF4F4F2)
    val SurfaceHigh = Color(0xFFE8E8E6)
    val Outline = Color(0xFFBEC9C8)
    val Primary = Color(0xFF005454)
    val PrimarySoft = Color(0xFFA1F0EF)
    val PrimaryContainer = Color(0xFF0F6E6E)
    val PrimaryDark = Color(0xFF002020)
    val Gold = Color(0xFFFEB300)
    val GoldSoft = Color(0xFFFFDEAC)
    val Danger = Color(0xFFBA1A1A)
    val Success = Color(0xFF0F6E4B)

    // Dark theme surfaces, derived from PrimaryDark rather than neutral grey so
    // the identity survives the theme switch.
    val DarkBackground = Color(0xFF0E1413)
    val DarkSurface = Color(0xFF161D1C)
    val DarkSurfaceSoft = Color(0xFF1E2625)
    val DarkOutline = Color(0xFF3E4948)
    val DarkInk = Color(0xFFEFF1F0)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*ColorContrastTest'`
Expected: PASS on all four.

If `ink on gold` fails, darken `Gold` toward `#E6A200` for text-bearing surfaces only and keep `#FEB300` for the rating glyph; re-run. Record whichever value ships.

- [ ] **Step 5: Add the fonts**

Download the static `.ttf` files (SIL Open Font License, redistribution permitted) and place them in `res/font/` with Android's lowercase-underscore naming:

- `unbounded_regular.ttf`, `unbounded_medium.ttf`, `unbounded_bold.ttf`, `unbounded_extrabold.ttf` — from https://github.com/google/fonts/tree/main/ofl/unbounded
- `ibm_plex_sans_regular.ttf`, `ibm_plex_sans_medium.ttf`, `ibm_plex_sans_semibold.ttf`, `ibm_plex_sans_bold.ttf` — from https://github.com/google/fonts/tree/main/ofl/ibmplexsans

Copy each family's `OFL.txt` to `res/raw/oflunbounded.txt` and `res/raw/oflibmplexsans.txt` — the licence requires the notice to ship with the software, and Task 17 surfaces them in an "Open source licences" row.

Verify Cyrillic before proceeding: open each `.ttf` and confirm `А-Я`, `а-я`, `Ў`, `Қ`, `Ғ`, `Ҳ` render. If any glyph is missing, stop and report — the whole type decision depends on this.

- [ ] **Step 6: Write Type.kt and Shape.kt**

`Type.kt`:

```kotlin
package com.manzil.consumer.core.design

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.manzil.consumer.R

val Unbounded = FontFamily(
    Font(R.font.unbounded_regular, FontWeight.Normal),
    Font(R.font.unbounded_medium, FontWeight.Medium),
    Font(R.font.unbounded_bold, FontWeight.Bold),
    Font(R.font.unbounded_extrabold, FontWeight.ExtraBold),
)

val PlexSans = FontFamily(
    Font(R.font.ibm_plex_sans_regular, FontWeight.Normal),
    Font(R.font.ibm_plex_sans_medium, FontWeight.Medium),
    Font(R.font.ibm_plex_sans_semibold, FontWeight.SemiBold),
    Font(R.font.ibm_plex_sans_bold, FontWeight.Bold),
)

/**
 * Display roles use Unbounded; everything else uses IBM Plex Sans. Line heights
 * are generous because Uzbek Latin and Russian Cyrillic both run longer than
 * English and wrap more often.
 */
val ManzilTypography = Typography(
    displayLarge = TextStyle(Unbounded, FontWeight.ExtraBold, 40.sp, lineHeight = 44.sp),
    displayMedium = TextStyle(Unbounded, FontWeight.Bold, 32.sp, lineHeight = 38.sp),
    displaySmall = TextStyle(Unbounded, FontWeight.Bold, 26.sp, lineHeight = 32.sp),
    headlineMedium = TextStyle(Unbounded, FontWeight.Bold, 22.sp, lineHeight = 28.sp),
    headlineSmall = TextStyle(Unbounded, FontWeight.Medium, 19.sp, lineHeight = 25.sp),
    titleLarge = TextStyle(PlexSans, FontWeight.SemiBold, 18.sp, lineHeight = 24.sp),
    titleMedium = TextStyle(PlexSans, FontWeight.SemiBold, 16.sp, lineHeight = 22.sp),
    bodyLarge = TextStyle(PlexSans, FontWeight.Normal, 15.sp, lineHeight = 22.sp),
    bodyMedium = TextStyle(PlexSans, FontWeight.Normal, 14.sp, lineHeight = 20.sp),
    labelLarge = TextStyle(PlexSans, FontWeight.SemiBold, 14.sp, lineHeight = 18.sp),
    labelMedium = TextStyle(PlexSans, FontWeight.Medium, 12.sp, lineHeight = 16.sp),
)

private fun TextStyle(
    family: FontFamily,
    weight: FontWeight,
    size: androidx.compose.ui.unit.TextUnit,
    lineHeight: androidx.compose.ui.unit.TextUnit,
) = TextStyle(fontFamily = family, fontWeight = weight, fontSize = size, lineHeight = lineHeight)
```

`Shape.kt`:

```kotlin
package com.manzil.consumer.core.design

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

val ManzilShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(20.dp),
    extraLarge = RoundedCornerShape(28.dp),
)

val PillShape = RoundedCornerShape(percent = 50)
```

- [ ] **Step 7: Write Theme.kt**

```kotlin
package com.manzil.consumer.core.design

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightScheme = lightColorScheme(
    primary = ManzilColors.Primary,
    onPrimary = Color.White,
    primaryContainer = ManzilColors.PrimaryContainer,
    onPrimaryContainer = ManzilColors.PrimarySoft,
    secondary = ManzilColors.Gold,
    onSecondary = ManzilColors.Ink,
    secondaryContainer = ManzilColors.GoldSoft,
    onSecondaryContainer = ManzilColors.Ink,
    background = ManzilColors.Background,
    onBackground = ManzilColors.Ink,
    surface = ManzilColors.Surface,
    onSurface = ManzilColors.Ink,
    surfaceVariant = ManzilColors.SurfaceSoft,
    onSurfaceVariant = ManzilColors.Muted,
    surfaceContainerHigh = ManzilColors.SurfaceHigh,
    outline = ManzilColors.Outline,
    error = ManzilColors.Danger,
    onError = Color.White,
)

private val DarkScheme = darkColorScheme(
    primary = ManzilColors.PrimarySoft,
    onPrimary = ManzilColors.PrimaryDark,
    primaryContainer = ManzilColors.PrimaryContainer,
    onPrimaryContainer = ManzilColors.PrimarySoft,
    secondary = ManzilColors.Gold,
    onSecondary = ManzilColors.Ink,
    secondaryContainer = Color(0xFF4A3400),
    onSecondaryContainer = ManzilColors.GoldSoft,
    background = ManzilColors.DarkBackground,
    onBackground = ManzilColors.DarkInk,
    surface = ManzilColors.DarkSurface,
    onSurface = ManzilColors.DarkInk,
    surfaceVariant = ManzilColors.DarkSurfaceSoft,
    onSurfaceVariant = Color(0xFFBFC9C7),
    surfaceContainerHigh = ManzilColors.DarkSurfaceSoft,
    outline = ManzilColors.DarkOutline,
    error = Color(0xFFFFB4AB),
    onError = Color(0xFF690005),
)

/**
 * Dynamic colour is deliberately absent. Wallpaper-derived palettes would
 * replace the teal/gold identity, which is the app's only visual differentiator
 * in a category of generic directory apps.
 */
@Composable
fun ManzilTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkScheme else LightScheme,
        typography = ManzilTypography,
        shapes = ManzilShapes,
        content = content,
    )
}
```

- [ ] **Step 8: Use the theme in MainActivity**

Replace `MaterialTheme { … }` in `MainActivity.onCreate` with `ManzilTheme { Surface(color = MaterialTheme.colorScheme.background) { Text("Manzil") } }` and import `com.manzil.consumer.core.design.ManzilTheme`.

- [ ] **Step 9: Run tests and build**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest :app:assembleDebug`
Expected: PASS and BUILD SUCCESSFUL.

- [ ] **Step 10: Commit**

```bash
git add apps/android/app/src/main/java/com/manzil/consumer/core/design \
        apps/android/app/src/main/res/font apps/android/app/src/main/res/raw \
        apps/android/app/src/test/java/com/manzil/consumer/core/design \
        apps/android/app/src/main/java/com/manzil/consumer/MainActivity.kt
git commit -m "feat(android): brand design system with Unbounded and IBM Plex Sans"
```

---

### Task 3: Result and error model

**Files:**
- Create: `apps/android/app/src/main/java/com/manzil/consumer/core/result/ManzilResult.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/core/result/ManzilError.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/data/remote/ErrorMapper.kt`
- Modify: `apps/android/app/src/main/res/values/strings.xml`
- Test: `apps/android/app/src/test/java/com/manzil/consumer/data/remote/ErrorMapperTest.kt`

**Interfaces:**
- Consumes: Task 1.
- Produces: `ManzilResult<T>` (`Success`/`Failure`), `ManzilError` (`Network`, `RateLimited`, `Unauthorized`, `NotFound`, `Server`, `Unknown`), `ManzilError.messageRes: Int`, and `suspend fun <T> apiCall(block: suspend () -> T): ManzilResult<T>` — every repository in Task 6 wraps its calls in `apiCall`.

- [ ] **Step 1: Write the failing test**

`ErrorMapperTest.kt`:

```kotlin
package com.manzil.consumer.data.remote

import com.manzil.consumer.core.result.ManzilError
import com.manzil.consumer.core.result.ManzilResult
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import retrofit2.HttpException
import retrofit2.Response
import java.io.IOException

class ErrorMapperTest {

    private fun http(code: Int, headers: Map<String, String> = emptyMap()): HttpException {
        val builder = okhttp3.Response.Builder()
            .code(code)
            .message("error")
            .protocol(okhttp3.Protocol.HTTP_1_1)
            .request(okhttp3.Request.Builder().url("https://api.manzil.uz/v1/home").build())
        headers.forEach { (k, v) -> builder.header(k, v) }
        val raw = builder.build()
        return HttpException(Response.error<Any>("{}".toResponseBody("application/json".toMediaType()), raw))
    }

    @Test
    fun `success wraps the value`() = runTest {
        val result = apiCall { 42 }
        assertEquals(ManzilResult.Success(42), result)
    }

    @Test
    fun `io failure maps to Network`() = runTest {
        val result = apiCall<Int> { throw IOException("offline") }
        assertEquals(ManzilError.Network, (result as ManzilResult.Failure).error)
    }

    @Test
    fun `429 maps to RateLimited and reads Retry-After seconds into minutes`() = runTest {
        val result = apiCall<Int> { throw http(429, mapOf("Retry-After" to "1800")) }
        assertEquals(ManzilError.RateLimited(retryAfterMinutes = 30), (result as ManzilResult.Failure).error)
    }

    @Test
    fun `429 without Retry-After still maps to RateLimited with null minutes`() = runTest {
        val result = apiCall<Int> { throw http(429) }
        assertEquals(ManzilError.RateLimited(retryAfterMinutes = null), (result as ManzilResult.Failure).error)
    }

    @Test
    fun `401 maps to Unauthorized and 404 to NotFound`() = runTest {
        assertEquals(ManzilError.Unauthorized, (apiCall<Int> { throw http(401) } as ManzilResult.Failure).error)
        assertEquals(ManzilError.NotFound, (apiCall<Int> { throw http(404) } as ManzilResult.Failure).error)
    }

    @Test
    fun `5xx maps to Server carrying the code`() = runTest {
        assertEquals(ManzilError.Server(503), (apiCall<Int> { throw http(503) } as ManzilResult.Failure).error)
    }

    @Test
    fun `every error exposes a localised message resource`() {
        val errors = listOf(
            ManzilError.Network,
            ManzilError.RateLimited(30),
            ManzilError.RateLimited(null),
            ManzilError.Unauthorized,
            ManzilError.NotFound,
            ManzilError.Server(500),
            ManzilError.Unknown,
        )
        assertTrue(errors.all { it.messageRes != 0 })
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*ErrorMapperTest'`
Expected: FAIL — `ManzilResult`, `ManzilError` and `apiCall` are unresolved.

- [ ] **Step 3: Write ManzilResult.kt and ManzilError.kt**

`ManzilResult.kt`:

```kotlin
package com.manzil.consumer.core.result

sealed interface ManzilResult<out T> {
    data class Success<T>(val data: T) : ManzilResult<T>
    data class Failure(val error: ManzilError) : ManzilResult<Nothing>
}

inline fun <T, R> ManzilResult<T>.map(transform: (T) -> R): ManzilResult<R> = when (this) {
    is ManzilResult.Success -> ManzilResult.Success(transform(data))
    is ManzilResult.Failure -> this
}

fun <T> ManzilResult<T>.getOrNull(): T? = (this as? ManzilResult.Success)?.data
```

`ManzilError.kt`:

```kotlin
package com.manzil.consumer.core.result

import androidx.annotation.StringRes
import com.manzil.consumer.R

/**
 * A closed set, deliberately. Server error text is never shown to the user:
 * the API answers in one language and the app runs in three, so the client
 * owns the copy and the server only supplies the category.
 */
sealed interface ManzilError {
    @get:StringRes val messageRes: Int

    data object Network : ManzilError {
        override val messageRes = R.string.error_network
    }

    /** 429. `retryAfterMinutes` is null when the server sends no Retry-After header. */
    data class RateLimited(val retryAfterMinutes: Int?) : ManzilError {
        override val messageRes =
            if (retryAfterMinutes != null) R.string.error_rate_limited_minutes
            else R.string.error_rate_limited
    }

    data object Unauthorized : ManzilError {
        override val messageRes = R.string.error_unauthorized
    }

    data object NotFound : ManzilError {
        override val messageRes = R.string.error_not_found
    }

    data class Server(val code: Int) : ManzilError {
        override val messageRes = R.string.error_server
    }

    data object Unknown : ManzilError {
        override val messageRes = R.string.error_unknown
    }
}
```

- [ ] **Step 4: Write ErrorMapper.kt**

```kotlin
package com.manzil.consumer.data.remote

import com.manzil.consumer.core.result.ManzilError
import com.manzil.consumer.core.result.ManzilResult
import retrofit2.HttpException
import java.io.IOException
import kotlin.math.ceil

/**
 * The single funnel from Retrofit to the domain. Repositories never see an
 * exception, so no screen can accidentally render a stack trace or an
 * untranslated server string.
 */
suspend fun <T> apiCall(block: suspend () -> T): ManzilResult<T> =
    try {
        ManzilResult.Success(block())
    } catch (e: IOException) {
        ManzilResult.Failure(ManzilError.Network)
    } catch (e: HttpException) {
        ManzilResult.Failure(e.toManzilError())
    } catch (e: Exception) {
        ManzilResult.Failure(ManzilError.Unknown)
    }

private fun HttpException.toManzilError(): ManzilError = when (code()) {
    401, 403 -> ManzilError.Unauthorized
    404 -> ManzilError.NotFound
    429 -> ManzilError.RateLimited(retryAfterMinutes = retryAfterMinutes())
    in 500..599 -> ManzilError.Server(code())
    else -> ManzilError.Unknown
}

/** NestJS Throttler sends Retry-After in seconds; the UI speaks minutes. */
private fun HttpException.retryAfterMinutes(): Int? =
    response()?.headers()?.get("Retry-After")
        ?.toIntOrNull()
        ?.let { seconds -> ceil(seconds / 60.0).toInt().coerceAtLeast(1) }
```

- [ ] **Step 5: Add the error strings**

Append to `res/values/strings.xml` (Uzbek — the default):

```xml
<string name="error_network">Internet aloqasi yo\'q. Ulanishni tekshiring va qayta urinib ko\'ring.</string>
<string name="error_rate_limited">Juda ko\'p so\'rov yuborildi. Biroz kutib, qayta urinib ko\'ring.</string>
<string name="error_rate_limited_minutes">Juda ko\'p so\'rov yuborildi. %1$d daqiqadan so\'ng qayta urinib ko\'ring.</string>
<string name="error_unauthorized">Bu amal uchun tizimga kirish kerak.</string>
<string name="error_not_found">Topilmadi.</string>
<string name="error_server">Serverda xatolik. Biroz o\'tib qayta urinib ko\'ring.</string>
<string name="error_unknown">Nimadir noto\'g\'ri ketdi.</string>
```

Russian and English overlays land in Task 20.

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*ErrorMapperTest'`
Expected: PASS — all seven.

- [ ] **Step 7: Commit**

```bash
git add apps/android/app/src/main/java/com/manzil/consumer/core/result \
        apps/android/app/src/main/java/com/manzil/consumer/data/remote \
        apps/android/app/src/main/res/values/strings.xml \
        apps/android/app/src/test/java/com/manzil/consumer/data/remote
git commit -m "feat(android): result and error model with localised messages"
```

---

### Task 4: DTOs and Retrofit service

**Files:**
- Create: `apps/android/app/src/main/java/com/manzil/consumer/data/remote/ApiEnvelope.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/data/remote/dto/HomeDto.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/data/remote/dto/BusinessDto.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/data/remote/dto/ReviewDto.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/data/remote/dto/MediaDto.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/data/remote/dto/ConciergeDto.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/data/remote/dto/AuthDto.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/data/remote/ManzilApi.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/di/NetworkModule.kt`
- Test: `apps/android/app/src/test/java/com/manzil/consumer/data/remote/ManzilApiTest.kt`

**Interfaces:**
- Consumes: Task 3's `apiCall`, Task 1's `BuildConfig.API_BASE_URL`.
- Produces: `ManzilApi` (Retrofit interface, injected everywhere), `ApiEnvelope<T>`, and every DTO named below. Task 6's repositories map these to domain models. **DTO property names must match the JSON exactly** — the shapes below were read off `apps/api` source on 2026-08-03, not guessed.

- [ ] **Step 1: Write the failing test**

`ManzilApiTest.kt`:

```kotlin
package com.manzil.consumer.data.remote

import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

class ManzilApiTest {

    private lateinit var server: MockWebServer
    private lateinit var api: ManzilApi

    private val json = Json { ignoreUnknownKeys = true; explicitNulls = false }

    @Before
    fun setUp() {
        server = MockWebServer().apply { start() }
        api = Retrofit.Builder()
            .baseUrl(server.url("/v1/"))
            .client(OkHttpClient())
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(ManzilApi::class.java)
    }

    @After
    fun tearDown() = server.shutdown()

    @Test
    fun `home feed parses cards with null priceTier and no coordinates`() = runTest {
        server.enqueue(MockResponse().setBody("""
            {"data":{"justJoined":[{"slug":"chorsu-choyxona","name":"Chorsu Choyxona",
            "district":"Shayxontohur","city":"Tashkent","priceTier":null,"avgRating":4.6,
            "reviewCount":12,"claimedAt":"2026-07-29T10:00:00.000Z","featured":false,
            "category":{"slug":"cafe","nameUz":"Kafe","nameRu":"Кафе","nameEn":"Cafe"}}],
            "featured":[],"categories":[{"slug":"cafe","nameUz":"Kafe","nameRu":"Кафе",
            "nameEn":"Cafe","businessCount":3}],"totalBusinesses":1}}
        """.trimIndent()))

        val feed = api.getHomeFeed("uz").data

        assertEquals(1, feed.justJoined.size)
        assertEquals("Chorsu Choyxona", feed.justJoined[0].name)
        assertNull(feed.justJoined[0].priceTier)
        assertEquals("Кафе", feed.justJoined[0].category.nameRu)
        assertEquals(3, feed.categories[0].businessCount)
        assertEquals(1, feed.totalBusinesses)
    }

    @Test
    fun `search parses businesses with coordinates and localised description`() = runTest {
        server.enqueue(MockResponse().setBody("""
            {"data":{"businesses":[{"id":"b1","slug":"chorsu-choyxona","name":"Chorsu Choyxona",
            "categorySlug":"cafe","description":{"uz":"Choyxona","ru":"Чайхана","en":"Teahouse"},
            "address":"Navoi 1","district":"Shayxontohur","city":"Tashkent","phone":"+998901234567",
            "lat":41.3264,"lng":69.2285,"hours":"09:00-23:00","priceTier":"$$","status":"claimed",
            "avgRating":4.6,"reviewCount":12,"photo":"business","tags":["Shayxontohur","Kafe"],
            "foundingBusiness":true}],"categories":[{"id":"c1","slug":"cafe",
            "name":{"uz":"Kafe","ru":"Кафе","en":"Cafe"}}]}}
        """.trimIndent()))

        val result = api.search(query = "choy", category = "all").data

        assertEquals(41.3264, result.businesses[0].lat!!, 0.0001)
        assertEquals("Чайхана", result.businesses[0].description.ru)
        assertEquals("$$", result.businesses[0].priceTier)
        assertEquals("claimed", result.businesses[0].status)
    }

    @Test
    fun `business detail parses reviews including an optional owner reply`() = runTest {
        server.enqueue(MockResponse().setBody("""
            {"data":{"business":{"id":"b1","slug":"s","name":"N","categorySlug":"cafe",
            "description":{"uz":"u","ru":"r","en":"e"},"address":"A","district":"D","city":"Tashkent",
            "hours":"09:00-23:00","priceTier":"$$","status":"claimed","avgRating":5.0,"reviewCount":1,
            "photo":"business","tags":[],"foundingBusiness":true},
            "reviews":[{"id":"r1","businessSlug":"s","authorName":"Aziz","rating":5,"text":"Zo'r",
            "locale":"uz","createdAt":"2026-07-30T10:00:00.000Z","helpfulCount":2,
            "verifiedVisit":true,"reply":{"id":"rp1","reviewId":"r1","businessOwnerId":"u1",
            "text":"Rahmat","createdAt":"2026-07-31T10:00:00.000Z",
            "updatedAt":"2026-07-31T10:00:00.000Z"}}]}}
        """.trimIndent()))

        val detail = api.getBusiness("s").data

        assertEquals(1, detail.reviews.size)
        assertEquals(true, detail.reviews[0].verifiedVisit)
        assertEquals("Rahmat", detail.reviews[0].reply!!.text)
        assertNull(detail.business.phone)
    }

    @Test
    fun `covers parse as a slug to url map and absent slugs are simply missing`() = runTest {
        server.enqueue(MockResponse().setBody(
            """{"data":{"covers":{"chorsu-choyxona":"https://cdn/x.jpg"}}}"""
        ))

        val covers = api.getBusinessCovers("chorsu-choyxona,missing-one").data.covers

        assertEquals("https://cdn/x.jpg", covers["chorsu-choyxona"])
        assertNull(covers["missing-one"])
    }

    @Test
    fun `concierge parses the unavailable result as a normal 200`() = runTest {
        server.enqueue(MockResponse().setBody(
            """{"data":{"text":"","businesses":[],"available":false}}"""
        ))

        val reply = api.askConcierge(ConciergeRequest(query = "plov", locale = "uz")).data

        assertEquals(false, reply.available)
        assertEquals(0, reply.businesses.size)
    }

    @Test
    fun `helpful toggle parses the new count and vote state`() = runTest {
        server.enqueue(MockResponse().setBody(
            """{"data":{"reviewId":"r1","helpfulCount":3,"voted":true}}"""
        ))

        val vote = api.toggleHelpful("r1").data

        assertEquals(3, vote.helpfulCount)
        assertEquals(true, vote.voted)
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*ManzilApiTest'`
Expected: FAIL — `ManzilApi` and the DTOs are unresolved.

- [ ] **Step 3: Write the envelope**

`ApiEnvelope.kt`:

```kotlin
package com.manzil.consumer.data.remote

import kotlinx.serialization.Serializable

/** Every Manzil endpoint wraps its payload in `{ "data": … }`. */
@Serializable
data class ApiEnvelope<T>(val `data`: T)
```

- [ ] **Step 4: Write the DTOs**

`dto/HomeDto.kt`:

```kotlin
package com.manzil.consumer.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class HomeFeedDto(
    val justJoined: List<HomeCardDto> = emptyList(),
    val featured: List<HomeCardDto> = emptyList(),
    val categories: List<CategoryCountDto> = emptyList(),
    val totalBusinesses: Int = 0,
)

/**
 * Home cards are NOT the same shape as search results:
 *  - no `lat`/`lng` (HomeRepository.mapCard omits them — Workstream B adds them),
 *  - `priceTier` is the raw database value, so it may be "budget"/"premium"/
 *    "luxury"/"$"/"$$"/"$$$"/null rather than the normalised tier that
 *    `/v1/search` returns.
 * Both are reconciled by PriceTier.fromRaw in Task 6.
 */
@Serializable
data class HomeCardDto(
    val slug: String,
    val name: String,
    val district: String,
    val city: String,
    val priceTier: String? = null,
    val avgRating: Double = 0.0,
    val reviewCount: Int = 0,
    val claimedAt: String? = null,
    val featured: Boolean = false,
    val category: CategoryNameDto,
)

@Serializable
data class CategoryNameDto(
    val slug: String,
    val nameUz: String,
    val nameRu: String,
    val nameEn: String,
)

@Serializable
data class CategoryCountDto(
    val slug: String,
    val nameUz: String,
    val nameRu: String,
    val nameEn: String,
    val businessCount: Int = 0,
)
```

`dto/BusinessDto.kt`:

```kotlin
package com.manzil.consumer.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class LocalizedTextDto(
    val uz: String = "",
    val ru: String = "",
    val en: String = "",
)

@Serializable
data class BusinessDto(
    val id: String,
    val slug: String,
    val name: String,
    val categorySlug: String,
    val description: LocalizedTextDto = LocalizedTextDto(),
    val address: String = "",
    val district: String = "",
    val city: String = "Tashkent",
    val phone: String? = null,
    val lat: Double? = null,
    val lng: Double? = null,
    /** Already flattened to a display string by the API's formatHours(). */
    val hours: String = "",
    /** Normalised to "$", "$$" or "$$$" by /v1/search and /v1/businesses/:slug. */
    val priceTier: String? = null,
    /** "claimed" | "pending_claim" | "unclaimed" — the client filters on this. */
    val status: String = "",
    val avgRating: Double = 0.0,
    val reviewCount: Int = 0,
    val tags: List<String> = emptyList(),
    val website: String? = null,
    val instagram: String? = null,
    val telegram: String? = null,
)

@Serializable
data class CategoryDto(
    val id: String,
    val slug: String,
    val name: LocalizedTextDto = LocalizedTextDto(),
    val parentId: String? = null,
)

@Serializable
data class SearchResultDto(
    val businesses: List<BusinessDto> = emptyList(),
    val categories: List<CategoryDto> = emptyList(),
)

@Serializable
data class BusinessDetailDto(
    val business: BusinessDto,
    val reviews: List<ReviewDto> = emptyList(),
)
```

`dto/ReviewDto.kt`:

```kotlin
package com.manzil.consumer.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class ReviewDto(
    val id: String,
    val businessSlug: String = "",
    val authorName: String = "",
    val authorBadge: String? = null,
    val rating: Int = 0,
    val text: String = "",
    val locale: String = "uz",
    val createdAt: String = "",
    val helpfulCount: Int = 0,
    /** True only when the review is linked to a completed booking. */
    val verifiedVisit: Boolean = false,
    val reply: ReviewReplyDto? = null,
)

@Serializable
data class ReviewReplyDto(
    val id: String,
    val reviewId: String,
    val businessOwnerId: String,
    val text: String,
    val createdAt: String,
    val updatedAt: String,
)

@Serializable
data class CreateReviewRequest(val rating: Int, val text: String)

@Serializable
data class CreateReviewResponse(val review: ReviewDto)

@Serializable
data class HelpfulVoteDto(
    val reviewId: String,
    val helpfulCount: Int,
    val voted: Boolean,
)

@Serializable
data class ReportReviewRequest(val reason: String)
```

`dto/MediaDto.kt`:

```kotlin
package com.manzil.consumer.data.remote.dto

import kotlinx.serialization.Serializable

/** Slugs with no approved cover are absent from the map, not null-valued. */
@Serializable
data class CoversDto(val covers: Map<String, String> = emptyMap())

@Serializable
data class PhotosDto(val photos: List<PhotoDto> = emptyList())

@Serializable
data class PhotoDto(
    val id: String,
    val publicUrl: String? = null,
    val isCover: Boolean = false,
)
```

`dto/ConciergeDto.kt`:

```kotlin
package com.manzil.consumer.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class ConciergeRequest(val query: String, val locale: String)

/**
 * `available = false` arrives as a normal 200 when ANTHROPIC_API_KEY is unset
 * or the model call failed. It is a designed state, not an error.
 */
@Serializable
data class ConciergeReplyDto(
    val text: String = "",
    val businesses: List<ConciergeSuggestionDto> = emptyList(),
    val available: Boolean = false,
)

@Serializable
data class ConciergeSuggestionDto(
    val businessId: String,
    val slug: String,
    val name: String,
    val reason: String,
)
```

`dto/AuthDto.kt`:

```kotlin
package com.manzil.consumer.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class AuthUserDto(
    val id: String,
    val email: String? = null,
    val displayName: String = "",
    val locale: String = "uz",
    val role: String = "consumer",
)

/** GET /v1/auth/me wraps the user one level deeper than POST /v1/auth/sync does. */
@Serializable
data class MeDto(val user: AuthUserDto? = null)

@Serializable
data class SyncUserRequest(
    val displayName: String? = null,
    val locale: String? = null,
)
```

- [ ] **Step 5: Write the Retrofit interface**

`ManzilApi.kt`:

```kotlin
package com.manzil.consumer.data.remote

import com.manzil.consumer.data.remote.dto.*
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface ManzilApi {

    @GET("home")
    suspend fun getHomeFeed(@Query("locale") locale: String): ApiEnvelope<HomeFeedDto>

    @GET("search")
    suspend fun search(
        @Query("q") query: String,
        @Query("category") category: String,
    ): ApiEnvelope<SearchResultDto>

    @GET("businesses/{slug}")
    suspend fun getBusiness(@Path("slug") slug: String): ApiEnvelope<BusinessDetailDto>

    /** Fire-and-forget analytics. Failures are swallowed by the repository. */
    @POST("businesses/{slug}/visit")
    suspend fun recordVisit(@Path("slug") slug: String)

    @POST("businesses/{slug}/reviews")
    suspend fun createReview(
        @Path("slug") slug: String,
        @Body body: CreateReviewRequest,
    ): ApiEnvelope<CreateReviewResponse>

    @POST("reviews/{id}/helpful")
    suspend fun toggleHelpful(@Path("id") id: String): ApiEnvelope<HelpfulVoteDto>

    @POST("reviews/{id}/report")
    suspend fun reportReview(
        @Path("id") id: String,
        @Body body: ReportReviewRequest,
    ): ApiEnvelope<Unit>

    @GET("media/business-covers")
    suspend fun getBusinessCovers(@Query("slugs") slugs: String): ApiEnvelope<CoversDto>

    @GET("media/businesses/{slug}/photos")
    suspend fun getBusinessPhotos(@Path("slug") slug: String): ApiEnvelope<PhotosDto>

    @POST("gurman/ask")
    suspend fun askConcierge(@Body body: ConciergeRequest): ApiEnvelope<ConciergeReplyDto>

    @GET("auth/me")
    suspend fun getMe(): ApiEnvelope<MeDto>

    @POST("auth/sync")
    suspend fun syncUser(@Body body: SyncUserRequest): ApiEnvelope<AuthUserDto>
}
```

- [ ] **Step 6: Write the Hilt network module**

`di/NetworkModule.kt`:

```kotlin
package com.manzil.consumer.di

import com.manzil.consumer.BuildConfig
import com.manzil.consumer.data.remote.ManzilApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    /**
     * `ignoreUnknownKeys` is deliberate: the API adds fields (CRM/legal columns
     * already ride along on BusinessDto) and the app must not break when it does.
     * Task 5's contract tests are what catch removals and renames instead.
     */
    @Provides
    @Singleton
    fun provideJson(): Json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        coerceInputValues = true
    }

    @Provides
    @Singleton
    fun provideOkHttp(): OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .apply {
            if (BuildConfig.DEBUG) {
                addInterceptor(HttpLoggingInterceptor().apply {
                    level = HttpLoggingInterceptor.Level.BASIC
                })
            }
        }
        .build()

    @Provides
    @Singleton
    fun provideRetrofit(client: OkHttpClient, json: Json): Retrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.API_BASE_URL)
        .client(client)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()

    @Provides
    @Singleton
    fun provideManzilApi(retrofit: Retrofit): ManzilApi = retrofit.create(ManzilApi::class.java)
}
```

> The auth interceptor is added to this client in Task 9, once Clerk exists.

- [ ] **Step 7: Run the test to verify it passes**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*ManzilApiTest'`
Expected: PASS — all six.

- [ ] **Step 8: Commit**

```bash
git add apps/android/app/src/main/java/com/manzil/consumer/data/remote \
        apps/android/app/src/main/java/com/manzil/consumer/di \
        apps/android/app/src/test/java/com/manzil/consumer/data/remote
git commit -m "feat(android): API DTOs, Retrofit service and network module"
```

---

### Task 5: Contract tests from live fixtures

**Files:**
- Create: `apps/android/app/src/test/resources/fixtures/home.json`
- Create: `apps/android/app/src/test/resources/fixtures/search.json`
- Create: `apps/android/app/src/test/resources/fixtures/business-detail.json`
- Create: `apps/android/app/src/test/resources/fixtures/covers.json`
- Create: `apps/android/app/src/test/resources/fixtures/photos.json`
- Create: `apps/android/app/src/test/resources/fixtures/gurman.json`
- Create: `apps/android/app/src/test/java/com/manzil/consumer/data/remote/Fixtures.kt`
- Create: `apps/android/app/src/test/java/com/manzil/consumer/data/remote/ContractTest.kt`
- Create: `apps/android/tools/capture-fixtures.sh`
- Modify: `.github/workflows/` — add the Android unit-test job

**Interfaces:**
- Consumes: Task 4's DTOs and `ManzilApi`.
- Produces: `Fixtures.load(name: String): String` for later tests, and a CI gate that fails when the API's shape drifts from the DTOs.

**Why this task exists:** the app and the API version independently and deploy separately. A renamed or removed field is the single most likely cause of a production break, and it is invisible until a user hits the screen. Parsing real captured payloads in CI is the cheapest place to catch it.

- [ ] **Step 1: Write the capture script**

`apps/android/tools/capture-fixtures.sh`:

```bash
#!/usr/bin/env bash
# Refreshes the contract-test fixtures from the live API.
# Run this whenever the API changes, then re-run the contract tests.
set -euo pipefail

BASE="${MANZIL_API_BASE:-https://api.manzil.uz/v1}"
OUT="$(dirname "$0")/../app/src/test/resources/fixtures"
mkdir -p "$OUT"

# A slug that exists in production. Override when the seed data changes.
SLUG="${MANZIL_FIXTURE_SLUG:?set MANZIL_FIXTURE_SLUG to a live business slug}"

curl -fsS "$BASE/home?locale=uz"                        > "$OUT/home.json"
curl -fsS "$BASE/search?q=&category=all"                > "$OUT/search.json"
curl -fsS "$BASE/businesses/$SLUG"                      > "$OUT/business-detail.json"
curl -fsS "$BASE/media/business-covers?slugs=$SLUG"     > "$OUT/covers.json"
curl -fsS "$BASE/media/businesses/$SLUG/photos"         > "$OUT/photos.json"
curl -fsS -X POST "$BASE/gurman/ask" \
  -H 'Content-Type: application/json' \
  -d '{"query":"plov","locale":"uz"}'                   > "$OUT/gurman.json"

echo "Captured 6 fixtures from $BASE into $OUT"
```

Make it executable and run it:

```bash
chmod +x apps/android/tools/capture-fixtures.sh
MANZIL_FIXTURE_SLUG=<a-live-slug> apps/android/tools/capture-fixtures.sh
```

If the API is unreachable, hand-write each fixture from the exact JSON bodies in Task 4's `ManzilApiTest` and note in the commit that they are synthetic until a live capture replaces them.

- [ ] **Step 2: Write the fixture loader**

`Fixtures.kt`:

```kotlin
package com.manzil.consumer.data.remote

object Fixtures {
    fun load(name: String): String =
        requireNotNull(javaClass.classLoader?.getResourceAsStream("fixtures/$name")) {
            "Missing fixture: fixtures/$name — run apps/android/tools/capture-fixtures.sh"
        }.bufferedReader().use { it.readText() }
}
```

- [ ] **Step 3: Write the failing contract test**

`ContractTest.kt`:

```kotlin
package com.manzil.consumer.data.remote

import com.manzil.consumer.data.remote.dto.*
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

/**
 * Replays payloads captured from the live API through the real DTOs.
 *
 * These use strict parsing — ignoreUnknownKeys is OFF — so a field the API
 * added shows up here as a failure and forces a conscious decision, while the
 * production Json (NetworkModule) stays lenient so users never see a crash.
 */
class ContractTest {

    private lateinit var server: MockWebServer
    private lateinit var api: ManzilApi

    private val strictJson = Json {
        ignoreUnknownKeys = false
        explicitNulls = false
        coerceInputValues = true
    }

    @Before
    fun setUp() {
        server = MockWebServer().apply { start() }
        api = Retrofit.Builder()
            .baseUrl(server.url("/v1/"))
            .client(OkHttpClient())
            .addConverterFactory(strictJson.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(ManzilApi::class.java)
    }

    @After
    fun tearDown() = server.shutdown()

    private fun enqueue(fixture: String) {
        server.enqueue(MockResponse().setBody(Fixtures.load(fixture)))
    }

    @Test
    fun `live home feed parses`() = runTest {
        enqueue("home.json")
        val feed = api.getHomeFeed("uz").data
        assertTrue("home feed must expose a business total", feed.totalBusinesses >= 0)
        feed.justJoined.forEach { assertTrue(it.slug.isNotBlank()) }
    }

    @Test
    fun `live search parses`() = runTest {
        enqueue("search.json")
        val result = api.search("", "all").data
        result.businesses.forEach {
            assertTrue("every business needs a slug", it.slug.isNotBlank())
            assertTrue("every business needs a status the client can filter on", it.status.isNotBlank())
        }
    }

    @Test
    fun `live business detail parses`() = runTest {
        enqueue("business-detail.json")
        val detail = api.getBusiness("ignored").data
        assertTrue(detail.business.slug.isNotBlank())
        detail.reviews.forEach { assertTrue(it.rating in 1..5) }
    }

    @Test
    fun `live covers parse`() = runTest {
        enqueue("covers.json")
        val covers = api.getBusinessCovers("ignored").data.covers
        covers.values.forEach { assertTrue(it.startsWith("http")) }
    }

    @Test
    fun `live photos parse`() = runTest {
        enqueue("photos.json")
        val photos = api.getBusinessPhotos("ignored").data.photos
        photos.forEach { assertTrue(it.id.isNotBlank()) }
    }

    @Test
    fun `live concierge reply parses`() = runTest {
        enqueue("gurman.json")
        val reply = api.askConcierge(ConciergeRequest("plov", "uz")).data
        if (reply.available) {
            assertTrue("an available reply must carry text", reply.text.isNotBlank())
        }
        reply.businesses.forEach { assertTrue(it.slug.isNotBlank()) }
    }
}
```

- [ ] **Step 4: Run the contract tests**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*ContractTest'`
Expected: PASS. Any failure here is real — either a DTO is wrong or the API changed. Fix the DTO; do not loosen the strict `Json`.

- [ ] **Step 5: Add the CI job**

Create `.github/workflows/android.yml`:

```yaml
name: Android

on:
  push:
    paths: ['apps/android/**', '.github/workflows/android.yml']
  pull_request:
    paths: ['apps/android/**', '.github/workflows/android.yml']

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'
      - uses: gradle/actions/setup-gradle@v4
      - name: Unit and contract tests
        working-directory: apps/android
        run: ./gradlew :app:testDebugUnitTest
      - name: Lint
        working-directory: apps/android
        run: ./gradlew :app:lintDebug
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-reports
          path: apps/android/app/build/reports/
```

- [ ] **Step 6: Commit**

```bash
git add apps/android/tools apps/android/app/src/test .github/workflows/android.yml
git commit -m "test(android): contract tests against captured live API fixtures"
```

---

### Task 6: Domain models and repositories

**Files:**
- Create: `apps/android/app/src/main/java/com/manzil/consumer/core/model/PriceTier.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/core/model/Business.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/core/model/Review.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/core/model/HomeFeed.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/core/model/ConciergeReply.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/data/repo/HomeRepository.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/data/repo/SearchRepository.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/data/repo/BusinessRepository.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/data/repo/ReviewRepository.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/data/repo/ConciergeRepository.kt`
- Test: `apps/android/app/src/test/java/com/manzil/consumer/data/repo/RepositoryTest.kt`

**Interfaces:**
- Consumes: `ManzilApi` (Task 4), `apiCall`/`ManzilResult`/`ManzilError` (Task 3).
- Produces:
  - `PriceTier` enum `{ CHEAP, MID, HIGH }` with `PriceTier.fromRaw(raw: String?): PriceTier`
  - `BusinessSummary(slug, name, district, categorySlug, categoryName: LocalizedText, rating: Double, reviewCount: Int, priceTier: PriceTier, lat: Double?, lng: Double?, coverUrl: String?)`
  - `Business(...)`, `Review(...)`, `HomeFeed(justJoined, featured, categories, totalBusinesses)`, `CategoryCount(slug, name, businessCount)`, `LocalizedText(uz, ru, en)`, `ConciergeReply(text, suggestions, available)`, `ConciergeSuggestion(slug, name, reason)`
  - `HomeRepository.feed(locale: String): ManzilResult<HomeFeed>`
  - `SearchRepository.search(query: String, category: String, near: LatLng?): ManzilResult<List<BusinessSummary>>`
  - `BusinessRepository.detail(slug: String): ManzilResult<BusinessDetail>` and `.photos(slug)`, `.recordVisit(slug)`
  - `ReviewRepository.submit(slug, rating, text)`, `.toggleHelpful(id)`, `.report(id, reason)`
  - `ConciergeRepository.ask(query, locale): ManzilResult<ConciergeReply>`

- [ ] **Step 1: Write the failing test**

`RepositoryTest.kt`:

```kotlin
package com.manzil.consumer.data.repo

import com.manzil.consumer.core.model.LatLng
import com.manzil.consumer.core.model.PriceTier
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.data.remote.ManzilApi
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

class RepositoryTest {

    private lateinit var server: MockWebServer
    private lateinit var api: ManzilApi

    @Before
    fun setUp() {
        server = MockWebServer().apply { start() }
        val json = Json { ignoreUnknownKeys = true; explicitNulls = false; coerceInputValues = true }
        api = Retrofit.Builder()
            .baseUrl(server.url("/v1/"))
            .client(OkHttpClient())
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(ManzilApi::class.java)
    }

    @After
    fun tearDown() = server.shutdown()

    private fun businessJson(slug: String, status: String, lat: Double?, lng: Double?) = """
        {"id":"$slug","slug":"$slug","name":"$slug","categorySlug":"cafe",
        "description":{"uz":"u","ru":"r","en":"e"},"address":"A","district":"D","city":"Tashkent",
        ${if (lat != null) "\"lat\":$lat,\"lng\":$lng," else ""}
        "hours":"09:00","priceTier":"$$","status":"$status","avgRating":4.0,"reviewCount":1,
        "photo":"business","tags":[],"foundingBusiness":true}
    """.trimIndent()

    @Test
    fun `price tier normalises every raw value the API can emit`() {
        assertEquals(PriceTier.CHEAP, PriceTier.fromRaw("$"))
        assertEquals(PriceTier.CHEAP, PriceTier.fromRaw("budget"))
        assertEquals(PriceTier.MID, PriceTier.fromRaw("$$"))
        assertEquals(PriceTier.HIGH, PriceTier.fromRaw("$$$"))
        assertEquals(PriceTier.HIGH, PriceTier.fromRaw("premium"))
        assertEquals(PriceTier.HIGH, PriceTier.fromRaw("luxury"))
        assertEquals(PriceTier.MID, PriceTier.fromRaw(null))
        assertEquals(PriceTier.MID, PriceTier.fromRaw("nonsense"))
    }

    @Test
    fun `search drops non-claimed listings the server has not filtered yet`() = runTest {
        server.enqueue(MockResponse().setBody("""
            {"data":{"businesses":[
              ${businessJson("live-one", "claimed", 41.31, 69.24)},
              ${businessJson("not-live", "pending_claim", 41.32, 69.25)},
              ${businessJson("also-not-live", "unclaimed", 41.33, 69.26)}
            ],"categories":[]}}
        """.trimIndent()))

        val result = SearchRepository(api).search(query = "", category = "all", near = null)

        val slugs = (result as ManzilResult.Success).data.map { it.slug }
        assertEquals(listOf("live-one"), slugs)
    }

    @Test
    fun `search sorts by distance when a location is supplied`() = runTest {
        server.enqueue(MockResponse().setBody("""
            {"data":{"businesses":[
              ${businessJson("far", "claimed", 41.40, 69.40)},
              ${businessJson("near", "claimed", 41.31, 69.24)}
            ],"categories":[]}}
        """.trimIndent()))

        val result = SearchRepository(api).search(
            query = "", category = "all", near = LatLng(41.3111, 69.2401)
        )

        assertEquals(listOf("near", "far"), (result as ManzilResult.Success).data.map { it.slug })
    }

    @Test
    fun `search keeps server order when no location is supplied`() = runTest {
        server.enqueue(MockResponse().setBody("""
            {"data":{"businesses":[
              ${businessJson("first", "claimed", 41.40, 69.40)},
              ${businessJson("second", "claimed", 41.31, 69.24)}
            ],"categories":[]}}
        """.trimIndent()))

        val result = SearchRepository(api).search(query = "", category = "all", near = null)

        assertEquals(listOf("first", "second"), (result as ManzilResult.Success).data.map { it.slug })
    }

    @Test
    fun `businesses without coordinates sort last rather than being dropped`() = runTest {
        server.enqueue(MockResponse().setBody("""
            {"data":{"businesses":[
              ${businessJson("no-coords", "claimed", null, null)},
              ${businessJson("has-coords", "claimed", 41.31, 69.24)}
            ],"categories":[]}}
        """.trimIndent()))

        val result = SearchRepository(api).search(
            query = "", category = "all", near = LatLng(41.3111, 69.2401)
        )

        assertEquals(listOf("has-coords", "no-coords"), (result as ManzilResult.Success).data.map { it.slug })
    }

    @Test
    fun `home feed attaches covers to the cards that have one`() = runTest {
        server.enqueue(MockResponse().setBody("""
            {"data":{"justJoined":[{"slug":"a","name":"A","district":"D","city":"Tashkent",
            "priceTier":"budget","avgRating":4.0,"reviewCount":1,"claimedAt":null,"featured":false,
            "category":{"slug":"cafe","nameUz":"Kafe","nameRu":"Кафе","nameEn":"Cafe"}},
            {"slug":"b","name":"B","district":"D","city":"Tashkent","priceTier":null,
            "avgRating":4.0,"reviewCount":1,"claimedAt":null,"featured":false,
            "category":{"slug":"cafe","nameUz":"Kafe","nameRu":"Кафе","nameEn":"Cafe"}}],
            "featured":[],"categories":[],"totalBusinesses":2}}
        """.trimIndent()))
        server.enqueue(MockResponse().setBody("""{"data":{"covers":{"a":"https://cdn/a.jpg"}}}"""))

        val feed = (HomeRepository(api).feed("uz") as ManzilResult.Success).data

        assertEquals("https://cdn/a.jpg", feed.justJoined[0].coverUrl)
        assertEquals(null, feed.justJoined[1].coverUrl)
        assertEquals(PriceTier.CHEAP, feed.justJoined[0].priceTier)
    }

    @Test
    fun `home feed still renders when the covers call fails`() = runTest {
        server.enqueue(MockResponse().setBody("""
            {"data":{"justJoined":[{"slug":"a","name":"A","district":"D","city":"Tashkent",
            "priceTier":null,"avgRating":4.0,"reviewCount":1,"claimedAt":null,"featured":false,
            "category":{"slug":"cafe","nameUz":"Kafe","nameRu":"Кафе","nameEn":"Cafe"}}],
            "featured":[],"categories":[],"totalBusinesses":1}}
        """.trimIndent()))
        server.enqueue(MockResponse().setResponseCode(500))

        val feed = (HomeRepository(api).feed("uz") as ManzilResult.Success).data

        assertEquals(1, feed.justJoined.size)
        assertEquals(null, feed.justJoined[0].coverUrl)
    }

    @Test
    fun `recordVisit never surfaces a failure`() = runTest {
        server.enqueue(MockResponse().setResponseCode(500))
        BusinessRepository(api).recordVisit("any-slug")  // must not throw
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*RepositoryTest'`
Expected: FAIL — the repositories and models are unresolved.

- [ ] **Step 3: Write the domain models**

`core/model/PriceTier.kt`:

```kotlin
package com.manzil.consumer.core.model

/**
 * `/v1/home` sends the raw database column while `/v1/search` sends a value
 * already normalised by the API's mapPriceTier(). One enum absorbs both so no
 * screen ever branches on a raw string.
 */
enum class PriceTier(val label: String) {
    CHEAP("$"), MID("$$"), HIGH("$$$");

    companion object {
        fun fromRaw(raw: String?): PriceTier = when (raw) {
            "$", "budget" -> CHEAP
            "$$$", "premium", "luxury" -> HIGH
            else -> MID
        }
    }
}
```

`core/model/Business.kt`:

```kotlin
package com.manzil.consumer.core.model

data class LocalizedText(val uz: String, val ru: String, val en: String) {
    /** `language` is a two-letter tag: "uz", "ru" or "en". */
    fun forLanguage(language: String): String = when (language) {
        "ru" -> ru.ifBlank { uz }
        "en" -> en.ifBlank { uz }
        else -> uz
    }
}

data class LatLng(val lat: Double, val lng: Double)

/** What a card needs. Deliberately smaller than [Business]. */
data class BusinessSummary(
    val slug: String,
    val name: String,
    val district: String,
    val categorySlug: String,
    val categoryName: LocalizedText,
    val rating: Double,
    val reviewCount: Int,
    val priceTier: PriceTier,
    val location: LatLng?,
    val coverUrl: String?,
)

data class Business(
    val id: String,
    val slug: String,
    val name: String,
    val categorySlug: String,
    val description: LocalizedText,
    val address: String,
    val district: String,
    val phone: String?,
    val location: LatLng?,
    val hours: String,
    val priceTier: PriceTier,
    val rating: Double,
    val reviewCount: Int,
    val tags: List<String>,
    val website: String?,
    val instagram: String?,
    val telegram: String?,
)

data class BusinessDetail(
    val business: Business,
    val reviews: List<Review>,
)

data class CategoryCount(
    val slug: String,
    val name: LocalizedText,
    val businessCount: Int,
)
```

`core/model/Review.kt`:

```kotlin
package com.manzil.consumer.core.model

data class Review(
    val id: String,
    val authorName: String,
    val authorBadge: String?,
    val rating: Int,
    val text: String,
    val createdAt: String,
    val helpfulCount: Int,
    val verifiedVisit: Boolean,
    val ownerReply: String?,
)
```

`core/model/HomeFeed.kt`:

```kotlin
package com.manzil.consumer.core.model

data class HomeFeed(
    val justJoined: List<BusinessSummary>,
    val featured: List<BusinessSummary>,
    val categories: List<CategoryCount>,
    val totalBusinesses: Int,
)
```

`core/model/ConciergeReply.kt`:

```kotlin
package com.manzil.consumer.core.model

data class ConciergeSuggestion(val slug: String, val name: String, val reason: String)

data class ConciergeReply(
    val text: String,
    val suggestions: List<ConciergeSuggestion>,
    val available: Boolean,
)
```

- [ ] **Step 4: Write SearchRepository with defensive filtering and distance sort**

`data/repo/SearchRepository.kt`:

```kotlin
package com.manzil.consumer.data.repo

import com.manzil.consumer.core.model.BusinessSummary
import com.manzil.consumer.core.model.LatLng
import com.manzil.consumer.core.model.LocalizedText
import com.manzil.consumer.core.model.PriceTier
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.core.result.map
import com.manzil.consumer.data.remote.ManzilApi
import com.manzil.consumer.data.remote.apiCall
import com.manzil.consumer.data.remote.dto.BusinessDto
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

@Singleton
class SearchRepository @Inject constructor(private val api: ManzilApi) {

    /**
     * `near` sorts client-side. `/v1/search` accepts no geo parameter and caps
     * at 200 rows, so this is correct at current scale and wrong at ten
     * thousand listings — a server-side geo query is recorded follow-up work.
     */
    suspend fun search(query: String, category: String, near: LatLng?): ManzilResult<List<BusinessSummary>> =
        apiCall { api.search(query, category).data.businesses }
            .map { businesses ->
                businesses
                    .filter { it.isLive() }
                    .map { it.toSummary(coverUrl = null) }
                    .sortedForDistance(near)
            }

    private fun List<BusinessSummary>.sortedForDistance(near: LatLng?): List<BusinessSummary> {
        if (near == null) return this
        // Businesses without coordinates keep their relative order at the end
        // rather than disappearing — a listing with no pin is still a listing.
        return sortedBy { it.location?.let { loc -> haversineKm(near, loc) } ?: Double.MAX_VALUE }
    }
}

/**
 * `/v1/search` does not yet filter on status or mergedIntoId (Workstream B),
 * so unclaimed and pending listings come back today. Filtering here keeps the
 * app correct against the current API and harmless after the server is fixed.
 */
internal fun BusinessDto.isLive(): Boolean = status == "claimed"

internal fun BusinessDto.toSummary(coverUrl: String?) = BusinessSummary(
    slug = slug,
    name = name,
    district = district,
    categorySlug = categorySlug,
    categoryName = LocalizedText(description.uz, description.ru, description.en),
    rating = avgRating,
    reviewCount = reviewCount,
    priceTier = PriceTier.fromRaw(priceTier),
    location = if (lat != null && lng != null) LatLng(lat, lng) else null,
    coverUrl = coverUrl,
)

private const val EARTH_RADIUS_KM = 6371.0

internal fun haversineKm(a: LatLng, b: LatLng): Double {
    val dLat = Math.toRadians(b.lat - a.lat)
    val dLng = Math.toRadians(b.lng - a.lng)
    val h = sin(dLat / 2) * sin(dLat / 2) +
        cos(Math.toRadians(a.lat)) * cos(Math.toRadians(b.lat)) * sin(dLng / 2) * sin(dLng / 2)
    return EARTH_RADIUS_KM * 2 * atan2(sqrt(h), sqrt(1 - h))
}
```

- [ ] **Step 5: Write HomeRepository**

`data/repo/HomeRepository.kt`:

```kotlin
package com.manzil.consumer.data.repo

import com.manzil.consumer.core.model.BusinessSummary
import com.manzil.consumer.core.model.CategoryCount
import com.manzil.consumer.core.model.HomeFeed
import com.manzil.consumer.core.model.LocalizedText
import com.manzil.consumer.core.model.PriceTier
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.core.result.getOrNull
import com.manzil.consumer.core.result.map
import com.manzil.consumer.data.remote.ManzilApi
import com.manzil.consumer.data.remote.apiCall
import com.manzil.consumer.data.remote.dto.HomeCardDto
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HomeRepository @Inject constructor(private val api: ManzilApi) {

    suspend fun feed(locale: String): ManzilResult<HomeFeed> {
        val feedResult = apiCall { api.getHomeFeed(locale).data }
        if (feedResult is ManzilResult.Failure) return feedResult

        val dto = (feedResult as ManzilResult.Success).data
        val slugs = (dto.justJoined + dto.featured).map { it.slug }.distinct()

        // Covers are decoration. A failure here must never blank the feed —
        // cards fall back to the typographic cover, which is a designed state.
        val covers: Map<String, String> = if (slugs.isEmpty()) {
            emptyMap()
        } else {
            apiCall { api.getBusinessCovers(slugs.joinToString(",")).data.covers }
                .getOrNull() ?: emptyMap()
        }

        return ManzilResult.Success(
            HomeFeed(
                justJoined = dto.justJoined.map { it.toSummary(covers[it.slug]) },
                featured = dto.featured.map { it.toSummary(covers[it.slug]) },
                categories = dto.categories.map {
                    CategoryCount(
                        slug = it.slug,
                        name = LocalizedText(it.nameUz, it.nameRu, it.nameEn),
                        businessCount = it.businessCount,
                    )
                },
                totalBusinesses = dto.totalBusinesses,
            )
        )
    }
}

/** Home cards carry no coordinates — Workstream B adds lat/lng to mapCard. */
private fun HomeCardDto.toSummary(coverUrl: String?) = BusinessSummary(
    slug = slug,
    name = name,
    district = district,
    categorySlug = category.slug,
    categoryName = LocalizedText(category.nameUz, category.nameRu, category.nameEn),
    rating = avgRating,
    reviewCount = reviewCount,
    priceTier = PriceTier.fromRaw(priceTier),
    location = null,
    coverUrl = coverUrl,
)
```

- [ ] **Step 6: Write the remaining repositories**

`data/repo/BusinessRepository.kt`:

```kotlin
package com.manzil.consumer.data.repo

import com.manzil.consumer.core.model.*
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.core.result.map
import com.manzil.consumer.data.remote.ManzilApi
import com.manzil.consumer.data.remote.apiCall
import com.manzil.consumer.data.remote.dto.BusinessDto
import com.manzil.consumer.data.remote.dto.ReviewDto
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BusinessRepository @Inject constructor(private val api: ManzilApi) {

    suspend fun detail(slug: String): ManzilResult<BusinessDetail> =
        apiCall { api.getBusiness(slug).data }
            .map { dto ->
                BusinessDetail(
                    business = dto.business.toBusiness(),
                    reviews = dto.reviews.map { it.toReview() },
                )
            }

    suspend fun photos(slug: String): ManzilResult<List<String>> =
        apiCall { api.getBusinessPhotos(slug).data.photos }
            .map { photos -> photos.mapNotNull { it.publicUrl } }

    /** Analytics only. A failure here is invisible to the user by design. */
    suspend fun recordVisit(slug: String) {
        apiCall { api.recordVisit(slug) }
    }
}

internal fun BusinessDto.toBusiness() = Business(
    id = id,
    slug = slug,
    name = name,
    categorySlug = categorySlug,
    description = LocalizedText(description.uz, description.ru, description.en),
    address = address,
    district = district,
    phone = phone,
    location = if (lat != null && lng != null) LatLng(lat, lng) else null,
    hours = hours,
    priceTier = PriceTier.fromRaw(priceTier),
    rating = avgRating,
    reviewCount = reviewCount,
    tags = tags,
    website = website,
    instagram = instagram,
    telegram = telegram,
)

internal fun ReviewDto.toReview() = Review(
    id = id,
    authorName = authorName,
    authorBadge = authorBadge,
    rating = rating,
    text = text,
    createdAt = createdAt,
    helpfulCount = helpfulCount,
    verifiedVisit = verifiedVisit,
    ownerReply = reply?.text,
)
```

`data/repo/ReviewRepository.kt`:

```kotlin
package com.manzil.consumer.data.repo

import com.manzil.consumer.core.model.Review
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.core.result.map
import com.manzil.consumer.data.remote.ManzilApi
import com.manzil.consumer.data.remote.apiCall
import com.manzil.consumer.data.remote.dto.CreateReviewRequest
import com.manzil.consumer.data.remote.dto.ReportReviewRequest
import javax.inject.Inject
import javax.inject.Singleton

data class HelpfulVote(val reviewId: String, val helpfulCount: Int, val voted: Boolean)

@Singleton
class ReviewRepository @Inject constructor(private val api: ManzilApi) {

    suspend fun submit(slug: String, rating: Int, text: String): ManzilResult<Review> =
        apiCall { api.createReview(slug, CreateReviewRequest(rating, text)).data.review }
            .map { it.toReview() }

    suspend fun toggleHelpful(reviewId: String): ManzilResult<HelpfulVote> =
        apiCall { api.toggleHelpful(reviewId).data }
            .map { HelpfulVote(it.reviewId, it.helpfulCount, it.voted) }

    suspend fun report(reviewId: String, reason: String): ManzilResult<Unit> =
        apiCall { api.reportReview(reviewId, ReportReviewRequest(reason)) }
            .map { }
}
```

`data/repo/ConciergeRepository.kt`:

```kotlin
package com.manzil.consumer.data.repo

import com.manzil.consumer.core.model.ConciergeReply
import com.manzil.consumer.core.model.ConciergeSuggestion
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.core.result.map
import com.manzil.consumer.data.remote.ManzilApi
import com.manzil.consumer.data.remote.apiCall
import com.manzil.consumer.data.remote.dto.ConciergeRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ConciergeRepository @Inject constructor(private val api: ManzilApi) {

    suspend fun ask(query: String, locale: String): ManzilResult<ConciergeReply> =
        apiCall { api.askConcierge(ConciergeRequest(query, locale)).data }
            .map { dto ->
                ConciergeReply(
                    text = dto.text,
                    suggestions = dto.businesses.map {
                        ConciergeSuggestion(slug = it.slug, name = it.name, reason = it.reason)
                    },
                    available = dto.available,
                )
            }
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*RepositoryTest'`
Expected: PASS — all eight.

- [ ] **Step 8: Commit**

```bash
git add apps/android/app/src/main/java/com/manzil/consumer/core/model \
        apps/android/app/src/main/java/com/manzil/consumer/data/repo \
        apps/android/app/src/test/java/com/manzil/consumer/data/repo
git commit -m "feat(android): domain models and repositories with defensive status filtering"
```

---

### Task 7: DataStore for saved places and preferences

**Files:**
- Create: `apps/android/app/src/main/java/com/manzil/consumer/data/local/SavedStore.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/data/local/PrefsStore.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/di/StoreModule.kt`
- Test: `apps/android/app/src/test/java/com/manzil/consumer/data/local/StoreTest.kt`

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - `SavedStore.savedSlugs: Flow<Set<String>>`, `.isSaved(slug): Flow<Boolean>`, `suspend .toggle(slug)`, `suspend .remove(slug)`
  - `PrefsStore.language: Flow<String>` (`"uz"`/`"ru"`/`"en"`), `suspend .setLanguage(String)`, `.onboardingSeen: Flow<Boolean>`, `suspend .setOnboardingSeen(Boolean)`, `.locationPromptShown: Flow<Boolean>`, `suspend .setLocationPromptShown(Boolean)`

**Spec constraint:** saves are device-local and unsynced — there is no server-side saved-business model and adding one is out of scope. That is an accepted consequence recorded in the spec's §2 table, not an oversight. The Saved screen (Task 15) must tell the user this in plain language.

- [ ] **Step 1: Write the failing test**

`StoreTest.kt`:

```kotlin
package com.manzil.consumer.data.local

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class StoreTest {

    @get:Rule val tmp = TemporaryFolder()

    private fun store(name: String): DataStore<Preferences> =
        PreferenceDataStoreFactory.create(scope = TestScope()) { tmp.newFile(name) }

    @Test
    fun `toggle adds then removes a slug`() = runTest {
        val saved = SavedStore(store("saved1.preferences_pb"))

        assertEquals(emptySet<String>(), saved.savedSlugs.first())

        saved.toggle("chorsu-choyxona")
        assertEquals(setOf("chorsu-choyxona"), saved.savedSlugs.first())
        assertTrue(saved.isSaved("chorsu-choyxona").first())

        saved.toggle("chorsu-choyxona")
        assertEquals(emptySet<String>(), saved.savedSlugs.first())
        assertFalse(saved.isSaved("chorsu-choyxona").first())
    }

    @Test
    fun `saves survive a new store instance over the same file`() = runTest {
        val file = tmp.newFile("saved2.preferences_pb")
        val backing = PreferenceDataStoreFactory.create(scope = TestScope()) { file }

        SavedStore(backing).toggle("a")
        assertEquals(setOf("a"), SavedStore(backing).savedSlugs.first())
    }

    @Test
    fun `language defaults to uz and round-trips`() = runTest {
        val prefs = PrefsStore(store("prefs1.preferences_pb"))

        assertEquals("uz", prefs.language.first())
        prefs.setLanguage("ru")
        assertEquals("ru", prefs.language.first())
    }

    @Test
    fun `an unsupported language falls back to uz rather than breaking the app`() = runTest {
        val prefs = PrefsStore(store("prefs2.preferences_pb"))

        prefs.setLanguage("fr")
        assertEquals("uz", prefs.language.first())
    }

    @Test
    fun `onboarding and location prompt flags default false and round-trip`() = runTest {
        val prefs = PrefsStore(store("prefs3.preferences_pb"))

        assertFalse(prefs.onboardingSeen.first())
        assertFalse(prefs.locationPromptShown.first())

        prefs.setOnboardingSeen(true)
        prefs.setLocationPromptShown(true)

        assertTrue(prefs.onboardingSeen.first())
        assertTrue(prefs.locationPromptShown.first())
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*StoreTest'`
Expected: FAIL — `SavedStore` and `PrefsStore` are unresolved.

- [ ] **Step 3: Write SavedStore.kt**

```kotlin
package com.manzil.consumer.data.local

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringSetPreferencesKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Saved places are device-local by design (spec §2). There is no server-side
 * saved-business model, so these are lost on reinstall and never appear on the
 * web. The Saved screen states this plainly rather than letting a user assume
 * their list is backed up.
 */
@Singleton
class SavedStore @Inject constructor(private val store: DataStore<Preferences>) {

    val savedSlugs: Flow<Set<String>> = store.data.map { it[KEY] ?: emptySet() }

    fun isSaved(slug: String): Flow<Boolean> = savedSlugs.map { slug in it }

    suspend fun toggle(slug: String) {
        store.edit { prefs ->
            val current = prefs[KEY] ?: emptySet()
            prefs[KEY] = if (slug in current) current - slug else current + slug
        }
    }

    suspend fun remove(slug: String) {
        store.edit { prefs -> prefs[KEY] = (prefs[KEY] ?: emptySet()) - slug }
    }

    private companion object {
        val KEY = stringSetPreferencesKey("saved_slugs")
    }
}
```

- [ ] **Step 4: Write PrefsStore.kt**

```kotlin
package com.manzil.consumer.data.local

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PrefsStore @Inject constructor(private val store: DataStore<Preferences>) {

    /** Always one of SUPPORTED. Uzbek is the default and the fallback. */
    val language: Flow<String> = store.data.map { prefs ->
        prefs[LANGUAGE]?.takeIf { it in SUPPORTED } ?: DEFAULT_LANGUAGE
    }

    val onboardingSeen: Flow<Boolean> = store.data.map { it[ONBOARDING_SEEN] ?: false }

    val locationPromptShown: Flow<Boolean> = store.data.map { it[LOCATION_PROMPT_SHOWN] ?: false }

    suspend fun setLanguage(language: String) {
        store.edit { it[LANGUAGE] = if (language in SUPPORTED) language else DEFAULT_LANGUAGE }
    }

    suspend fun setOnboardingSeen(seen: Boolean) {
        store.edit { it[ONBOARDING_SEEN] = seen }
    }

    suspend fun setLocationPromptShown(shown: Boolean) {
        store.edit { it[LOCATION_PROMPT_SHOWN] = shown }
    }

    companion object {
        const val DEFAULT_LANGUAGE = "uz"
        val SUPPORTED = setOf("uz", "ru", "en")

        private val LANGUAGE = stringPreferencesKey("language")
        private val ONBOARDING_SEEN = booleanPreferencesKey("onboarding_seen")
        private val LOCATION_PROMPT_SHOWN = booleanPreferencesKey("location_prompt_shown")
    }
}
```

- [ ] **Step 5: Write StoreModule.kt**

```kotlin
package com.manzil.consumer.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStoreFile
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object StoreModule {

    @Provides
    @Singleton
    fun providePreferences(@ApplicationContext context: Context): DataStore<Preferences> =
        PreferenceDataStoreFactory.create(
            scope = CoroutineScope(Dispatchers.IO + SupervisorJob()),
        ) { context.preferencesDataStoreFile("manzil") }
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*StoreTest'`
Expected: PASS — all five.

- [ ] **Step 7: Commit**

```bash
git add apps/android/app/src/main/java/com/manzil/consumer/data/local \
        apps/android/app/src/main/java/com/manzil/consumer/di/StoreModule.kt \
        apps/android/app/src/test/java/com/manzil/consumer/data/local
git commit -m "feat(android): DataStore for device-local saves and preferences"
```

---

### Task 8: Core UI components

**Files:**
- Create: `apps/android/app/src/main/java/com/manzil/consumer/core/ui/TypographicCover.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/core/ui/BusinessCard.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/core/ui/RatingRow.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/core/ui/ManzilChip.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/core/ui/States.kt`
- Modify: `apps/android/app/src/main/res/values/strings.xml`
- Test: `apps/android/app/src/androidTest/java/com/manzil/consumer/core/ui/BusinessCardTest.kt`

**Interfaces:**
- Consumes: Task 2's theme, Task 6's `BusinessSummary`/`PriceTier`.
- Produces:
  - `TypographicCover(name: String, categoryLabel: String, district: String, modifier: Modifier)`
  - `BusinessCard(business: BusinessSummary, categoryLabel: String, distanceKm: Double?, saved: Boolean, onSave: () -> Unit, onClick: () -> Unit, modifier: Modifier)`
  - `RatingRow(rating: Double, reviewCount: Int, modifier: Modifier)`
  - `ManzilChip(label: String, selected: Boolean, onClick: () -> Unit, modifier: Modifier)`
  - `LoadingState(modifier)`, `EmptyState(title: String, body: String, actionLabel: String?, onAction: (() -> Unit)?, modifier)`, `ErrorState(error: ManzilError, onRetry: () -> Unit, modifier)`

**Design constraint:** the no-photo state is the primary mitigation for launching with few listings (spec §4). `TypographicCover` must read as editorial intent — the business name set large in Unbounded, knocked out of deep teal — never as a grey placeholder.

- [ ] **Step 1: Write the failing UI test**

`androidTest/…/BusinessCardTest.kt`:

```kotlin
package com.manzil.consumer.core.ui

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.manzil.consumer.core.design.ManzilTheme
import com.manzil.consumer.core.model.BusinessSummary
import com.manzil.consumer.core.model.LocalizedText
import com.manzil.consumer.core.model.PriceTier
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class BusinessCardTest {

    @get:Rule val compose = createComposeRule()

    private val sample = BusinessSummary(
        slug = "chorsu-choyxona",
        name = "Chorsu Choyxona",
        district = "Shayxontohur",
        categorySlug = "cafe",
        categoryName = LocalizedText("Kafe", "Кафе", "Cafe"),
        rating = 4.6,
        reviewCount = 12,
        priceTier = PriceTier.MID,
        location = null,
        coverUrl = null,
    )

    @Test
    fun `renders name and district`() {
        compose.setContent {
            ManzilTheme {
                BusinessCard(sample, "Kafe", null, false, {}, {})
            }
        }

        compose.onNodeWithText("Chorsu Choyxona").assertIsDisplayed()
        compose.onNodeWithText("Shayxontohur").assertIsDisplayed()
    }

    @Test
    fun `rating is announced as one node, not three fragments`() {
        compose.setContent {
            ManzilTheme {
                BusinessCard(sample, "Kafe", null, false, {}, {})
            }
        }

        // RatingRow collapses its semantics, so the star, the number and the
        // count are one announcement. Asserting on the raw "4.6" text node
        // would fail — that is the point of the collapse.
        compose.onNodeWithContentDescription("4.6, 12 ta sharh").assertIsDisplayed()
    }

    @Test
    fun `a business with no reviews says so instead of showing a zero rating`() {
        compose.setContent {
            ManzilTheme {
                BusinessCard(sample.copy(rating = 0.0, reviewCount = 0), "Kafe", null, false, {}, {})
            }
        }

        compose.onNodeWithContentDescription("Hali sharh yo'q").assertIsDisplayed()
    }

    @Test
    fun `save button is labelled for TalkBack and reports clicks`() {
        var saveClicks = 0
        compose.setContent {
            ManzilTheme {
                BusinessCard(sample, "Kafe", null, false, { saveClicks++ }, {})
            }
        }

        compose.onNodeWithContentDescription("Saqlash").performClick()
        assertTrue(saveClicks == 1)
    }

    @Test
    fun `the saved state has its own content description, not just a colour change`() {
        compose.setContent {
            ManzilTheme {
                BusinessCard(sample, "Kafe", null, true, {}, {})
            }
        }

        compose.onNodeWithContentDescription("Saqlanganlardan olib tashlash").assertIsDisplayed()
    }

    @Test
    fun `a card with no cover shows the typographic cover, not a blank block`() {
        compose.setContent {
            ManzilTheme {
                BusinessCard(sample.copy(coverUrl = null), "Kafe", null, false, {}, {})
            }
        }

        // The typographic cover repeats the name inside the media block.
        compose.onNodeWithContentDescription("Rasm hali yo'q").assertIsDisplayed()
    }

    @Test
    fun `distance renders when supplied`() {
        compose.setContent {
            ManzilTheme {
                BusinessCard(sample, "Kafe", 1.4, false, {}, {})
            }
        }

        compose.onNodeWithText("1.4 km").assertIsDisplayed()
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/android && ./gradlew :app:connectedDebugAndroidTest --tests '*BusinessCardTest'`
Expected: FAIL — `BusinessCard` is unresolved. (Requires a connected device or emulator. If none is available, run `:app:compileDebugAndroidTestKotlin` and confirm the compile failure instead, then run the full test once a device exists.)

- [ ] **Step 3: Write TypographicCover.kt**

```kotlin
package com.manzil.consumer.core.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.manzil.consumer.R
import com.manzil.consumer.core.design.ManzilColors

/**
 * The designed no-photo state.
 *
 * Most early listings will have no photograph. A grey placeholder would read as
 * broken; the business name set large in the display face, knocked out of a
 * teal field, reads as editorial intent. This is the single most important
 * component for making a sparse catalogue look deliberate.
 */
@Composable
fun TypographicCover(
    name: String,
    categoryLabel: String,
    district: String,
    modifier: Modifier = Modifier,
) {
    val noPhoto = stringResource(R.string.cover_no_photo)
    Box(
        modifier = modifier
            .background(
                Brush.linearGradient(
                    listOf(ManzilColors.Primary, ManzilColors.PrimaryDark)
                )
            )
            .semantics { contentDescription = noPhoto },
        contentAlignment = Alignment.BottomStart,
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(
                text = "$categoryLabel · $district".uppercase(),
                style = MaterialTheme.typography.labelMedium,
                color = ManzilColors.PrimarySoft,
            )
            Text(
                text = name,
                style = MaterialTheme.typography.displaySmall,
                color = ManzilColors.Surface,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}
```

- [ ] **Step 4: Write RatingRow.kt and ManzilChip.kt**

`RatingRow.kt`:

```kotlin
package com.manzil.consumer.core.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material.icons.rounded.StarOutline
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.dp
import com.manzil.consumer.R
import com.manzil.consumer.core.design.ManzilColors

/**
 * Gold appears here and on exactly one CTA per screen — scarcity is what keeps
 * it meaningful. The numeric rating is always rendered as text, so colour is
 * never the sole carrier of the signal.
 *
 * The whole row is collapsed into one semantics node so TalkBack announces
 * "4.6, 12 ta sharh" rather than reading a star, a number and another number.
 */
@Composable
fun RatingRow(
    rating: Double,
    reviewCount: Int,
    modifier: Modifier = Modifier,
) {
    val noReviews = stringResource(R.string.rating_no_reviews)
    val label = if (reviewCount == 0) {
        noReviews
    } else {
        pluralStringResource(R.plurals.rating_with_reviews, reviewCount, rating, reviewCount)
    }

    Row(
        modifier = modifier.clearAndSetSemantics { contentDescription = label },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Icon(
            imageVector = if (reviewCount == 0) Icons.Rounded.StarOutline else Icons.Rounded.Star,
            contentDescription = null,
            tint = ManzilColors.Gold,
            modifier = Modifier.size(16.dp),
        )
        if (reviewCount == 0) {
            Text(
                text = noReviews,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        } else {
            Text(
                text = String.format("%.1f", rating),
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Text(
                text = reviewCount.toString(),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
```

`ManzilChip.kt`:

```kotlin
package com.manzil.consumer.core.ui

import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ManzilChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label, style = MaterialTheme.typography.labelLarge) },
        // 48dp is the accessibility floor from PRODUCT.md, not a visual choice.
        modifier = modifier.defaultMinSize(minHeight = 48.dp),
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = MaterialTheme.colorScheme.primary,
            selectedLabelColor = MaterialTheme.colorScheme.onPrimary,
        ),
    )
}
```

- [ ] **Step 5: Write BusinessCard.kt**

```kotlin
package com.manzil.consumer.core.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Bookmark
import androidx.compose.material.icons.rounded.BookmarkBorder
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import com.manzil.consumer.R
import com.manzil.consumer.core.model.BusinessSummary

@Composable
fun BusinessCard(
    business: BusinessSummary,
    categoryLabel: String,
    distanceKm: Double?,
    saved: Boolean,
    onSave: () -> Unit,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed) 0.98f else 1f, label = "cardPress")

    Card(
        onClick = onClick,
        interactionSource = interaction,
        modifier = modifier.fillMaxWidth().scale(scale),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Box(Modifier.fillMaxWidth().height(168.dp).clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))) {
            if (business.coverUrl != null) {
                AsyncImage(
                    model = business.coverUrl,
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                )
            } else {
                TypographicCover(
                    name = business.name,
                    categoryLabel = categoryLabel,
                    district = business.district,
                    modifier = Modifier.fillMaxSize(),
                )
            }

            IconButton(
                onClick = onSave,
                modifier = Modifier.align(Alignment.TopEnd).padding(4.dp).size(48.dp),
            ) {
                Icon(
                    imageVector = if (saved) Icons.Rounded.Bookmark else Icons.Rounded.BookmarkBorder,
                    contentDescription = stringResource(
                        if (saved) R.string.action_unsave else R.string.action_save
                    ),
                    tint = MaterialTheme.colorScheme.surface,
                )
            }
        }

        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(
                text = business.name,
                style = MaterialTheme.typography.titleLarge,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    text = business.district,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text("·", color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(
                    text = business.priceTier.label,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                if (distanceKm != null) {
                    Text("·", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(
                        text = stringResource(R.string.distance_km, distanceKm),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            RatingRow(rating = business.rating, reviewCount = business.reviewCount)
        }
    }
}
```

- [ ] **Step 6: Write States.kt**

```kotlin
package com.manzil.consumer.core.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.manzil.consumer.R
import com.manzil.consumer.core.result.ManzilError

@Composable
fun LoadingState(modifier: Modifier = Modifier) {
    Box(modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
    }
}

/** Every empty state names the next action. "Nothing here" is never enough. */
@Composable
fun EmptyState(
    title: String,
    body: String,
    modifier: Modifier = Modifier,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null,
) {
    Column(
        modifier = modifier.fillMaxWidth().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(title, style = MaterialTheme.typography.headlineSmall, textAlign = TextAlign.Center)
        Text(
            body,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        if (actionLabel != null && onAction != null) {
            Spacer(Modifier.height(8.dp))
            Button(onClick = onAction, modifier = Modifier.defaultMinSize(minHeight = 48.dp)) {
                Text(actionLabel)
            }
        }
    }
}

/**
 * Rate limiting gets its own copy. `ThrottleGurman` blocks for 30 minutes and
 * `ThrottleWrite` for 2 — rendering either as a generic failure would read as a
 * broken app rather than a deliberate limit.
 */
@Composable
fun ErrorState(
    error: ManzilError,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val message = when (error) {
        is ManzilError.RateLimited ->
            if (error.retryAfterMinutes != null) {
                stringResource(error.messageRes, error.retryAfterMinutes)
            } else {
                stringResource(error.messageRes)
            }
        else -> stringResource(error.messageRes)
    }

    Column(
        modifier = modifier.fillMaxWidth().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            message,
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center,
        )
        // Retrying a rate limit immediately just extends the block.
        if (error !is ManzilError.RateLimited) {
            Button(onClick = onRetry, modifier = Modifier.defaultMinSize(minHeight = 48.dp)) {
                Text(stringResource(R.string.action_retry))
            }
        }
    }
}
```

- [ ] **Step 7: Add the strings**

Append to `res/values/strings.xml`:

```xml
<string name="action_save">Saqlash</string>
<string name="action_unsave">Saqlanganlardan olib tashlash</string>
<string name="action_retry">Qayta urinish</string>
<string name="cover_no_photo">Rasm hali yo\'q</string>
<string name="rating_no_reviews">Hali sharh yo\'q</string>
<string name="distance_km">%1$.1f km</string>

<plurals name="rating_with_reviews">
    <item quantity="one">%1$.1f, %2$d ta sharh</item>
    <item quantity="other">%1$.1f, %2$d ta sharh</item>
</plurals>
```

- [ ] **Step 8: Run the UI tests to verify they pass**

Run: `cd apps/android && ./gradlew :app:connectedDebugAndroidTest --tests '*BusinessCardTest'`
Expected: PASS — all five.

- [ ] **Step 9: Commit**

```bash
git add apps/android/app/src/main/java/com/manzil/consumer/core/ui \
        apps/android/app/src/main/res/values/strings.xml \
        apps/android/app/src/androidTest
git commit -m "feat(android): core UI components with designed no-photo cover"
```

---

### Task 9: Clerk authentication

**Files:**
- Modify: `apps/android/gradle/libs.versions.toml` (confirm the `clerk` version)
- Modify: `apps/android/app/build.gradle.kts` (add the Clerk dependency)
- Modify: `apps/android/app/src/main/java/com/manzil/consumer/ManzilApp.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/data/repo/AuthRepository.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/data/remote/AuthInterceptor.kt`
- Modify: `apps/android/app/src/main/java/com/manzil/consumer/di/NetworkModule.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/feature/auth/AuthViewModel.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/feature/auth/AuthSheet.kt`
- Test: `apps/android/app/src/test/java/com/manzil/consumer/data/remote/AuthInterceptorTest.kt`

**Interfaces:**
- Consumes: Task 4's `ManzilApi`/`NetworkModule`, Task 7's `PrefsStore`.
- Produces:
  - `AuthRepository.isSignedIn: Flow<Boolean>`, `.currentUser: Flow<AuthUser?>`, `suspend .signInWithGoogle(): ManzilResult<Unit>`, `suspend .sendPhoneCode(phone: String): ManzilResult<Unit>`, `suspend .verifyPhoneCode(code: String): ManzilResult<Unit>`, `suspend .signOut()`, `suspend .syncWithBackend(locale: String)`
  - `AuthUser(id, displayName, email, locale, role)`
  - `AuthSheet(onDismiss: () -> Unit, onSignedIn: () -> Unit)` — the modal shown whenever an action needs identity.

**Spec constraints:** anonymous browsing is the default. Home, Search, Detail and Concierge all work signed out. The gate appears only at review submission, helpful votes, and Profile. **Clerk's bot protection must be enabled in the Clerk dashboard before shipping** — each phone OTP costs money, and Sirly gates theirs behind an explicit CAPTCHA for exactly this reason (spec §7).

- [ ] **Step 1: Write the failing test**

`AuthInterceptorTest.kt`:

```kotlin
package com.manzil.consumer.data.remote

import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

class AuthInterceptorTest {

    private lateinit var server: MockWebServer

    @Before
    fun setUp() { server = MockWebServer().apply { start() } }

    @After
    fun tearDown() = server.shutdown()

    private fun clientWithToken(token: String?): OkHttpClient =
        OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(tokenProvider = { token }))
            .build()

    @Test
    fun `a token is attached as a bearer credential`() {
        server.enqueue(MockResponse())

        clientWithToken("abc123")
            .newCall(Request.Builder().url(server.url("/v1/auth/me")).build())
            .execute().close()

        assertEquals("Bearer abc123", server.takeRequest().getHeader("Authorization"))
    }

    @Test
    fun `no header is sent when signed out, so anonymous browsing still works`() {
        server.enqueue(MockResponse())

        clientWithToken(null)
            .newCall(Request.Builder().url(server.url("/v1/home")).build())
            .execute().close()

        assertNull(server.takeRequest().getHeader("Authorization"))
    }

    @Test
    fun `an existing Authorization header is never overwritten`() {
        server.enqueue(MockResponse())

        clientWithToken("abc123")
            .newCall(
                Request.Builder()
                    .url(server.url("/v1/auth/me"))
                    .header("Authorization", "Bearer explicit")
                    .build()
            )
            .execute().close()

        assertEquals("Bearer explicit", server.takeRequest().getHeader("Authorization"))
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*AuthInterceptorTest'`
Expected: FAIL — `AuthInterceptor` is unresolved.

- [ ] **Step 3: Write AuthInterceptor.kt**

```kotlin
package com.manzil.consumer.data.remote

import okhttp3.Interceptor
import okhttp3.Response

/**
 * Attaches the Clerk session token when one exists.
 *
 * `tokenProvider` is a blocking lambda deliberately: OkHttp interceptors run on
 * a background thread and Clerk caches the token in memory, so this does not
 * hit the network on the common path. It returns null while signed out, which
 * is the normal state — anonymous browsing is the default and every public
 * endpoint must keep working without a header.
 */
class AuthInterceptor(private val tokenProvider: () -> String?) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()

        // A caller that set the header explicitly knows better than we do.
        if (request.header("Authorization") != null) return chain.proceed(request)

        val token = tokenProvider() ?: return chain.proceed(request)

        return chain.proceed(
            request.newBuilder().header("Authorization", "Bearer $token").build()
        )
    }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*AuthInterceptorTest'`
Expected: PASS — all three.

- [ ] **Step 5: Add the Clerk dependency and initialise it**

Find the current version at https://github.com/clerk/clerk-android/releases and set `clerk = "<that version>"` in `libs.versions.toml`. Add to `app/build.gradle.kts` dependencies:

```kotlin
implementation(libs.clerk.android.api)
```

Rewrite `ManzilApp.kt`:

```kotlin
package com.manzil.consumer

import android.app.Application
import com.clerk.api.Clerk
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class ManzilApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Clerk.initialize(this, publishableKey = BuildConfig.CLERK_PUBLISHABLE_KEY)
    }
}
```

Verify against the versioned quickstart at https://clerk.com/docs/quickstarts/android before writing — if `Clerk.initialize` has a different signature in the version you pinned, follow the docs and adjust `AuthRepository` to match.

- [ ] **Step 6: Write AuthRepository.kt**

```kotlin
package com.manzil.consumer.data.repo

import com.clerk.api.Clerk
import com.clerk.api.sso.OAuthProvider
import com.manzil.consumer.core.result.ManzilError
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.data.remote.ManzilApi
import com.manzil.consumer.data.remote.apiCall
import com.manzil.consumer.data.remote.dto.SyncUserRequest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

data class AuthUser(
    val id: String,
    val displayName: String,
    val email: String?,
    val locale: String,
    val role: String,
)

@Singleton
class AuthRepository @Inject constructor(private val api: ManzilApi) {

    private val _currentUser = MutableStateFlow<AuthUser?>(null)
    val currentUser: Flow<AuthUser?> = _currentUser.asStateFlow()
    val isSignedIn: Flow<Boolean> = currentUser.map { it != null }

    /** Held across a phone OTP flow: sendPhoneCode starts it, verifyPhoneCode finishes it. */
    private var pendingSignIn: Any? = null

    /** Blocking accessor for AuthInterceptor. Clerk caches the token in memory. */
    fun sessionTokenBlocking(): String? = Clerk.auth.cachedSessionToken()

    suspend fun signInWithGoogle(): ManzilResult<Unit> = runCatchingAuth {
        Clerk.auth.signInWithOAuth(OAuthProvider.GOOGLE)
    }

    suspend fun sendPhoneCode(phone: String): ManzilResult<Unit> = runCatchingAuth {
        pendingSignIn = Clerk.auth.signInWithOtp { this.phone = phone }
    }

    suspend fun verifyPhoneCode(code: String): ManzilResult<Unit> = runCatchingAuth {
        val signIn = pendingSignIn ?: error("verifyPhoneCode called before sendPhoneCode")
        Clerk.auth.verifyCode(signIn, code)
        pendingSignIn = null
    }

    suspend fun signOut() {
        runCatching { Clerk.auth.signOut() }
        _currentUser.value = null
    }

    /**
     * Creates or updates the local User row. Identity comes from the verified
     * Clerk token server-side, never from this body — the body only carries
     * display preferences.
     */
    suspend fun syncWithBackend(locale: String): ManzilResult<AuthUser> {
        val result = apiCall { api.syncUser(SyncUserRequest(displayName = null, locale = locale)).data }
        if (result is ManzilResult.Success) {
            _currentUser.value = with(result.data) {
                AuthUser(id, displayName, email, this.locale, role)
            }
        }
        return when (result) {
            is ManzilResult.Success -> ManzilResult.Success(_currentUser.value!!)
            is ManzilResult.Failure -> result
        }
    }

    suspend fun refreshFromBackend(): ManzilResult<AuthUser?> {
        val result = apiCall { api.getMe().data.user }
        if (result is ManzilResult.Success) {
            _currentUser.value = result.data?.let {
                AuthUser(it.id, it.displayName, it.email, it.locale, it.role)
            }
        }
        return when (result) {
            is ManzilResult.Success -> ManzilResult.Success(_currentUser.value)
            is ManzilResult.Failure -> result
        }
    }

    private inline fun runCatchingAuth(block: () -> Unit): ManzilResult<Unit> =
        try {
            block()
            ManzilResult.Success(Unit)
        } catch (e: Exception) {
            ManzilResult.Failure(ManzilError.Unauthorized)
        }
}
```

> **Verify against the pinned SDK version.** `cachedSessionToken()`, the
> `signInWithOtp { phone = … }` builder and `verifyCode` are the shapes the
> Clerk Android docs describe; if the pinned release names them differently,
> adjust this file only — nothing else in the app touches Clerk directly. If
> no synchronous cached-token accessor exists, hold the last token in a
> `@Volatile var` refreshed after each sign-in and on `refreshFromBackend`.

- [ ] **Step 7: Wire the interceptor into NetworkModule**

Replace `provideOkHttp` in `di/NetworkModule.kt` with:

```kotlin
    @Provides
    @Singleton
    fun provideOkHttp(tokenProvider: SessionTokenProvider): OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .addInterceptor(AuthInterceptor { tokenProvider.token() })
        .apply {
            if (BuildConfig.DEBUG) {
                addInterceptor(HttpLoggingInterceptor().apply {
                    level = HttpLoggingInterceptor.Level.BASIC
                })
            }
        }
        .build()
```

`AuthRepository` depends on `ManzilApi`, which depends on `OkHttpClient` — injecting the repository into the client would be a cycle. Break it with a tiny indirection, in `di/NetworkModule.kt`:

```kotlin
/** Breaks the OkHttp → ManzilApi → AuthRepository → OkHttp dependency cycle. */
@Singleton
class SessionTokenProvider @Inject constructor() {
    @Volatile private var provider: (() -> String?)? = null
    fun bind(source: () -> String?) { provider = source }
    fun token(): String? = provider?.invoke()
}
```

In `MainActivity.onCreate`, before `setContent`, bind it:

```kotlin
@Inject lateinit var tokenProvider: SessionTokenProvider
@Inject lateinit var authRepository: AuthRepository
// …
tokenProvider.bind { authRepository.sessionTokenBlocking() }
```

- [ ] **Step 8: Write AuthViewModel.kt and AuthSheet.kt**

`AuthViewModel.kt`:

```kotlin
package com.manzil.consumer.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.manzil.consumer.core.result.ManzilError
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.data.local.PrefsStore
import com.manzil.consumer.data.repo.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface AuthUiState {
    data object Choosing : AuthUiState
    data object Working : AuthUiState
    data class AwaitingCode(val phone: String) : AuthUiState
    data class Failed(val error: ManzilError) : AuthUiState
    data object SignedIn : AuthUiState
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val auth: AuthRepository,
    private val prefs: PrefsStore,
) : ViewModel() {

    private val _state = MutableStateFlow<AuthUiState>(AuthUiState.Choosing)
    val state: StateFlow<AuthUiState> = _state.asStateFlow()

    fun signInWithGoogle() = viewModelScope.launch {
        _state.value = AuthUiState.Working
        finish(auth.signInWithGoogle())
    }

    fun sendCode(phone: String) = viewModelScope.launch {
        _state.value = AuthUiState.Working
        _state.value = when (val r = auth.sendPhoneCode(phone)) {
            is ManzilResult.Success -> AuthUiState.AwaitingCode(phone)
            is ManzilResult.Failure -> AuthUiState.Failed(r.error)
        }
    }

    fun verifyCode(code: String) = viewModelScope.launch {
        _state.value = AuthUiState.Working
        finish(auth.verifyPhoneCode(code))
    }

    fun reset() { _state.value = AuthUiState.Choosing }

    private suspend fun finish(result: ManzilResult<Unit>) {
        _state.value = when (result) {
            is ManzilResult.Success -> {
                // Creates the local User row on first sign-in.
                auth.syncWithBackend(prefs.language.first())
                AuthUiState.SignedIn
            }
            is ManzilResult.Failure -> AuthUiState.Failed(result.error)
        }
    }
}
```

`AuthSheet.kt`: a `ModalBottomSheet` rendering `AuthUiState`. `Choosing` shows a "Google bilan kirish" button and a phone field with a "Kod yuborish" button; `AwaitingCode` shows a 6-digit code field and "Tasdiqlash"; `Working` shows a `CircularProgressIndicator`; `Failed` renders `ErrorState(error, onRetry = viewModel::reset)`; `SignedIn` calls `onSignedIn()` in a `LaunchedEffect` and dismisses. Every button uses `Modifier.defaultMinSize(minHeight = 48.dp)`. Strings: `auth_title`, `auth_google`, `auth_phone_label`, `auth_send_code`, `auth_code_label`, `auth_verify`, `auth_why` ("Sharh qoldirish uchun hisobingizga kiring").

- [ ] **Step 9: Verify and commit**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest :app:assembleDebug`
Expected: PASS and BUILD SUCCESSFUL.

Manually confirm on a device: launching signed-out reaches Home with no auth prompt; tapping "Sharh yozish" opens the sheet; Google sign-in returns to the app signed in; `GET /v1/auth/me` returns the user.

**Before shipping:** enable bot protection on the phone/SMS factor in the Clerk dashboard. Record that it is on in the release checklist (Task 21).

```bash
git add apps/android
git commit -m "feat(android): Clerk auth with Google and phone, token interceptor"
```

---

### Task 10: Navigation scaffold

**Files:**
- Create: `apps/android/app/src/main/java/com/manzil/consumer/nav/Routes.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/nav/ManzilNavHost.kt`
- Modify: `apps/android/app/src/main/java/com/manzil/consumer/MainActivity.kt`
- Modify: `apps/android/app/src/main/AndroidManifest.xml`
- Modify: `apps/android/app/src/main/res/values/strings.xml`
- Test: `apps/android/app/src/androidTest/java/com/manzil/consumer/nav/NavigationTest.kt`

**Interfaces:**
- Consumes: Task 2's theme.
- Produces: the `Routes` objects every screen navigates with, and `ManzilNavHost(navController: NavHostController)`. Screens are added in Tasks 11–17; this task wires placeholders so navigation is testable before any screen exists.

**Deep links (spec §6):** `manzil://business/{slug}` and verified App Links on `https://manzil.uz/businesses/{slug}`, so a web link shared in Telegram opens the app. This is the cheapest growth loop available and must not be deferred.

- [ ] **Step 1: Write the failing test**

`androidTest/…/NavigationTest.kt`:

```kotlin
package com.manzil.consumer.nav

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.navigation.compose.rememberNavController
import androidx.navigation.testing.TestNavHostController
import androidx.test.platform.app.InstrumentationRegistry
import com.manzil.consumer.core.design.ManzilTheme
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class NavigationTest {

    @get:Rule val compose = createComposeRule()

    @Test
    fun `starts on Home`() {
        compose.setContent { ManzilTheme { ManzilNavHost(rememberNavController()) } }
        compose.onNodeWithText("Manzil").assertIsDisplayed()
    }

    @Test
    fun `tapping the Search tab navigates to the search destination`() {
        lateinit var controller: TestNavHostController
        compose.setContent {
            controller = TestNavHostController(InstrumentationRegistry.getInstrumentation().targetContext)
            ManzilTheme { ManzilNavHost(controller) }
        }

        compose.onNodeWithText("Qidiruv").performClick()

        assertTrue(
            controller.currentBackStackEntry?.destination?.route?.contains("SearchRoute") == true
        )
    }

    @Test
    fun `every tab is reachable`() {
        compose.setContent { ManzilTheme { ManzilNavHost(rememberNavController()) } }

        listOf("Qidiruv", "Gurman", "Saqlangan", "Profil", "Asosiy").forEach { label ->
            compose.onNodeWithText(label).performClick()
            compose.onNodeWithText(label).assertIsDisplayed()
        }
    }
}
```

Add `androidTestImplementation("androidx.navigation:navigation-testing:2.9.5")` to `app/build.gradle.kts`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/android && ./gradlew :app:connectedDebugAndroidTest --tests '*NavigationTest'`
Expected: FAIL — `ManzilNavHost` is unresolved.

- [ ] **Step 3: Write Routes.kt**

```kotlin
package com.manzil.consumer.nav

import kotlinx.serialization.Serializable

@Serializable data object HomeRoute
@Serializable data class SearchRoute(val query: String? = null, val category: String? = null)
@Serializable data object ConciergeRoute
@Serializable data object SavedRoute
@Serializable data object ProfileRoute
@Serializable data class BusinessRoute(val slug: String)
@Serializable data class ReviewRoute(val slug: String, val businessName: String)
@Serializable data class MapRoute(val category: String? = null)

/** The five bottom-tab destinations, in display order. */
enum class TopLevel(val label: Int) {
    HOME(com.manzil.consumer.R.string.tab_home),
    SEARCH(com.manzil.consumer.R.string.tab_search),
    CONCIERGE(com.manzil.consumer.R.string.tab_concierge),
    SAVED(com.manzil.consumer.R.string.tab_saved),
    PROFILE(com.manzil.consumer.R.string.tab_profile),
}
```

- [ ] **Step 4: Write ManzilNavHost.kt**

```kotlin
package com.manzil.consumer.nav

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Bookmark
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.navDeepLink
import androidx.navigation.toRoute

private data class Tab(val level: TopLevel, val icon: ImageVector, val route: Any)

private val TABS = listOf(
    Tab(TopLevel.HOME, Icons.Rounded.Home, HomeRoute),
    Tab(TopLevel.SEARCH, Icons.Rounded.Search, SearchRoute()),
    Tab(TopLevel.CONCIERGE, Icons.Rounded.AutoAwesome, ConciergeRoute),
    Tab(TopLevel.SAVED, Icons.Rounded.Bookmark, SavedRoute),
    Tab(TopLevel.PROFILE, Icons.Rounded.Person, ProfileRoute),
)

@Composable
fun ManzilNavHost(navController: NavHostController) {
    val backStack by navController.currentBackStackEntryAsState()
    val currentDestination = backStack?.destination

    Scaffold(
        bottomBar = {
            NavigationBar {
                TABS.forEach { tab ->
                    val label = stringResource(tab.level.label)
                    NavigationBarItem(
                        selected = currentDestination?.hierarchy?.any {
                            it.route?.contains(tab.route::class.simpleName ?: "") == true
                        } == true,
                        onClick = {
                            navController.navigate(tab.route) {
                                // Tab switches must not grow the back stack, and
                                // returning to a tab must restore where the user was.
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(tab.icon, contentDescription = label) },
                        label = { Text(label) },
                    )
                }
            }
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = HomeRoute,
            modifier = Modifier.padding(padding),
        ) {
            composable<HomeRoute> { Text("Manzil") }
            composable<SearchRoute> { Text(stringResource(TopLevel.SEARCH.label)) }
            composable<ConciergeRoute> { Text(stringResource(TopLevel.CONCIERGE.label)) }
            composable<SavedRoute> { Text(stringResource(TopLevel.SAVED.label)) }
            composable<ProfileRoute> { Text(stringResource(TopLevel.PROFILE.label)) }

            composable<BusinessRoute>(
                deepLinks = listOf(
                    navDeepLink<BusinessRoute>(basePath = "manzil://business"),
                    navDeepLink<BusinessRoute>(basePath = "https://manzil.uz/businesses"),
                )
            ) { entry ->
                Text(entry.toRoute<BusinessRoute>().slug)
            }

            composable<ReviewRoute> { entry -> Text(entry.toRoute<ReviewRoute>().businessName) }
            composable<MapRoute> { Text("Xarita") }
        }
    }
}
```

Each placeholder `Text(...)` is replaced by the real screen in Tasks 11–17.

- [ ] **Step 5: Add the tab strings and App Links intent filter**

Append to `res/values/strings.xml`:

```xml
<string name="tab_home">Asosiy</string>
<string name="tab_search">Qidiruv</string>
<string name="tab_concierge">Gurman</string>
<string name="tab_saved">Saqlangan</string>
<string name="tab_profile">Profil</string>
```

Add inside `MainActivity`'s `<activity>` in `AndroidManifest.xml`:

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="manzil.uz" android:pathPrefix="/businesses" />
</intent-filter>

<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="manzil" android:host="business" />
</intent-filter>
```

App Links verification also needs `https://manzil.uz/.well-known/assetlinks.json` published with the release signing certificate's SHA-256 fingerprint. Record this as a Task 21 release step — the `https` filter silently falls back to a chooser until it is served.

- [ ] **Step 6: Use the nav host in MainActivity**

Replace the `setContent` body with `ManzilTheme { ManzilNavHost(rememberNavController()) }`.

- [ ] **Step 7: Run tests and commit**

Run: `cd apps/android && ./gradlew :app:connectedDebugAndroidTest --tests '*NavigationTest'`
Expected: PASS — all three.

```bash
git add apps/android
git commit -m "feat(android): navigation scaffold with type-safe routes and deep links"
```

---

### Task 11: Home screen

**Files:**
- Create: `apps/android/app/src/main/java/com/manzil/consumer/feature/home/HomeViewModel.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/feature/home/HomeScreen.kt`
- Modify: `apps/android/app/src/main/java/com/manzil/consumer/nav/ManzilNavHost.kt`
- Modify: `apps/android/app/src/main/res/values/strings.xml`
- Test: `apps/android/app/src/test/java/com/manzil/consumer/feature/home/HomeViewModelTest.kt`

**Interfaces:**
- Consumes: `HomeRepository.feed(locale)` (Task 6), `SavedStore` (Task 7), `PrefsStore.language` (Task 7), `BusinessCard`/`TypographicCover`/`LoadingState`/`ErrorState`/`EmptyState` (Task 8).
- Produces: `HomeUiState` (`Loading`, `Content(feed, savedSlugs)`, `Empty(totalBusinesses)`, `Error(error)`), `HomeViewModel.state: StateFlow<HomeUiState>`, `.refresh()`, `.toggleSave(slug)`, and `HomeScreen(onBusinessClick, onCategoryClick, onSearchClick)`.

**Design constraint (spec §4):** Home uses **three distinct shapes** — an editorial hero, a horizontal category rail, then compact rows — not a stack of identical cards. The empty state is the launch-day state and must read as an invitation, not a failure.

- [ ] **Step 1: Write the failing test**

`HomeViewModelTest.kt`:

```kotlin
package com.manzil.consumer.feature.home

import app.cash.turbine.test
import com.manzil.consumer.core.model.*
import com.manzil.consumer.core.result.ManzilError
import com.manzil.consumer.core.result.ManzilResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class HomeViewModelTest {

    private val dispatcher = StandardTestDispatcher()

    @Before fun setUp() = Dispatchers.setMain(dispatcher)
    @After fun tearDown() = Dispatchers.resetMain()

    private fun summary(slug: String) = BusinessSummary(
        slug = slug, name = slug, district = "D", categorySlug = "cafe",
        categoryName = LocalizedText("Kafe", "Кафе", "Cafe"),
        rating = 4.0, reviewCount = 2, priceTier = PriceTier.MID,
        location = null, coverUrl = null,
    )

    private fun feed(vararg slugs: String, total: Int = slugs.size) = HomeFeed(
        justJoined = slugs.map(::summary),
        featured = emptyList(),
        categories = listOf(CategoryCount("cafe", LocalizedText("Kafe", "Кафе", "Cafe"), total)),
        totalBusinesses = total,
    )

    @Test
    fun `emits Loading then Content`() = runTest(dispatcher) {
        val vm = HomeViewModel(
            home = FakeHomeRepository(ManzilResult.Success(feed("a", "b"))),
            saved = FakeSavedStore(),
            prefs = FakePrefsStore(),
        )

        vm.state.test {
            assertEquals(HomeUiState.Loading, awaitItem())
            val content = awaitItem() as HomeUiState.Content
            assertEquals(listOf("a", "b"), content.feed.justJoined.map { it.slug })
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `an entirely empty platform yields Empty, not Content with zero cards`() = runTest(dispatcher) {
        val vm = HomeViewModel(
            home = FakeHomeRepository(ManzilResult.Success(feed(total = 0))),
            saved = FakeSavedStore(),
            prefs = FakePrefsStore(),
        )

        vm.state.test {
            awaitItem() // Loading
            assertTrue(awaitItem() is HomeUiState.Empty)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `a network failure yields Error carrying the cause`() = runTest(dispatcher) {
        val vm = HomeViewModel(
            home = FakeHomeRepository(ManzilResult.Failure(ManzilError.Network)),
            saved = FakeSavedStore(),
            prefs = FakePrefsStore(),
        )

        vm.state.test {
            awaitItem() // Loading
            assertEquals(ManzilError.Network, (awaitItem() as HomeUiState.Error).error)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `toggling a save is reflected in the emitted state`() = runTest(dispatcher) {
        val saved = FakeSavedStore()
        val vm = HomeViewModel(
            home = FakeHomeRepository(ManzilResult.Success(feed("a"))),
            saved = saved,
            prefs = FakePrefsStore(),
        )

        vm.state.test {
            awaitItem() // Loading
            assertEquals(emptySet<String>(), (awaitItem() as HomeUiState.Content).savedSlugs)

            vm.toggleSave("a")
            assertEquals(setOf("a"), (awaitItem() as HomeUiState.Content).savedSlugs)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `the feed is requested in the user's chosen language`() = runTest(dispatcher) {
        val repo = FakeHomeRepository(ManzilResult.Success(feed("a")))
        HomeViewModel(repo, FakeSavedStore(), FakePrefsStore(language = "ru")).state.test {
            awaitItem(); awaitItem()
            assertEquals("ru", repo.lastLocale)
            cancelAndIgnoreRemainingEvents()
        }
    }
}
```

Create the fakes in `apps/android/app/src/test/java/com/manzil/consumer/Fakes.kt`:

```kotlin
package com.manzil.consumer

import com.manzil.consumer.core.model.HomeFeed
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.data.local.PrefsStore
import com.manzil.consumer.data.local.SavedStore
import com.manzil.consumer.data.repo.HomeRepository
import kotlinx.coroutines.flow.*

class FakeHomeRepository(private val result: ManzilResult<HomeFeed>) : HomeRepository(api = throw UnsupportedOperationException()) {
    var lastLocale: String? = null
    override suspend fun feed(locale: String): ManzilResult<HomeFeed> {
        lastLocale = locale
        return result
    }
}

class FakeSavedStore : SavedStore(store = throw UnsupportedOperationException()) {
    private val slugs = MutableStateFlow<Set<String>>(emptySet())
    override val savedSlugs: Flow<Set<String>> = slugs
    override fun isSaved(slug: String): Flow<Boolean> = slugs.map { slug in it }
    override suspend fun toggle(slug: String) {
        slugs.value = if (slug in slugs.value) slugs.value - slug else slugs.value + slug
    }
    override suspend fun remove(slug: String) { slugs.value = slugs.value - slug }
}

class FakePrefsStore(language: String = "uz") : PrefsStore(store = throw UnsupportedOperationException()) {
    private val lang = MutableStateFlow(language)
    override val language: Flow<String> = lang
    override val onboardingSeen: Flow<Boolean> = flowOf(true)
    override val locationPromptShown: Flow<Boolean> = flowOf(true)
    override suspend fun setLanguage(language: String) { lang.value = language }
    override suspend fun setOnboardingSeen(seen: Boolean) {}
    override suspend fun setLocationPromptShown(shown: Boolean) {}
}
```

The `throw` in each constructor argument never runs — the overrides replace every member that would touch it. To make the classes open, add `open` to `HomeRepository`, `SavedStore` and `PrefsStore` and to the members overridden above. **Prefer this over a mocking library**: it keeps the fake's behaviour readable and it fails to compile when a repository grows a method the fake has not considered.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*HomeViewModelTest'`
Expected: FAIL — `HomeViewModel` and `HomeUiState` are unresolved.

- [ ] **Step 3: Write HomeViewModel.kt**

```kotlin
package com.manzil.consumer.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.manzil.consumer.core.model.HomeFeed
import com.manzil.consumer.core.result.ManzilError
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.data.local.PrefsStore
import com.manzil.consumer.data.local.SavedStore
import com.manzil.consumer.data.repo.HomeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface HomeUiState {
    data object Loading : HomeUiState
    data class Content(val feed: HomeFeed, val savedSlugs: Set<String>) : HomeUiState
    /** The launch-day state. Rendered as an invitation, never as a failure. */
    data class Empty(val totalBusinesses: Int) : HomeUiState
    data class Error(val error: ManzilError) : HomeUiState
}

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val home: HomeRepository,
    private val saved: SavedStore,
    private val prefs: PrefsStore,
) : ViewModel() {

    private val reloads = MutableStateFlow(0)

    private val feedFlow: Flow<ManzilResult<HomeFeed>> =
        combine(prefs.language, reloads) { language, _ -> language }
            .mapLatest { language -> home.feed(language) }

    val state: StateFlow<HomeUiState> =
        combine(feedFlow, saved.savedSlugs) { result, savedSlugs ->
            when (result) {
                is ManzilResult.Failure -> HomeUiState.Error(result.error)
                is ManzilResult.Success -> {
                    val feed = result.data
                    // "Nothing on the platform" and "nothing in these two
                    // sections" are different problems with different copy.
                    if (feed.justJoined.isEmpty() && feed.featured.isEmpty()) {
                        HomeUiState.Empty(feed.totalBusinesses)
                    } else {
                        HomeUiState.Content(feed, savedSlugs)
                    }
                }
            }
        }.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = HomeUiState.Loading,
        )

    fun refresh() { reloads.update { it + 1 } }

    fun toggleSave(slug: String) = viewModelScope.launch { saved.toggle(slug) }
}
```

- [ ] **Step 4: Write HomeScreen.kt**

```kotlin
package com.manzil.consumer.feature.home

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.manzil.consumer.R
import com.manzil.consumer.core.model.BusinessSummary
import com.manzil.consumer.core.ui.*

@Composable
fun HomeScreen(
    onBusinessClick: (String) -> Unit,
    onCategoryClick: (String) -> Unit,
    onSearchClick: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    when (val s = state) {
        HomeUiState.Loading -> LoadingState()

        is HomeUiState.Error -> ErrorState(s.error, onRetry = viewModel::refresh)

        is HomeUiState.Empty -> EmptyState(
            title = stringResource(R.string.home_empty_title),
            body = stringResource(R.string.home_empty_body),
            actionLabel = stringResource(R.string.home_empty_action),
            onAction = onSearchClick,
        )

        is HomeUiState.Content -> HomeContent(
            state = s,
            onBusinessClick = onBusinessClick,
            onCategoryClick = onCategoryClick,
            onSave = viewModel::toggleSave,
        )
    }
}

/**
 * Three distinct shapes, deliberately (spec §4):
 *   1. an editorial hero — one business, full-bleed, display type
 *   2. a horizontal category rail
 *   3. compact rows for the rest
 * A uniform stack of identical cards is the failure mode this replaces.
 */
@Composable
private fun HomeContent(
    state: HomeUiState.Content,
    onBusinessClick: (String) -> Unit,
    onCategoryClick: (String) -> Unit,
    onSave: (String) -> Unit,
) {
    val hero: BusinessSummary? = state.feed.featured.firstOrNull()
        ?: state.feed.justJoined.firstOrNull()
    val rest = (state.feed.featured + state.feed.justJoined)
        .distinctBy { it.slug }
        .filter { it.slug != hero?.slug }

    LazyColumn(
        contentPadding = PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        item {
            Text(
                text = stringResource(R.string.home_title),
                style = MaterialTheme.typography.displayMedium,
            )
        }

        // Shape 1 — hero.
        if (hero != null) {
            item {
                HeroCard(
                    business = hero,
                    saved = hero.slug in state.savedSlugs,
                    onSave = { onSave(hero.slug) },
                    onClick = { onBusinessClick(hero.slug) },
                )
            }
        }

        // Shape 2 — category rail. Empty categories still show, with their
        // count, because "0" is an opening for a business owner, not a gap.
        if (state.feed.categories.isNotEmpty()) {
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        stringResource(R.string.home_categories),
                        style = MaterialTheme.typography.headlineSmall,
                    )
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(state.feed.categories, key = { it.slug }) { category ->
                            ManzilChip(
                                label = "${category.name.uz} ${category.businessCount}",
                                selected = false,
                                onClick = { onCategoryClick(category.slug) },
                            )
                        }
                    }
                }
            }
        }

        // Shape 3 — compact rows.
        if (rest.isNotEmpty()) {
            item {
                Text(
                    stringResource(R.string.home_just_joined),
                    style = MaterialTheme.typography.headlineSmall,
                )
            }
            items(rest, key = { it.slug }) { business ->
                BusinessCard(
                    business = business,
                    categoryLabel = business.categoryName.uz,
                    distanceKm = null,   // home cards carry no coordinates yet
                    saved = business.slug in state.savedSlugs,
                    onSave = { onSave(business.slug) },
                    onClick = { onBusinessClick(business.slug) },
                )
            }
        }
    }
}

@Composable
private fun HeroCard(
    business: BusinessSummary,
    saved: Boolean,
    onSave: () -> Unit,
    onClick: () -> Unit,
) {
    Card(
        onClick = onClick,
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text = stringResource(R.string.home_hero_kicker),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
            )
            Text(
                text = business.name,
                style = MaterialTheme.typography.displaySmall,
                color = MaterialTheme.colorScheme.onPrimary,
            )
            Text(
                text = "${business.categoryName.uz} · ${business.district}",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
            )
            RatingRow(business.rating, business.reviewCount)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                // The single gold CTA on this screen.
                Button(
                    onClick = onClick,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.secondary,
                        contentColor = MaterialTheme.colorScheme.onSecondary,
                    ),
                    modifier = Modifier.defaultMinSize(minHeight = 48.dp),
                ) { Text(stringResource(R.string.action_view)) }

                OutlinedButton(
                    onClick = onSave,
                    modifier = Modifier.defaultMinSize(minHeight = 48.dp),
                ) {
                    Text(stringResource(if (saved) R.string.action_unsave else R.string.action_save))
                }
            }
        }
    }
}
```

- [ ] **Step 5: Add the strings and wire the route**

Append to `res/values/strings.xml`:

```xml
<string name="home_title">Toshkentda qayerga borish kerak?</string>
<string name="home_hero_kicker">BUGUNGI TANLOV</string>
<string name="home_categories">Toifalar</string>
<string name="home_just_joined">Yaqinda qo\'shilganlar</string>
<string name="home_empty_title">Platforma endi boshlanmoqda</string>
<string name="home_empty_body">Hozircha ko\'rsatadigan joy kam. Qidiruvdan foydalaning yoki o\'z biznesingizni qo\'shing — birinchi bo\'ling.</string>
<string name="home_empty_action">Qidirishni boshlash</string>
<string name="action_view">Batafsil</string>
```

In `ManzilNavHost.kt`, replace `composable<HomeRoute> { Text("Manzil") }` with:

```kotlin
composable<HomeRoute> {
    HomeScreen(
        onBusinessClick = { slug -> navController.navigate(BusinessRoute(slug)) },
        onCategoryClick = { category -> navController.navigate(SearchRoute(category = category)) },
        onSearchClick = { navController.navigate(SearchRoute()) },
    )
}
```

- [ ] **Step 6: Run tests and commit**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*HomeViewModelTest'`
Expected: PASS — all five.

```bash
git add apps/android
git commit -m "feat(android): home screen with editorial hero, category rail and rows"
```

---

### Task 12: Search screen

**Files:**
- Create: `apps/android/app/src/main/java/com/manzil/consumer/feature/search/SearchViewModel.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/feature/search/SearchScreen.kt`
- Modify: `apps/android/app/src/main/java/com/manzil/consumer/nav/ManzilNavHost.kt`
- Modify: `apps/android/app/src/main/res/values/strings.xml`
- Test: `apps/android/app/src/test/java/com/manzil/consumer/feature/search/SearchViewModelTest.kt`

**Interfaces:**
- Consumes: `SearchRepository.search(query, category, near)` (Task 6), `SavedStore`, `LocationProvider` (Task 18 — until then the ViewModel takes `near: LatLng?` as `null`).
- Produces: `SearchUiState` (`Idle`, `Loading`, `Results(businesses, savedSlugs, query, category)`, `NoResults(query)`, `Error(error)`), `SearchViewModel.state`, `.onQueryChange(String)`, `.onCategoryChange(String)`, `.retry()`, and `SearchScreen(initialQuery, initialCategory, onBusinessClick, onMapClick)`.

**Constraint:** `ThrottleSearch` allows 30 requests/minute. Debounce input by 350 ms so typing a ten-character query costs one request, not ten.

- [ ] **Step 1: Write the failing test**

`SearchViewModelTest.kt`:

```kotlin
package com.manzil.consumer.feature.search

import app.cash.turbine.test
import com.manzil.consumer.FakeSavedStore
import com.manzil.consumer.core.model.*
import com.manzil.consumer.core.result.ManzilError
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.data.repo.SearchRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class SearchViewModelTest {

    private val dispatcher = StandardTestDispatcher()

    @Before fun setUp() = Dispatchers.setMain(dispatcher)
    @After fun tearDown() = Dispatchers.resetMain()

    private class FakeSearchRepository(
        var result: ManzilResult<List<BusinessSummary>>,
    ) : SearchRepository(api = throw UnsupportedOperationException()) {
        var calls = 0
        var lastQuery: String? = null
        var lastCategory: String? = null
        override suspend fun search(query: String, category: String, near: LatLng?):
            ManzilResult<List<BusinessSummary>> {
            calls++
            lastQuery = query
            lastCategory = category
            return result
        }
    }

    private fun summary(slug: String) = BusinessSummary(
        slug = slug, name = slug, district = "D", categorySlug = "cafe",
        categoryName = LocalizedText("Kafe", "Кафе", "Cafe"),
        rating = 4.0, reviewCount = 1, priceTier = PriceTier.MID,
        location = null, coverUrl = null,
    )

    @Test
    fun `starts Idle before any input`() = runTest(dispatcher) {
        val vm = SearchViewModel(FakeSearchRepository(ManzilResult.Success(emptyList())), FakeSavedStore())
        vm.state.test {
            assertEquals(SearchUiState.Idle, awaitItem())
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `rapid typing is debounced into a single request`() = runTest(dispatcher) {
        val repo = FakeSearchRepository(ManzilResult.Success(listOf(summary("a"))))
        val vm = SearchViewModel(repo, FakeSavedStore())

        vm.state.test {
            awaitItem() // Idle
            "choyxona".forEachIndexed { i, _ -> vm.onQueryChange("choyxona".take(i + 1)) }
            advanceTimeBy(400)
            runCurrent()

            assertEquals(1, repo.calls)
            assertEquals("choyxona", repo.lastQuery)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `an empty result set yields NoResults carrying the query`() = runTest(dispatcher) {
        val vm = SearchViewModel(
            FakeSearchRepository(ManzilResult.Success(emptyList())),
            FakeSavedStore(),
        )

        vm.state.test {
            awaitItem() // Idle
            vm.onQueryChange("nonexistent")
            advanceTimeBy(400); runCurrent()

            val states = cancelAndConsumeRemainingEvents()
            assertTrue(states.any { it is app.cash.turbine.Event.Item &&
                (it.value as? SearchUiState.NoResults)?.query == "nonexistent" })
        }
    }

    @Test
    fun `a rate limit surfaces as Error rather than NoResults`() = runTest(dispatcher) {
        val vm = SearchViewModel(
            FakeSearchRepository(ManzilResult.Failure(ManzilError.RateLimited(1))),
            FakeSavedStore(),
        )

        vm.state.test {
            awaitItem() // Idle
            vm.onQueryChange("choy")
            advanceTimeBy(400); runCurrent()

            val states = cancelAndConsumeRemainingEvents()
            assertTrue(states.any { it is app.cash.turbine.Event.Item &&
                (it.value as? SearchUiState.Error)?.error == ManzilError.RateLimited(1) })
        }
    }

    @Test
    fun `changing the category re-queries immediately without debounce`() = runTest(dispatcher) {
        val repo = FakeSearchRepository(ManzilResult.Success(listOf(summary("a"))))
        val vm = SearchViewModel(repo, FakeSavedStore())

        vm.state.test {
            awaitItem()
            vm.onCategoryChange("cafe")
            advanceTimeBy(400); runCurrent()

            assertEquals("cafe", repo.lastCategory)
            cancelAndIgnoreRemainingEvents()
        }
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*SearchViewModelTest'`
Expected: FAIL — `SearchViewModel` is unresolved.

- [ ] **Step 3: Write SearchViewModel.kt**

```kotlin
package com.manzil.consumer.feature.search

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.manzil.consumer.core.model.BusinessSummary
import com.manzil.consumer.core.model.LatLng
import com.manzil.consumer.core.result.ManzilError
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.data.local.SavedStore
import com.manzil.consumer.data.repo.SearchRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface SearchUiState {
    data object Idle : SearchUiState
    data object Loading : SearchUiState
    data class Results(
        val businesses: List<BusinessSummary>,
        val savedSlugs: Set<String>,
        val query: String,
        val category: String,
    ) : SearchUiState
    data class NoResults(val query: String) : SearchUiState
    data class Error(val error: ManzilError) : SearchUiState
}

private data class Criteria(val query: String, val category: String, val near: LatLng?)

@OptIn(FlowPreview::class)
@HiltViewModel
class SearchViewModel @Inject constructor(
    private val search: SearchRepository,
    private val saved: SavedStore,
) : ViewModel() {

    private val query = MutableStateFlow("")
    private val category = MutableStateFlow("all")
    private val near = MutableStateFlow<LatLng?>(null)

    /**
     * Query text is debounced; category and location are not. Typing costs one
     * request per pause rather than one per keystroke — ThrottleSearch allows
     * 30/minute and a ten-character query would otherwise burn a third of that.
     */
    private val criteria: Flow<Criteria> = combine(
        query.debounce { if (it.isEmpty()) 0L else DEBOUNCE_MS },
        category,
        near,
    ) { q, c, n -> Criteria(q, c, n) }

    val state: StateFlow<SearchUiState> = criteria
        .flatMapLatest { criteria ->
            if (criteria.query.isBlank() && criteria.category == "all") {
                flowOf(SearchUiState.Idle)
            } else {
                flow {
                    emit(SearchUiState.Loading)
                    emitAll(
                        saved.savedSlugs.map { savedSlugs ->
                            when (val result = search.search(criteria.query, criteria.category, criteria.near)) {
                                is ManzilResult.Failure -> SearchUiState.Error(result.error)
                                is ManzilResult.Success ->
                                    if (result.data.isEmpty()) SearchUiState.NoResults(criteria.query)
                                    else SearchUiState.Results(
                                        businesses = result.data,
                                        savedSlugs = savedSlugs,
                                        query = criteria.query,
                                        category = criteria.category,
                                    )
                            }
                        }
                    )
                }
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), SearchUiState.Idle)

    fun onQueryChange(value: String) { query.value = value }
    fun onCategoryChange(value: String) { category.value = value }
    fun onLocationChange(value: LatLng?) { near.value = value }
    fun retry() { query.update { it } ; category.update { it } }
    fun toggleSave(slug: String) = viewModelScope.launch { saved.toggle(slug) }

    private companion object { const val DEBOUNCE_MS = 350L }
}
```

> `saved.savedSlugs.map { … }` re-runs the search on every save toggle. If that
> shows up as redundant traffic in testing, hoist the search into its own
> `flatMapLatest` and `combine` the saved set in afterwards. Left simple here
> because a save is a rare, deliberate action.

- [ ] **Step 4: Write SearchScreen.kt**

A `Column` containing:
1. An `OutlinedTextField` bound to `onQueryChange`, `singleLine = true`, `imeAction = Search`, `placeholder = stringResource(R.string.search_placeholder)`, leading `Icons.Rounded.Search`, and a trailing clear button when non-empty (`contentDescription = stringResource(R.string.action_clear)`).
2. A `LazyRow` of `ManzilChip`s: "Hammasi" (`all`) plus one per category, `selected = category == chip.slug`.
3. A trailing icon button opening the map (`onMapClick`), `contentDescription = stringResource(R.string.action_map)`.
4. The state body:
   - `Idle` → `EmptyState(title = R.string.search_idle_title, body = R.string.search_idle_body)`
   - `Loading` → `LoadingState()`
   - `Error` → `ErrorState(s.error, onRetry = viewModel::retry)`
   - `NoResults` → `EmptyState(title = stringResource(R.string.search_none_title, s.query), body = stringResource(R.string.search_none_body), actionLabel = stringResource(R.string.search_none_action), onAction = { viewModel.onCategoryChange("all"); viewModel.onQueryChange("") })`
   - `Results` → `LazyColumn` of `BusinessCard`, `key = { it.slug }`, `distanceKm` computed as `s.near?.let { haversineKm(it, business.location) }` when both exist, else `null`.

Strings to add:

```xml
<string name="search_placeholder">Joy, toifa yoki tuman</string>
<string name="search_all">Hammasi</string>
<string name="search_idle_title">Nimadir qidiryapsizmi?</string>
<string name="search_idle_body">Joy nomini yozing yoki toifani tanlang.</string>
<string name="search_none_title">"%1$s" bo\'yicha hech narsa topilmadi</string>
<string name="search_none_body">Boshqa so\'z bilan urinib ko\'ring yoki toifani kengaytiring.</string>
<string name="search_none_action">Filtrlarni tozalash</string>
<string name="action_clear">Tozalash</string>
<string name="action_map">Xaritada ko\'rish</string>
```

Wire the route in `ManzilNavHost.kt`:

```kotlin
composable<SearchRoute> { entry ->
    val route = entry.toRoute<SearchRoute>()
    SearchScreen(
        initialQuery = route.query.orEmpty(),
        initialCategory = route.category ?: "all",
        onBusinessClick = { slug -> navController.navigate(BusinessRoute(slug)) },
        onMapClick = { navController.navigate(MapRoute(route.category)) },
    )
}
```

`SearchScreen` applies `initialQuery`/`initialCategory` once in a `LaunchedEffect(Unit)` so returning to the tab does not overwrite what the user has typed.

- [ ] **Step 5: Run tests and commit**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*SearchViewModelTest'`
Expected: PASS — all five.

```bash
git add apps/android
git commit -m "feat(android): search screen with debounced query and category filters"
```

---

### Task 13: Business detail

**Files:**
- Create: `apps/android/app/src/main/java/com/manzil/consumer/feature/detail/DetailViewModel.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/feature/detail/DetailScreen.kt`
- Modify: `apps/android/app/src/main/java/com/manzil/consumer/nav/ManzilNavHost.kt`
- Modify: `apps/android/app/src/main/res/values/strings.xml`
- Test: `apps/android/app/src/test/java/com/manzil/consumer/feature/detail/DetailViewModelTest.kt`

**Interfaces:**
- Consumes: `BusinessRepository.detail/photos/recordVisit` (Task 6), `ReviewRepository.toggleHelpful/report` (Task 6), `SavedStore`, `AuthRepository.isSignedIn` (Task 9).
- Produces: `DetailUiState` (`Loading`, `Content(detail, photos, saved, signedIn)`, `Error(error)`), `DetailViewModel.state`, `.toggleSave()`, `.toggleHelpful(reviewId)`, `.report(reviewId, reason)`, `.retry()`, and `DetailScreen(slug, onReviewClick, onBack)`.

**Requirements:**
- `POST /v1/businesses/:slug/visit` fires **once** per screen entry, silently. It is the funnel denominator; double-firing corrupts it.
- **Review reporting must be surfaced.** Play's UGC policy requires in-app reporting, and the Expo prototype had none. Every review carries an overflow menu with "Shikoyat qilish".
- Helpful votes require auth. Tapping while signed out opens `AuthSheet` rather than failing.

- [ ] **Step 1: Write the failing test**

`DetailViewModelTest.kt`:

```kotlin
package com.manzil.consumer.feature.detail

import app.cash.turbine.test
import com.manzil.consumer.FakeSavedStore
import com.manzil.consumer.core.model.*
import com.manzil.consumer.core.result.ManzilError
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.data.repo.BusinessRepository
import com.manzil.consumer.data.repo.HelpfulVote
import com.manzil.consumer.data.repo.ReviewRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test

class DetailViewModelTest {

    private val dispatcher = StandardTestDispatcher()

    @Before fun setUp() = Dispatchers.setMain(dispatcher)
    @After fun tearDown() = Dispatchers.resetMain()

    private val business = Business(
        id = "b1", slug = "s", name = "N", categorySlug = "cafe",
        description = LocalizedText("u", "r", "e"), address = "A", district = "D",
        phone = null, location = null, hours = "09:00", priceTier = PriceTier.MID,
        rating = 4.5, reviewCount = 1, tags = emptyList(),
        website = null, instagram = null, telegram = null,
    )

    private val review = Review(
        id = "r1", authorName = "Aziz", authorBadge = null, rating = 5,
        text = "Zo'r", createdAt = "2026-07-30T10:00:00.000Z", helpfulCount = 2,
        verifiedVisit = true, ownerReply = null,
    )

    private class FakeBusinessRepository(
        private val detail: ManzilResult<BusinessDetail>,
    ) : BusinessRepository(api = throw UnsupportedOperationException()) {
        var visitCalls = 0
        override suspend fun detail(slug: String) = detail
        override suspend fun photos(slug: String) = ManzilResult.Success(listOf("https://cdn/a.jpg"))
        override suspend fun recordVisit(slug: String) { visitCalls++ }
    }

    private class FakeReviewRepository : ReviewRepository(api = throw UnsupportedOperationException()) {
        override suspend fun toggleHelpful(reviewId: String) =
            ManzilResult.Success(HelpfulVote(reviewId, 3, true))
    }

    @Test
    fun `loads the business, its reviews and its photos`() = runTest(dispatcher) {
        val vm = DetailViewModel(
            slug = "s",
            business = FakeBusinessRepository(ManzilResult.Success(BusinessDetail(business, listOf(review)))),
            reviews = FakeReviewRepository(),
            saved = FakeSavedStore(),
        )

        vm.state.test {
            assertEquals(DetailUiState.Loading, awaitItem())
            val content = awaitItem() as DetailUiState.Content
            assertEquals("N", content.detail.business.name)
            assertEquals(1, content.detail.reviews.size)
            assertEquals(listOf("https://cdn/a.jpg"), content.photos)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `the visit is recorded exactly once per screen entry`() = runTest(dispatcher) {
        val repo = FakeBusinessRepository(ManzilResult.Success(BusinessDetail(business, emptyList())))
        val vm = DetailViewModel("s", repo, FakeReviewRepository(), FakeSavedStore())

        vm.state.test {
            awaitItem(); awaitItem()
            cancelAndIgnoreRemainingEvents()
        }
        // Re-collecting the state must not fire a second visit.
        vm.state.test { cancelAndIgnoreRemainingEvents() }

        assertEquals(1, repo.visitCalls)
    }

    @Test
    fun `a missing business surfaces NotFound rather than an empty screen`() = runTest(dispatcher) {
        val vm = DetailViewModel(
            "gone",
            FakeBusinessRepository(ManzilResult.Failure(ManzilError.NotFound)),
            FakeReviewRepository(),
            FakeSavedStore(),
        )

        vm.state.test {
            awaitItem()
            assertEquals(ManzilError.NotFound, (awaitItem() as DetailUiState.Error).error)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `a helpful vote updates that review's count in place`() = runTest(dispatcher) {
        val vm = DetailViewModel(
            "s",
            FakeBusinessRepository(ManzilResult.Success(BusinessDetail(business, listOf(review)))),
            FakeReviewRepository(),
            FakeSavedStore(),
        )

        vm.state.test {
            awaitItem(); awaitItem()
            vm.toggleHelpful("r1")
            val updated = awaitItem() as DetailUiState.Content
            assertEquals(3, updated.detail.reviews.first { it.id == "r1" }.helpfulCount)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `photos failing does not prevent the business from rendering`() = runTest(dispatcher) {
        val repo = object : BusinessRepository(api = throw UnsupportedOperationException()) {
            override suspend fun detail(slug: String) =
                ManzilResult.Success(BusinessDetail(business, emptyList()))
            override suspend fun photos(slug: String) =
                ManzilResult.Failure(ManzilError.Server(500))
            override suspend fun recordVisit(slug: String) {}
        }
        val vm = DetailViewModel("s", repo, FakeReviewRepository(), FakeSavedStore())

        vm.state.test {
            awaitItem()
            val content = awaitItem() as DetailUiState.Content
            assertEquals(emptyList<String>(), content.photos)
            cancelAndIgnoreRemainingEvents()
        }
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*DetailViewModelTest'`
Expected: FAIL — `DetailViewModel` is unresolved.

- [ ] **Step 3: Write DetailViewModel.kt**

```kotlin
package com.manzil.consumer.feature.detail

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.manzil.consumer.core.model.BusinessDetail
import com.manzil.consumer.core.result.ManzilError
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.core.result.getOrNull
import com.manzil.consumer.data.local.SavedStore
import com.manzil.consumer.data.repo.BusinessRepository
import com.manzil.consumer.data.repo.ReviewRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface DetailUiState {
    data object Loading : DetailUiState
    data class Content(
        val detail: BusinessDetail,
        val photos: List<String>,
        val saved: Boolean,
    ) : DetailUiState
    data class Error(val error: ManzilError) : DetailUiState
}

@HiltViewModel
class DetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val business: BusinessRepository,
    private val reviews: ReviewRepository,
    private val saved: SavedStore,
) : ViewModel() {

    private val slug: String = checkNotNull(savedStateHandle["slug"])

    private val loaded = MutableStateFlow<ManzilResult<BusinessDetail>?>(null)
    private val photos = MutableStateFlow<List<String>>(emptyList())

    /** Guards the funnel denominator: one visit per screen entry, not per recomposition. */
    private var visitRecorded = false

    init { load() }

    val state: StateFlow<DetailUiState> =
        combine(loaded, photos, saved.isSaved(slug)) { result, photoUrls, isSaved ->
            when (result) {
                null -> DetailUiState.Loading
                is ManzilResult.Failure -> DetailUiState.Error(result.error)
                is ManzilResult.Success -> DetailUiState.Content(result.data, photoUrls, isSaved)
            }
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), DetailUiState.Loading)

    fun retry() = load()

    private fun load() = viewModelScope.launch {
        loaded.value = null
        loaded.value = business.detail(slug)

        if (loaded.value is ManzilResult.Success) {
            if (!visitRecorded) {
                visitRecorded = true
                business.recordVisit(slug)
            }
            // Photos are decoration: a failure leaves the list empty and the
            // carousel falls back to the typographic cover.
            photos.value = business.photos(slug).getOrNull().orEmpty()
        }
    }

    fun toggleSave() = viewModelScope.launch { saved.toggle(slug) }

    fun toggleHelpful(reviewId: String) = viewModelScope.launch {
        val vote = reviews.toggleHelpful(reviewId).getOrNull() ?: return@launch
        val current = (loaded.value as? ManzilResult.Success)?.data ?: return@launch
        loaded.value = ManzilResult.Success(
            current.copy(
                reviews = current.reviews.map {
                    if (it.id == reviewId) it.copy(helpfulCount = vote.helpfulCount) else it
                }
            )
        )
    }

    fun report(reviewId: String, reason: String) = viewModelScope.launch {
        reviews.report(reviewId, reason)
    }
}
```

> The test constructs `DetailViewModel(slug, business, reviews, saved)` directly.
> Give the class a secondary constructor taking `slug: String` that builds a
> `SavedStateHandle(mapOf("slug" to slug))`, or make the tests pass a
> `SavedStateHandle` — pick one and use it consistently in Tasks 13–14.

- [ ] **Step 4: Write DetailScreen.kt**

A `Scaffold` with a `TopAppBar` using `TopAppBarDefaults.exitUntilCollapsedScrollBehavior()` (the collapsing toolbar from spec §4), and a `LazyColumn` body:

1. **Photo carousel** — `HorizontalPager(state = rememberPagerState { photos.size })` of `AsyncImage`, 280dp tall, with a page indicator row. When `photos.isEmpty()`, render `TypographicCover(business.name, categoryLabel, business.district)` at the same height instead. Never a grey box.
2. **Decision block** — name in `displaySmall`, `RatingRow`, `business.hours`, `business.district`, `priceTier.label`.
3. **Action row** — Call (`Intent.ACTION_DIAL` with `tel:${business.phone}`, hidden when `phone == null`), Directions (`geo:${lat},${lng}?q=${Uri.encode(name)}`, hidden when `location == null`), Save (bound to `toggleSave`), Share (`Intent.ACTION_SEND` with `https://manzil.uz/businesses/$slug` — the App Link from Task 10, which is why sharing is worth having). Each is a 48dp target with a `contentDescription`.
4. **Description** — `business.description.forLanguage(currentLanguage)`.
5. **Reviews** — a header with the count, a gold "Sharh yozish" button (the screen's single gold CTA) calling `onReviewClick`, then each review as: author, `RatingRow`, text, a "Tasdiqlangan tashrif" badge when `verifiedVisit` (with a leading icon, so it is not colour-only), the owner reply indented in a `surfaceVariant` block when present, a helpful button showing `helpfulCount`, and an overflow `IconButton` opening a `DropdownMenu` with "Shikoyat qilish".
6. **Report dialog** — an `AlertDialog` with radio options `spam`, `offensive`, `fake`, `other`, confirming into `viewModel.report(reviewId, reason)` and showing a `Snackbar` on success.

Empty reviews render `EmptyState(title = R.string.detail_no_reviews_title, body = R.string.detail_no_reviews_body, actionLabel = R.string.detail_write_review, onAction = onReviewClick)` — being first to review is framed as an opportunity.

Strings:

```xml
<string name="detail_reviews">Sharhlar</string>
<string name="detail_write_review">Sharh yozish</string>
<string name="detail_no_reviews_title">Hali sharh yo\'q</string>
<string name="detail_no_reviews_body">Bu joy haqida birinchi bo\'lib fikr bildiring.</string>
<string name="detail_verified_visit">Tasdiqlangan tashrif</string>
<string name="detail_owner_reply">Biznes javobi</string>
<string name="detail_helpful">Foydali</string>
<string name="detail_report">Shikoyat qilish</string>
<string name="detail_report_title">Nima uchun shikoyat qilyapsiz?</string>
<string name="detail_report_spam">Spam</string>
<string name="detail_report_offensive">Haqoratli</string>
<string name="detail_report_fake">Soxta sharh</string>
<string name="detail_report_other">Boshqa</string>
<string name="detail_report_sent">Shikoyat yuborildi. Rahmat.</string>
<string name="action_call">Qo\'ng\'iroq qilish</string>
<string name="action_directions">Yo\'nalish</string>
<string name="action_share">Ulashish</string>
```

Wire the route: replace the `composable<BusinessRoute>` body with `DetailScreen(onReviewClick = { navController.navigate(ReviewRoute(slug, business.name)) }, onBack = navController::popBackStack)`.

- [ ] **Step 5: Run tests and commit**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*DetailViewModelTest'`
Expected: PASS — all five.

```bash
git add apps/android
git commit -m "feat(android): business detail with carousel, reviews and UGC reporting"
```

---

### Task 14: Review submission

**Files:**
- Create: `apps/android/app/src/main/java/com/manzil/consumer/feature/review/ReviewViewModel.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/feature/review/ReviewScreen.kt`
- Modify: `apps/android/app/src/main/java/com/manzil/consumer/nav/ManzilNavHost.kt`
- Modify: `apps/android/app/src/main/res/values/strings.xml`
- Test: `apps/android/app/src/test/java/com/manzil/consumer/feature/review/ReviewViewModelTest.kt`

**Interfaces:**
- Consumes: `ReviewRepository.submit(slug, rating, text)` (Task 6), `AuthRepository.isSignedIn` (Task 9).
- Produces: `ReviewUiState` (`Editing(rating, text, canSubmit)`, `NeedsAuth`, `Submitting`, `Submitted`, `Failed(error)`), `ReviewViewModel.state`, `.onRating(Int)`, `.onText(String)`, `.submit()`, `.dismissError()`, and `ReviewScreen(slug, businessName, onDone, onBack)`.

**Requirements:** reviews are rating + text only — **no photos in v1** (spec §2). A minimum text length discourages low-effort spam, matching the PRD. `ThrottleWrite` blocks for 2 minutes after 20 writes/minute, so the 429 state must name the wait rather than reading as a failure.

- [ ] **Step 1: Write the failing test**

`ReviewViewModelTest.kt`:

```kotlin
package com.manzil.consumer.feature.review

import app.cash.turbine.test
import com.manzil.consumer.core.model.Review
import com.manzil.consumer.core.result.ManzilError
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.data.repo.ReviewRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class ReviewViewModelTest {

    private val dispatcher = StandardTestDispatcher()

    @Before fun setUp() = Dispatchers.setMain(dispatcher)
    @After fun tearDown() = Dispatchers.resetMain()

    private class FakeReviewRepository(
        var result: ManzilResult<Review> = ManzilResult.Success(
            Review("r1", "A", null, 5, "text", "", 0, false, null)
        ),
    ) : ReviewRepository(api = throw UnsupportedOperationException()) {
        var submissions = 0
        var lastRating = 0
        var lastText = ""
        override suspend fun submit(slug: String, rating: Int, text: String): ManzilResult<Review> {
            submissions++
            lastRating = rating
            lastText = text
            return result
        }
    }

    private fun vm(
        repo: FakeReviewRepository = FakeReviewRepository(),
        signedIn: Boolean = true,
    ) = ReviewViewModel("s", repo, MutableStateFlow(signedIn))

    @Test
    fun `submission is blocked until a rating and long enough text exist`() = runTest(dispatcher) {
        val model = vm()

        model.state.test {
            assertFalse((awaitItem() as ReviewUiState.Editing).canSubmit)

            model.onRating(4)
            assertFalse((awaitItem() as ReviewUiState.Editing).canSubmit)

            model.onText("qisqa")
            assertFalse((awaitItem() as ReviewUiState.Editing).canSubmit)

            model.onText("Juda yaxshi joy, choyi zo'r va xizmat tez edi.")
            assertTrue((awaitItem() as ReviewUiState.Editing).canSubmit)

            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `a signed-out user sees NeedsAuth instead of the editor`() = runTest(dispatcher) {
        vm(signedIn = false).state.test {
            assertEquals(ReviewUiState.NeedsAuth, awaitItem())
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `a valid submission reaches the repository and ends in Submitted`() = runTest(dispatcher) {
        val repo = FakeReviewRepository()
        val model = vm(repo)

        model.state.test {
            awaitItem()
            model.onRating(5); awaitItem()
            model.onText("Juda yaxshi joy, choyi zo'r va xizmat tez edi."); awaitItem()

            model.submit()
            assertEquals(ReviewUiState.Submitting, awaitItem())
            assertEquals(ReviewUiState.Submitted, awaitItem())

            assertEquals(1, repo.submissions)
            assertEquals(5, repo.lastRating)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `submitting while invalid does not call the repository`() = runTest(dispatcher) {
        val repo = FakeReviewRepository()
        val model = vm(repo)

        model.state.test {
            awaitItem()
            model.submit()
            runCurrent()
            assertEquals(0, repo.submissions)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `a throttled submission reports the wait rather than a generic failure`() = runTest(dispatcher) {
        val repo = FakeReviewRepository(ManzilResult.Failure(ManzilError.RateLimited(2)))
        val model = vm(repo)

        model.state.test {
            awaitItem()
            model.onRating(5); awaitItem()
            model.onText("Juda yaxshi joy, choyi zo'r va xizmat tez edi."); awaitItem()

            model.submit()
            awaitItem() // Submitting
            assertEquals(ManzilError.RateLimited(2), (awaitItem() as ReviewUiState.Failed).error)
            cancelAndIgnoreRemainingEvents()
        }
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*ReviewViewModelTest'`
Expected: FAIL — `ReviewViewModel` is unresolved.

- [ ] **Step 3: Write ReviewViewModel.kt**

```kotlin
package com.manzil.consumer.feature.review

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.manzil.consumer.core.result.ManzilError
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.data.repo.AuthRepository
import com.manzil.consumer.data.repo.ReviewRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface ReviewUiState {
    data class Editing(val rating: Int, val text: String, val canSubmit: Boolean) : ReviewUiState
    data object NeedsAuth : ReviewUiState
    data object Submitting : ReviewUiState
    data object Submitted : ReviewUiState
    data class Failed(val error: ManzilError) : ReviewUiState
}

@HiltViewModel
class ReviewViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val reviews: ReviewRepository,
    auth: AuthRepository,
) : ViewModel() {

    private val slug: String = checkNotNull(savedStateHandle["slug"])
    private val signedIn: Flow<Boolean> = auth.isSignedIn

    private val rating = MutableStateFlow(0)
    private val text = MutableStateFlow("")
    private val submission = MutableStateFlow<ReviewUiState?>(null)

    val state: StateFlow<ReviewUiState> =
        combine(signedIn, rating, text, submission) { isSignedIn, r, t, inFlight ->
            when {
                inFlight != null -> inFlight
                !isSignedIn -> ReviewUiState.NeedsAuth
                else -> ReviewUiState.Editing(
                    rating = r,
                    text = t,
                    canSubmit = isValid(r, t),
                )
            }
        }.stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5_000),
            ReviewUiState.Editing(0, "", canSubmit = false),
        )

    fun onRating(value: Int) { rating.value = value.coerceIn(1, 5) }
    fun onText(value: String) { text.value = value }
    fun dismissError() { submission.value = null }

    fun submit() = viewModelScope.launch {
        // Guarded here as well as in the UI: a fast double-tap can outrun a
        // disabled button, and a rating of 0 would be rejected server-side.
        if (!isValid(rating.value, text.value)) return@launch

        submission.value = ReviewUiState.Submitting
        submission.value = when (val result = reviews.submit(slug, rating.value, text.value.trim())) {
            is ManzilResult.Success -> ReviewUiState.Submitted
            is ManzilResult.Failure -> ReviewUiState.Failed(result.error)
        }
    }

    private fun isValid(rating: Int, text: String) =
        rating in 1..5 && text.trim().length >= MIN_TEXT_LENGTH

    companion object {
        /** Matches the PRD's "minimum length to discourage low-effort spam". */
        const val MIN_TEXT_LENGTH = 20
    }
}
```

- [ ] **Step 4: Write ReviewScreen.kt**

A `Scaffold` with a back arrow and the business name as title. Body:

- **Star picker** — a `Row` of five 48dp `IconButton`s toggling `Icons.Rounded.Star`/`StarOutline` in `ManzilColors.Gold`. Each carries `contentDescription = pluralStringResource(R.plurals.review_star, index + 1, index + 1)` so TalkBack can set a rating.
- **Text field** — `OutlinedTextField`, `minLines = 5`, with a live counter reading `stringResource(R.string.review_min_chars, text.length, ReviewViewModel.MIN_TEXT_LENGTH)`. Below the minimum it renders in `MaterialTheme.colorScheme.error` **and** the counter text itself says what is needed — never colour alone.
- **Submit** — a gold `Button`, `enabled = canSubmit`, 48dp minimum.
- **`NeedsAuth`** — renders `AuthSheet(onDismiss = onBack, onSignedIn = { /* state recomputes */ })` from Task 9.
- **`Submitting`** — `LoadingState()`.
- **`Submitted`** — a `LaunchedEffect` calling `onDone()`, which pops back to detail and shows a snackbar. Detail reloads so the new review appears.
- **`Failed`** — `ErrorState(error, onRetry = viewModel::dismissError)`; for `RateLimited` the retry button is already suppressed by `ErrorState`.

Strings:

```xml
<string name="review_title">Sharh yozish</string>
<string name="review_rating_label">Bahoyingiz</string>
<string name="review_text_label">Tajribangiz haqida yozing</string>
<string name="review_min_chars">%1$d / kamida %2$d belgi</string>
<string name="review_submit">Yuborish</string>
<string name="review_submitted">Sharhingiz uchun rahmat.</string>
<plurals name="review_star">
    <item quantity="one">%1$d yulduz</item>
    <item quantity="other">%1$d yulduz</item>
</plurals>
```

Wire the route: replace the `composable<ReviewRoute>` body with `ReviewScreen(onDone = navController::popBackStack, onBack = navController::popBackStack)`.

- [ ] **Step 5: Run tests and commit**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*ReviewViewModelTest'`
Expected: PASS — all five.

```bash
git add apps/android
git commit -m "feat(android): review submission with auth gate and throttle state"
```

---

### Task 15: Saved screen

**Files:**
- Create: `apps/android/app/src/main/java/com/manzil/consumer/feature/saved/SavedViewModel.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/feature/saved/SavedScreen.kt`
- Modify: `apps/android/app/src/main/java/com/manzil/consumer/nav/ManzilNavHost.kt`
- Modify: `apps/android/app/src/main/res/values/strings.xml`
- Test: `apps/android/app/src/test/java/com/manzil/consumer/feature/saved/SavedViewModelTest.kt`

**Interfaces:**
- Consumes: `SavedStore.savedSlugs/remove` (Task 7), `BusinessRepository.detail` (Task 6).
- Produces: `SavedUiState` (`Loading`, `Content(businesses)`, `Empty`), `SavedViewModel.state`, `.remove(slug)`, `SavedScreen(onBusinessClick, onDiscoverClick)`.

**Constraint (spec §2):** saves are device-local and never synced. The screen must **say so** — a user who assumes their list is backed up and then reinstalls will be justifiably annoyed. A one-line footnote is enough; silence is not.

A saved slug can 404 if the business was unpublished. Those are dropped from the list and removed from the store, so the list self-heals rather than accumulating dead entries.

- [ ] **Step 1: Write the failing test**

`SavedViewModelTest.kt`:

```kotlin
package com.manzil.consumer.feature.saved

import app.cash.turbine.test
import com.manzil.consumer.FakeSavedStore
import com.manzil.consumer.core.model.*
import com.manzil.consumer.core.result.ManzilError
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.data.repo.BusinessRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class SavedViewModelTest {

    private val dispatcher = StandardTestDispatcher()

    @Before fun setUp() = Dispatchers.setMain(dispatcher)
    @After fun tearDown() = Dispatchers.resetMain()

    private fun business(slug: String) = Business(
        id = slug, slug = slug, name = slug.uppercase(), categorySlug = "cafe",
        description = LocalizedText("u", "r", "e"), address = "A", district = "D",
        phone = null, location = null, hours = "09:00", priceTier = PriceTier.MID,
        rating = 4.0, reviewCount = 1, tags = emptyList(),
        website = null, instagram = null, telegram = null,
    )

    private class FakeBusinessRepository(
        private val known: Set<String>,
    ) : BusinessRepository(api = throw UnsupportedOperationException()) {
        override suspend fun detail(slug: String) =
            if (slug in known) ManzilResult.Success(BusinessDetail(businessFor(slug), emptyList()))
            else ManzilResult.Failure(ManzilError.NotFound)

        override suspend fun photos(slug: String) = ManzilResult.Success(emptyList<String>())
        override suspend fun recordVisit(slug: String) {}

        private fun businessFor(slug: String) = Business(
            id = slug, slug = slug, name = slug.uppercase(), categorySlug = "cafe",
            description = LocalizedText("u", "r", "e"), address = "A", district = "D",
            phone = null, location = null, hours = "09:00", priceTier = PriceTier.MID,
            rating = 4.0, reviewCount = 1, tags = emptyList(),
            website = null, instagram = null, telegram = null,
        )
    }

    @Test
    fun `no saves yields Empty`() = runTest(dispatcher) {
        SavedViewModel(FakeSavedStore(), FakeBusinessRepository(emptySet())).state.test {
            assertTrue(awaitItem() is SavedUiState.Loading)
            assertTrue(awaitItem() is SavedUiState.Empty)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `saved slugs are hydrated into businesses`() = runTest(dispatcher) {
        val store = FakeSavedStore().apply { toggle("a"); toggle("b") }
        val vm = SavedViewModel(store, FakeBusinessRepository(setOf("a", "b")))

        vm.state.test {
            awaitItem() // Loading
            val content = awaitItem() as SavedUiState.Content
            assertEquals(setOf("a", "b"), content.businesses.map { it.slug }.toSet())
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `a saved business that no longer exists is dropped and unsaved`() = runTest(dispatcher) {
        val store = FakeSavedStore().apply { toggle("alive"); toggle("gone") }
        val vm = SavedViewModel(store, FakeBusinessRepository(setOf("alive")))

        vm.state.test {
            awaitItem() // Loading
            val content = awaitItem() as SavedUiState.Content
            assertEquals(listOf("alive"), content.businesses.map { it.slug })
            cancelAndIgnoreRemainingEvents()
        }

        // The dead slug is pruned so the list self-heals.
        assertEquals(setOf("alive"), store.savedSlugs.first())
    }

    @Test
    fun `removing a save updates the list`() = runTest(dispatcher) {
        val store = FakeSavedStore().apply { toggle("a"); toggle("b") }
        val vm = SavedViewModel(store, FakeBusinessRepository(setOf("a", "b")))

        vm.state.test {
            awaitItem(); awaitItem()
            vm.remove("a")
            val after = awaitItem() as SavedUiState.Content
            assertEquals(listOf("b"), after.businesses.map { it.slug })
            cancelAndIgnoreRemainingEvents()
        }
    }
}
```

Add `import kotlinx.coroutines.flow.first` to the test file.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*SavedViewModelTest'`
Expected: FAIL — `SavedViewModel` is unresolved.

- [ ] **Step 3: Write SavedViewModel.kt**

```kotlin
package com.manzil.consumer.feature.saved

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.manzil.consumer.core.model.BusinessSummary
import com.manzil.consumer.core.model.LocalizedText
import com.manzil.consumer.core.result.ManzilError
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.data.local.SavedStore
import com.manzil.consumer.data.repo.BusinessRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface SavedUiState {
    data object Loading : SavedUiState
    data class Content(val businesses: List<BusinessSummary>) : SavedUiState
    data object Empty : SavedUiState
}

@HiltViewModel
class SavedViewModel @Inject constructor(
    private val saved: SavedStore,
    private val business: BusinessRepository,
) : ViewModel() {

    val state: StateFlow<SavedUiState> = saved.savedSlugs
        .mapLatest { slugs ->
            if (slugs.isEmpty()) return@mapLatest SavedUiState.Empty

            val hydrated = coroutineScope {
                slugs.map { slug -> async { slug to business.detail(slug) } }.map { it.await() }
            }

            // A saved business can be unpublished or merged away. Pruning the
            // dead slug here means the list heals itself instead of showing a
            // permanent phantom the user cannot remove.
            hydrated
                .filter { (_, result) ->
                    (result as? ManzilResult.Failure)?.error == ManzilError.NotFound
                }
                .forEach { (slug, _) -> saved.remove(slug) }

            val businesses = hydrated.mapNotNull { (_, result) ->
                (result as? ManzilResult.Success)?.data?.business
            }.map { b ->
                BusinessSummary(
                    slug = b.slug,
                    name = b.name,
                    district = b.district,
                    categorySlug = b.categorySlug,
                    categoryName = LocalizedText(b.categorySlug, b.categorySlug, b.categorySlug),
                    rating = b.rating,
                    reviewCount = b.reviewCount,
                    priceTier = b.priceTier,
                    location = b.location,
                    coverUrl = null,
                )
            }

            if (businesses.isEmpty()) SavedUiState.Empty else SavedUiState.Content(businesses)
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), SavedUiState.Loading)

    fun remove(slug: String) = viewModelScope.launch { saved.remove(slug) }
}
```

- [ ] **Step 4: Write SavedScreen.kt**

A `LazyColumn` of `BusinessCard` with `saved = true` and `onSave = { viewModel.remove(it.slug) }`.

- `Loading` → `LoadingState()`
- `Empty` → `EmptyState(title = R.string.saved_empty_title, body = R.string.saved_empty_body, actionLabel = R.string.saved_empty_action, onAction = onDiscoverClick)`
- `Content` → the list, with a final non-clickable `item` rendering `R.string.saved_device_only` in `bodyMedium`/`onSurfaceVariant`.

Strings:

```xml
<string name="saved_title">Saqlangan joylar</string>
<string name="saved_empty_title">Hali hech narsa saqlanmagan</string>
<string name="saved_empty_body">Yoqqan joylarni saqlang — keyin shu yerda topasiz.</string>
<string name="saved_empty_action">Joylarni ko\'rish</string>
<string name="saved_device_only">Saqlangan joylar faqat shu qurilmada saqlanadi. Ilovani o\'chirsangiz, ro\'yxat ham o\'chadi.</string>
```

Wire the route: replace `composable<SavedRoute>` with `SavedScreen(onBusinessClick = { navController.navigate(BusinessRoute(it)) }, onDiscoverClick = { navController.navigate(SearchRoute()) })`.

- [ ] **Step 5: Run tests and commit**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*SavedViewModelTest'`
Expected: PASS — all four.

```bash
git add apps/android
git commit -m "feat(android): saved screen with self-healing device-local list"
```

---

### Task 16: Concierge

**Files:**
- Create: `apps/android/app/src/main/java/com/manzil/consumer/feature/concierge/ConciergeViewModel.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/feature/concierge/ConciergeScreen.kt`
- Modify: `apps/android/app/src/main/java/com/manzil/consumer/nav/ManzilNavHost.kt`
- Modify: `apps/android/app/src/main/res/values/strings.xml`
- Test: `apps/android/app/src/test/java/com/manzil/consumer/feature/concierge/ConciergeViewModelTest.kt`

**Interfaces:**
- Consumes: `ConciergeRepository.ask(query, locale)` (Task 6), `PrefsStore.language` (Task 7).
- Produces: `ConciergeUiState` (`Idle(prompts)`, `Thinking`, `Answered(reply)`, `Unavailable`, `Throttled(minutes)`, `Failed(error)`), `ConciergeViewModel.state`, `.ask(String)`, `.reset()`, `ConciergeScreen(onBusinessClick)`.

**Three distinct non-happy states, all required:**
1. **`Unavailable`** — a 200 with `available = false`. `ANTHROPIC_API_KEY` is unset or the model failed. Say the concierge is resting and point at Search. Never a spinner that never resolves.
2. **`Throttled`** — 429. `ThrottleGurman` is 10 per 15 minutes then a **30-minute block**, and Uzbek carriers NAT heavily so one IP can be many users. This will happen to innocent people; the copy must name the wait and not offer a retry button.
3. **`Failed`** — anything else.

Concierge stays public, matching the documented reasoning on `GurmanController` — the throttle is the cost control, not an auth wall.

- [ ] **Step 1: Write the failing test**

`ConciergeViewModelTest.kt`:

```kotlin
package com.manzil.consumer.feature.concierge

import app.cash.turbine.test
import com.manzil.consumer.FakePrefsStore
import com.manzil.consumer.core.model.ConciergeReply
import com.manzil.consumer.core.model.ConciergeSuggestion
import com.manzil.consumer.core.result.ManzilError
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.data.repo.ConciergeRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class ConciergeViewModelTest {

    private val dispatcher = StandardTestDispatcher()

    @Before fun setUp() = Dispatchers.setMain(dispatcher)
    @After fun tearDown() = Dispatchers.resetMain()

    private class FakeConciergeRepository(
        var result: ManzilResult<ConciergeReply>,
    ) : ConciergeRepository(api = throw UnsupportedOperationException()) {
        var lastLocale: String? = null
        override suspend fun ask(query: String, locale: String): ManzilResult<ConciergeReply> {
            lastLocale = locale
            return result
        }
    }

    @Test
    fun `starts Idle with suggested prompts`() = runTest(dispatcher) {
        val vm = ConciergeViewModel(
            FakeConciergeRepository(ManzilResult.Success(ConciergeReply("", emptyList(), true))),
            FakePrefsStore(),
        )
        vm.state.test {
            assertTrue((awaitItem() as ConciergeUiState.Idle).prompts.isNotEmpty())
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `an available reply becomes Answered with its suggestions`() = runTest(dispatcher) {
        val reply = ConciergeReply(
            text = "Chorsu Choyxona'ni tavsiya qilaman.",
            suggestions = listOf(ConciergeSuggestion("chorsu", "Chorsu Choyxona", "tinch")),
            available = true,
        )
        val vm = ConciergeViewModel(FakeConciergeRepository(ManzilResult.Success(reply)), FakePrefsStore())

        vm.state.test {
            awaitItem() // Idle
            vm.ask("tinch kafe")
            assertEquals(ConciergeUiState.Thinking, awaitItem())
            val answered = awaitItem() as ConciergeUiState.Answered
            assertEquals(1, answered.reply.suggestions.size)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `available false becomes Unavailable, not Answered with empty text`() = runTest(dispatcher) {
        val vm = ConciergeViewModel(
            FakeConciergeRepository(ManzilResult.Success(ConciergeReply("", emptyList(), false))),
            FakePrefsStore(),
        )

        vm.state.test {
            awaitItem(); vm.ask("plov"); awaitItem()
            assertEquals(ConciergeUiState.Unavailable, awaitItem())
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `a 429 becomes Throttled carrying the wait, not a generic failure`() = runTest(dispatcher) {
        val vm = ConciergeViewModel(
            FakeConciergeRepository(ManzilResult.Failure(ManzilError.RateLimited(30))),
            FakePrefsStore(),
        )

        vm.state.test {
            awaitItem(); vm.ask("plov"); awaitItem()
            assertEquals(ConciergeUiState.Throttled(30), awaitItem())
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `the question is asked in the user's language`() = runTest(dispatcher) {
        val repo = FakeConciergeRepository(ManzilResult.Success(ConciergeReply("x", emptyList(), true)))
        val vm = ConciergeViewModel(repo, FakePrefsStore(language = "ru"))

        vm.state.test {
            awaitItem(); vm.ask("кафе"); awaitItem(); awaitItem()
            assertEquals("ru", repo.lastLocale)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `a blank question is ignored`() = runTest(dispatcher) {
        val vm = ConciergeViewModel(
            FakeConciergeRepository(ManzilResult.Success(ConciergeReply("x", emptyList(), true))),
            FakePrefsStore(),
        )

        vm.state.test {
            val idle = awaitItem()
            vm.ask("   ")
            runCurrent()
            expectNoEvents()
            assertTrue(idle is ConciergeUiState.Idle)
            cancelAndIgnoreRemainingEvents()
        }
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*ConciergeViewModelTest'`
Expected: FAIL — `ConciergeViewModel` is unresolved.

- [ ] **Step 3: Write ConciergeViewModel.kt**

```kotlin
package com.manzil.consumer.feature.concierge

import androidx.annotation.StringRes
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.manzil.consumer.R
import com.manzil.consumer.core.model.ConciergeReply
import com.manzil.consumer.core.result.ManzilError
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.data.local.PrefsStore
import com.manzil.consumer.data.repo.ConciergeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface ConciergeUiState {
    data class Idle(@StringRes val prompts: List<Int>) : ConciergeUiState
    data object Thinking : ConciergeUiState
    data class Answered(val reply: ConciergeReply) : ConciergeUiState
    /** A 200 with available=false — the model is unconfigured or failed. */
    data object Unavailable : ConciergeUiState
    /** A 429. ThrottleGurman blocks for 30 minutes; say so rather than "error". */
    data class Throttled(val minutes: Int?) : ConciergeUiState
    data class Failed(val error: ManzilError) : ConciergeUiState
}

private val STARTER_PROMPTS = listOf(
    R.string.concierge_prompt_quiet,
    R.string.concierge_prompt_family,
    R.string.concierge_prompt_plov,
)

@HiltViewModel
class ConciergeViewModel @Inject constructor(
    private val concierge: ConciergeRepository,
    private val prefs: PrefsStore,
) : ViewModel() {

    private val _state = MutableStateFlow<ConciergeUiState>(ConciergeUiState.Idle(STARTER_PROMPTS))
    val state: StateFlow<ConciergeUiState> = _state.asStateFlow()

    fun ask(question: String) {
        if (question.isBlank()) return

        viewModelScope.launch {
            _state.value = ConciergeUiState.Thinking
            val locale = prefs.language.first()

            _state.value = when (val result = concierge.ask(question.trim(), locale)) {
                is ManzilResult.Success ->
                    if (result.data.available) ConciergeUiState.Answered(result.data)
                    else ConciergeUiState.Unavailable
                is ManzilResult.Failure -> when (val error = result.error) {
                    is ManzilError.RateLimited -> ConciergeUiState.Throttled(error.retryAfterMinutes)
                    else -> ConciergeUiState.Failed(error)
                }
            }
        }
    }

    fun reset() { _state.value = ConciergeUiState.Idle(STARTER_PROMPTS) }
}
```

- [ ] **Step 4: Write ConciergeScreen.kt**

A `Column`: a heading, a state body, and a pinned bottom input row (`OutlinedTextField` + send `IconButton`, both 48dp minimum, `imeAction = Send`).

- `Idle` → an intro line plus the three starter prompts as `ManzilChip`s that call `ask(stringResource(it))`.
- `Thinking` → `LoadingState()`.
- `Answered` → the reply text in `bodyLarge`, then each suggestion as a `Card` showing `name` in `titleMedium` and `reason` in `bodyMedium`, navigating to `onBusinessClick(slug)`. When `suggestions` is empty, render the text alone with a line pointing to Search.
- `Unavailable` → `EmptyState(title = R.string.concierge_unavailable_title, body = R.string.concierge_unavailable_body, actionLabel = R.string.concierge_use_search, onAction = onSearchClick)`.
- `Throttled` → `EmptyState(title = R.string.concierge_throttled_title, body = minutes?.let { stringResource(R.string.concierge_throttled_body_minutes, it) } ?: stringResource(R.string.concierge_throttled_body))`. **No retry button** — retrying inside the block extends it.
- `Failed` → `ErrorState(error, onRetry = viewModel::reset)`.

Strings:

```xml
<string name="concierge_title">Gurman</string>
<string name="concierge_intro">Nima qidirayotganingizni ayting — men joy tavsiya qilaman.</string>
<string name="concierge_input_hint">Masalan: uchrashuv uchun tinch kafe</string>
<string name="concierge_send">Yuborish</string>
<string name="concierge_prompt_quiet">Uchrashuv uchun tinch kafe</string>
<string name="concierge_prompt_family">Oila bilan kechki ovqat</string>
<string name="concierge_prompt_plov">Yaqin atrofda eng zo\'r palov</string>
<string name="concierge_unavailable_title">Gurman hozir dam olmoqda</string>
<string name="concierge_unavailable_body">Tavsiyalar vaqtincha ishlamayapti. Qidiruvdan foydalanib ko\'ring — u to\'liq ishlayapti.</string>
<string name="concierge_use_search">Qidiruvga o\'tish</string>
<string name="concierge_throttled_title">Biroz sekinlashtiraylik</string>
<string name="concierge_throttled_body">Juda ko\'p savol yuborildi. Birozdan so\'ng qayta urinib ko\'ring.</string>
<string name="concierge_throttled_body_minutes">Juda ko\'p savol yuborildi. %1$d daqiqadan so\'ng qayta urinib ko\'ring. Shu orada qidiruvdan foydalanishingiz mumkin.</string>
```

Wire the route: replace `composable<ConciergeRoute>` with `ConciergeScreen(onBusinessClick = { navController.navigate(BusinessRoute(it)) }, onSearchClick = { navController.navigate(SearchRoute()) })`.

- [ ] **Step 5: Run tests and commit**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*ConciergeViewModelTest'`
Expected: PASS — all six.

```bash
git add apps/android
git commit -m "feat(android): concierge with unavailable and throttled states"
```

---

### Task 17: Profile, language switching and account deletion

**Files:**
- Create: `apps/android/app/src/main/java/com/manzil/consumer/feature/profile/ProfileViewModel.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/feature/profile/ProfileScreen.kt`
- Create: `apps/android/app/src/main/res/xml/locales_config.xml`
- Modify: `apps/android/app/src/main/AndroidManifest.xml`
- Modify: `apps/android/app/src/main/java/com/manzil/consumer/nav/ManzilNavHost.kt`
- Modify: `apps/android/app/src/main/res/values/strings.xml`
- Test: `apps/android/app/src/test/java/com/manzil/consumer/feature/profile/ProfileViewModelTest.kt`

**Interfaces:**
- Consumes: `AuthRepository.currentUser/signOut/refreshFromBackend` (Task 9), `PrefsStore.language/setLanguage` (Task 7).
- Produces: `ProfileUiState(user, language)`, `ProfileViewModel.state`, `.setLanguage(String)`, `.signOut()`, `ProfileScreen(onSignInClick)`.

**Play blocker (spec §7, finding 1):** Google Play requires any app with account creation to offer **in-app account deletion** plus a publicly reachable web deletion URL. The API has no deletion endpoint — that is Workstream B. This task ships the **UI and the web fallback link**; the button stays disabled with an explanatory line until the endpoint exists. Shipping the screen without the row would hide the gap until submission.

- [ ] **Step 1: Write the failing test**

`ProfileViewModelTest.kt`:

```kotlin
package com.manzil.consumer.feature.profile

import app.cash.turbine.test
import com.manzil.consumer.FakePrefsStore
import com.manzil.consumer.data.repo.AuthRepository
import com.manzil.consumer.data.repo.AuthUser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

class ProfileViewModelTest {

    private val dispatcher = StandardTestDispatcher()

    @Before fun setUp() = Dispatchers.setMain(dispatcher)
    @After fun tearDown() = Dispatchers.resetMain()

    private class FakeAuthRepository(user: AuthUser?) : AuthRepository(api = throw UnsupportedOperationException()) {
        val users = MutableStateFlow(user)
        override val currentUser = users
        var signedOut = false
        override suspend fun signOut() { signedOut = true; users.value = null }
    }

    @Test
    fun `a signed-out user has no profile but still has a language`() = runTest(dispatcher) {
        ProfileViewModel(FakeAuthRepository(null), FakePrefsStore()).state.test {
            val state = awaitItem()
            assertNull(state.user)
            assertEquals("uz", state.language)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `a signed-in user is exposed`() = runTest(dispatcher) {
        val user = AuthUser("u1", "Aziz", "a@b.uz", "uz", "consumer")
        ProfileViewModel(FakeAuthRepository(user), FakePrefsStore()).state.test {
            assertEquals("Aziz", awaitItem().user?.displayName)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `changing the language persists it`() = runTest(dispatcher) {
        val prefs = FakePrefsStore()
        val vm = ProfileViewModel(FakeAuthRepository(null), prefs)

        vm.state.test {
            assertEquals("uz", awaitItem().language)
            vm.setLanguage("ru")
            assertEquals("ru", awaitItem().language)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `an unsupported language is rejected and uz is kept`() = runTest(dispatcher) {
        val vm = ProfileViewModel(FakeAuthRepository(null), FakePrefsStore())

        vm.state.test {
            awaitItem()
            vm.setLanguage("fr")
            runCurrent()
            expectNoEvents()
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `signing out clears the user`() = runTest(dispatcher) {
        val auth = FakeAuthRepository(AuthUser("u1", "Aziz", null, "uz", "consumer"))
        val vm = ProfileViewModel(auth, FakePrefsStore())

        vm.state.test {
            assertEquals("Aziz", awaitItem().user?.displayName)
            vm.signOut()
            assertNull(awaitItem().user)
            cancelAndIgnoreRemainingEvents()
        }
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*ProfileViewModelTest'`
Expected: FAIL — `ProfileViewModel` is unresolved.

- [ ] **Step 3: Write ProfileViewModel.kt**

```kotlin
package com.manzil.consumer.feature.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.manzil.consumer.data.local.PrefsStore
import com.manzil.consumer.data.repo.AuthRepository
import com.manzil.consumer.data.repo.AuthUser
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileUiState(
    val user: AuthUser?,
    val language: String,
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val auth: AuthRepository,
    private val prefs: PrefsStore,
) : ViewModel() {

    val state: StateFlow<ProfileUiState> =
        combine(auth.currentUser, prefs.language) { user, language ->
            ProfileUiState(user, language)
        }.stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5_000),
            ProfileUiState(user = null, language = PrefsStore.DEFAULT_LANGUAGE),
        )

    fun setLanguage(language: String) = viewModelScope.launch { prefs.setLanguage(language) }

    fun signOut() = viewModelScope.launch { auth.signOut() }
}
```

- [ ] **Step 4: Write ProfileScreen.kt**

A `LazyColumn` of rows, each at least 48dp tall:

1. **Identity** — when signed in, `user.displayName` in `headlineSmall` and `user.email ?: ""` beneath. When signed out, a gold "Kirish" button opening `AuthSheet`.
2. **Language** — three `ManzilChip`s (O'zbekcha / Русский / English). Selecting one calls `viewModel.setLanguage(tag)` **and** applies it immediately:

```kotlin
AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))
```

Add `implementation("androidx.appcompat:appcompat:1.7.1")` for `AppCompatDelegate`. Because `android:localeConfig` is declared, the app also appears in Android's system per-app language picker, and the system's choice and this one stay in sync.

3. **Legal** — rows opening `https://manzil.uz/uz/legal/privacy` and `https://manzil.uz/uz/legal/terms` in a Custom Tab, plus an "Ochiq kodli litsenziyalar" row rendering the two OFL files bundled in Task 2.
4. **Account deletion** — a `danger`-coloured row, `enabled = false` for now, with a supporting line: `stringResource(R.string.profile_delete_pending)`. Beneath it, an always-enabled link to `https://manzil.uz/uz/profile/delete` — the publicly reachable deletion URL Play requires. When Workstream B lands the endpoint, enable the row, wire it to an `AlertDialog` confirming with the word "O'CHIRISH" typed, then call the endpoint, sign out and return to Home.
5. **Sign out** — visible only when signed in.
6. **Version** — `BuildConfig.VERSION_NAME`, useful in support conversations.

`res/xml/locales_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<locale-config xmlns:android="http://schemas.android.com/apk/res/android">
    <locale android:name="uz" />
    <locale android:name="ru" />
    <locale android:name="en" />
</locale-config>
```

Add `android:localeConfig="@xml/locales_config"` to the `<application>` tag.

Strings:

```xml
<string name="profile_title">Profil</string>
<string name="profile_sign_in">Kirish</string>
<string name="profile_sign_out">Chiqish</string>
<string name="profile_language">Til</string>
<string name="profile_privacy">Maxfiylik siyosati</string>
<string name="profile_terms">Foydalanish shartlari</string>
<string name="profile_licenses">Ochiq kodli litsenziyalar</string>
<string name="profile_delete">Hisobni o\'chirish</string>
<string name="profile_delete_pending">Bu funksiya tayyorlanmoqda. Hozircha veb-saytdan o\'chirishingiz mumkin.</string>
<string name="profile_delete_web">Veb-saytda o\'chirish</string>
<string name="profile_version">Versiya %1$s</string>
```

Wire the route: replace `composable<ProfileRoute>` with `ProfileScreen(onSignInClick = { /* opens AuthSheet in-place */ })`.

- [ ] **Step 5: Run tests and commit**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*ProfileViewModelTest'`
Expected: PASS — all five.

```bash
git add apps/android
git commit -m "feat(android): profile with language switching and deletion entry point"
```

---

### Task 18: Location

**Files:**
- Create: `apps/android/app/src/main/java/com/manzil/consumer/data/location/LocationProvider.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/feature/search/LocationPrompt.kt`
- Modify: `apps/android/app/src/main/AndroidManifest.xml`
- Modify: `apps/android/app/src/main/java/com/manzil/consumer/feature/search/SearchScreen.kt`
- Modify: `apps/android/app/src/main/res/values/strings.xml`
- Test: `apps/android/app/src/test/java/com/manzil/consumer/data/location/LocationStateTest.kt`

**Interfaces:**
- Consumes: Task 12's `SearchViewModel.onLocationChange(LatLng?)`.
- Produces: `LocationProvider.lastKnown(): LatLng?`, `LocationPermissionState` enum `{ GRANTED, DENIED, NOT_REQUESTED }`, and `LocationPrompt(state, onRequest, onDismiss)`.

**Constraint:** only `ACCESS_COARSE_LOCATION` is requested. Fine location would trigger Play's stricter justification requirements and buys nothing — distance sort at city scale does not need metre precision.

**All three states from `screen-map.md` get real UI:** granted, denied, and approximate-only. On Android 12+ a user can grant approximate location while denying precise; since the app only ever asks for coarse, that grant is a full success and must not be treated as degraded.

- [ ] **Step 1: Write the failing test**

`LocationStateTest.kt`:

```kotlin
package com.manzil.consumer.data.location

import android.content.pm.PackageManager
import com.manzil.consumer.core.model.LatLng
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class LocationStateTest {

    @Test
    fun `a granted coarse permission is GRANTED`() {
        assertEquals(
            LocationPermissionState.GRANTED,
            locationPermissionState(
                coarseResult = PackageManager.PERMISSION_GRANTED,
                everRequested = true,
            )
        )
    }

    @Test
    fun `denied after asking is DENIED`() {
        assertEquals(
            LocationPermissionState.DENIED,
            locationPermissionState(
                coarseResult = PackageManager.PERMISSION_DENIED,
                everRequested = true,
            )
        )
    }

    @Test
    fun `never asked is NOT_REQUESTED, so the app can explain before prompting`() {
        assertEquals(
            LocationPermissionState.NOT_REQUESTED,
            locationPermissionState(
                coarseResult = PackageManager.PERMISSION_DENIED,
                everRequested = false,
            )
        )
    }

    @Test
    fun `a null android Location maps to a null LatLng rather than zero zero`() {
        assertNull(toLatLng(null))
    }

    @Test
    fun `a real android Location maps across`() {
        val location = android.location.Location("test").apply {
            latitude = 41.3111
            longitude = 69.2401
        }
        assertEquals(LatLng(41.3111, 69.2401), toLatLng(location))
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*LocationStateTest'`
Expected: FAIL — `LocationPermissionState`, `locationPermissionState` and `toLatLng` are unresolved.

- [ ] **Step 3: Write LocationProvider.kt**

```kotlin
package com.manzil.consumer.data.location

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.manzil.consumer.core.model.LatLng
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.suspendCancellableCoroutine
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.coroutines.resume

enum class LocationPermissionState { GRANTED, DENIED, NOT_REQUESTED }

/** Pure, so the decision table is unit-testable without a device. */
fun locationPermissionState(coarseResult: Int, everRequested: Boolean): LocationPermissionState = when {
    coarseResult == PackageManager.PERMISSION_GRANTED -> LocationPermissionState.GRANTED
    everRequested -> LocationPermissionState.DENIED
    else -> LocationPermissionState.NOT_REQUESTED
}

/** A null Location must stay null — (0,0) is in the Atlantic, not Tashkent. */
fun toLatLng(location: android.location.Location?): LatLng? =
    location?.let { LatLng(it.latitude, it.longitude) }

@Singleton
class LocationProvider @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val client by lazy { LocationServices.getFusedLocationProviderClient(context) }

    fun hasCoarsePermission(): Boolean =
        ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED

    /**
     * Coarse only. Distance sort at city scale does not need metre precision,
     * and requesting fine location would invite Play's stricter justification
     * review for no product gain.
     */
    @SuppressLint("MissingPermission")
    suspend fun lastKnown(): LatLng? {
        if (!hasCoarsePermission()) return null

        return suspendCancellableCoroutine { continuation ->
            client.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, null)
                .addOnSuccessListener { continuation.resume(toLatLng(it)) }
                .addOnFailureListener { continuation.resume(null) }
        }
    }
}
```

Add to the manifest, above `<application>`:

```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

Add `implementation(libs.play.location)` to `app/build.gradle.kts`.

- [ ] **Step 4: Write LocationPrompt.kt and wire it into Search**

```kotlin
package com.manzil.consumer.feature.search

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.res.stringResource
import com.manzil.consumer.R
import com.manzil.consumer.data.location.LocationPermissionState

/**
 * Explains before it asks. A bare system dialog with no context is the most
 * common reason users deny location permanently — and a permanent denial
 * cannot be re-prompted.
 */
@Composable
fun LocationPrompt(
    state: LocationPermissionState,
    onGranted: () -> Unit,
    onDismiss: () -> Unit,
) {
    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted -> if (granted) onGranted() else onDismiss() }

    when (state) {
        LocationPermissionState.GRANTED -> Unit

        LocationPermissionState.NOT_REQUESTED -> AssistChip(
            onClick = { launcher.launch(Manifest.permission.ACCESS_COARSE_LOCATION) },
            label = { Text(stringResource(R.string.location_enable)) },
        )

        // Denied is a legitimate end state, not an error. Search keeps working;
        // it just cannot sort by distance. Deep-linking to settings would be
        // presumptuous, so this only explains what is lost.
        LocationPermissionState.DENIED -> Text(
            text = stringResource(R.string.location_denied_note),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}
```

In `SearchScreen`, hold `var permission by remember { mutableStateOf(...) }` seeded from `LocationProvider.hasCoarsePermission()` and `PrefsStore.locationPromptShown`, render `LocationPrompt` under the filter chips, and on grant call `viewModel.onLocationChange(locationProvider.lastKnown())` inside a `LaunchedEffect`. Persist `setLocationPromptShown(true)` when the launcher returns so the chip is not shown forever.

Strings:

```xml
<string name="location_enable">Yaqin atrofdagilarni ko\'rsatish</string>
<string name="location_denied_note">Joylashuv o\'chirilgan — masofa bo\'yicha saralash ishlamaydi. Qidiruvning qolgan qismi ishlaydi.</string>
```

- [ ] **Step 5: Run tests and commit**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*LocationStateTest'`
Expected: PASS — all five.

```bash
git add apps/android
git commit -m "feat(android): coarse location with all three permission states"
```

---

### Task 19: 2GIS map

**Files:**
- Modify: `apps/android/app/build.gradle.kts`
- Modify: `apps/android/app/src/main/java/com/manzil/consumer/ManzilApp.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/feature/map/MapScreen.kt`
- Create: `apps/android/app/src/main/java/com/manzil/consumer/feature/map/MapViewModel.kt`
- Modify: `apps/android/app/src/main/java/com/manzil/consumer/nav/ManzilNavHost.kt`
- Modify: `.gitignore`
- Test: `apps/android/app/src/test/java/com/manzil/consumer/feature/map/MapViewModelTest.kt`

**Interfaces:**
- Consumes: `SearchRepository.search` (Task 6), `LocationProvider` (Task 18).
- Produces: `MapUiState(businesses, center, selected)`, `MapViewModel.state`, `.select(slug)`, `.dismissSelection()`, `MapScreen(category, onBusinessClick, onBack)`.

**Why 2GIS and not Google (spec §3):** materially better POI, address and building coverage in Uzbekistan. Uzbek users navigate by landmark and building number, both of which 2GIS models properly and Google does not.

**Prerequisite — API key.** Register the application ID `com.manzil.consumer` at `dev.2gis.com` and obtain a `dgissdk.key` file. It goes in `app/src/main/assets/dgissdk.key` and **must not be committed** (already ignored in Task 1). Document it in `local.properties.example`. The SDK's key is specific to the Mobile SDK and cannot be reused from another 2GIS product. **Do not start this task until the key exists** — the SDK cannot initialise without it and everything below is untestable on a device.

Businesses with no `lat`/`lng` cannot be pinned. They are counted and surfaced as a line above the map ("N ta joy xaritada ko'rsatilmaydi") rather than silently vanishing.

- [ ] **Step 1: Write the failing test**

`MapViewModelTest.kt`:

```kotlin
package com.manzil.consumer.feature.map

import app.cash.turbine.test
import com.manzil.consumer.core.model.*
import com.manzil.consumer.core.result.ManzilResult
import com.manzil.consumer.data.repo.SearchRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

class MapViewModelTest {

    private val dispatcher = StandardTestDispatcher()

    @Before fun setUp() = Dispatchers.setMain(dispatcher)
    @After fun tearDown() = Dispatchers.resetMain()

    private fun summary(slug: String, location: LatLng?) = BusinessSummary(
        slug = slug, name = slug, district = "D", categorySlug = "cafe",
        categoryName = LocalizedText("Kafe", "Кафе", "Cafe"),
        rating = 4.0, reviewCount = 1, priceTier = PriceTier.MID,
        location = location, coverUrl = null,
    )

    private class FakeSearchRepository(
        private val result: List<BusinessSummary>,
    ) : SearchRepository(api = throw UnsupportedOperationException()) {
        override suspend fun search(query: String, category: String, near: LatLng?) =
            ManzilResult.Success(result)
    }

    @Test
    fun `only businesses with coordinates become pins`() = runTest(dispatcher) {
        val vm = MapViewModel(
            category = "all",
            search = FakeSearchRepository(listOf(
                summary("pinned", LatLng(41.31, 69.24)),
                summary("unpinnable", null),
            )),
        )

        vm.state.test {
            awaitItem() // initial
            val state = awaitItem()
            assertEquals(listOf("pinned"), state.pins.map { it.slug })
            assertEquals(1, state.hiddenCount)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `the map centres on Tashkent when nothing has coordinates`() = runTest(dispatcher) {
        val vm = MapViewModel("all", FakeSearchRepository(listOf(summary("a", null))))

        vm.state.test {
            awaitItem()
            assertEquals(TASHKENT_CENTER, awaitItem().center)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `the map centres on the first pin when one exists`() = runTest(dispatcher) {
        val here = LatLng(41.31, 69.24)
        val vm = MapViewModel("all", FakeSearchRepository(listOf(summary("a", here))))

        vm.state.test {
            awaitItem()
            assertEquals(here, awaitItem().center)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `selecting and dismissing a pin round-trips`() = runTest(dispatcher) {
        val vm = MapViewModel("all", FakeSearchRepository(listOf(summary("a", LatLng(41.31, 69.24)))))

        vm.state.test {
            awaitItem(); awaitItem()
            vm.select("a")
            assertEquals("a", awaitItem().selected?.slug)
            vm.dismissSelection()
            assertNull(awaitItem().selected)
            cancelAndIgnoreRemainingEvents()
        }
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*MapViewModelTest'`
Expected: FAIL — `MapViewModel` is unresolved.

- [ ] **Step 3: Write MapViewModel.kt**

```kotlin
package com.manzil.consumer.feature.map

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.manzil.consumer.core.model.BusinessSummary
import com.manzil.consumer.core.model.LatLng
import com.manzil.consumer.core.result.getOrNull
import com.manzil.consumer.data.repo.SearchRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

/** Chorsu. A sensible fallback when nothing in the result set can be pinned. */
val TASHKENT_CENTER = LatLng(41.3264, 69.2285)

data class MapUiState(
    val pins: List<BusinessSummary> = emptyList(),
    /** Listings with no coordinates. Counted, never silently dropped. */
    val hiddenCount: Int = 0,
    val center: LatLng = TASHKENT_CENTER,
    val selected: BusinessSummary? = null,
)

@HiltViewModel
class MapViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val search: SearchRepository,
) : ViewModel() {

    private val category: String = savedStateHandle["category"] ?: "all"

    private val _state = MutableStateFlow(MapUiState())
    val state: StateFlow<MapUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            val businesses = search.search(query = "", category = category, near = null)
                .getOrNull().orEmpty()
            val pins = businesses.filter { it.location != null }

            _state.value = MapUiState(
                pins = pins,
                hiddenCount = businesses.size - pins.size,
                center = pins.firstOrNull()?.location ?: TASHKENT_CENTER,
            )
        }
    }

    fun select(slug: String) {
        _state.update { it.copy(selected = it.pins.firstOrNull { pin -> pin.slug == slug }) }
    }

    fun dismissSelection() {
        _state.update { it.copy(selected = null) }
    }
}
```

- [ ] **Step 4: Add the SDK and initialise it**

Add to `app/build.gradle.kts`:

```kotlin
implementation(libs.dgis.sdk.map)
implementation(libs.dgis.compose.map)
```

The `artifactory.2gis.dev` repository was already declared in Task 1's `settings.gradle.kts`.

Extend `ManzilApp.onCreate`:

```kotlin
package com.manzil.consumer

import android.app.Application
import com.clerk.api.Clerk
import dagger.hilt.android.HiltAndroidApp
import ru.dgis.sdk.DGis

@HiltAndroidApp
class ManzilApp : Application() {

    /** The SDK context is a singleton — created once, here, never per-screen. */
    lateinit var dgisContext: ru.dgis.sdk.Context
        private set

    override fun onCreate() {
        super.onCreate()
        Clerk.initialize(this, publishableKey = BuildConfig.CLERK_PUBLISHABLE_KEY)
        // Reads the API key from assets/dgissdk.key.
        dgisContext = DGis.initialize(applicationContext)
    }
}
```

Verify the exact `DGis.initialize` overload against the release notes for the pinned SDK version at https://docs.2gis.com/en/android/sdk/releases/latest before writing — 2GIS has changed this signature across major versions. If initialisation fails because the key is absent, catch it and set a flag that makes `MapScreen` render `EmptyState(R.string.map_unavailable_title, R.string.map_unavailable_body)`; a missing map must not crash the app.

- [ ] **Step 5: Write MapScreen.kt**

Render `MapComposable` from `ru.dgis.sdk.compose.map`, sized to fill, with:

- The camera positioned at `state.center` at zoom 13.
- One marker per `state.pins` entry, tapping a marker calling `viewModel.select(slug)`.
- When `state.selected != null`, a `ModalBottomSheet` showing a compact `BusinessCard` for that business, tapping through to `onBusinessClick(slug)`.
- When `state.hiddenCount > 0`, a `Surface` banner above the map reading `pluralStringResource(R.plurals.map_hidden, hiddenCount, hiddenCount)`.
- A back arrow calling `onBack`.

Consult https://docs.2gis.com/en/android/sdk/examples/controls/compose for the exact `MapComposable` parameters and marker API in the pinned version — the composable takes a prepared `Map` object rather than raw coordinates, and the construction of that object is version-specific.

Strings:

```xml
<string name="map_title">Xarita</string>
<string name="map_unavailable_title">Xarita hozir ishlamayapti</string>
<string name="map_unavailable_body">Ro\'yxat ko\'rinishidan foydalaning — u to\'liq ishlayapti.</string>
<plurals name="map_hidden">
    <item quantity="one">%1$d ta joyning manzili aniqlanmagan — xaritada ko\'rsatilmaydi.</item>
    <item quantity="other">%1$d ta joyning manzili aniqlanmagan — xaritada ko\'rsatilmaydi.</item>
</plurals>
```

Wire the route: replace `composable<MapRoute>` with `MapScreen(onBusinessClick = { navController.navigate(BusinessRoute(it)) }, onBack = navController::popBackStack)`.

- [ ] **Step 6: Run tests and commit**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*MapViewModelTest'`
Expected: PASS — all four.

Manually verify on a device: the map renders Tashkent, pins appear for businesses with coordinates, tapping a pin opens the sheet, and the app still starts if `dgissdk.key` is removed.

```bash
git add apps/android
git commit -m "feat(android): 2GIS map with pins and unmappable-listing count"
```

---

### Task 20: Localisation — Russian and English

**Files:**
- Create: `apps/android/app/src/main/res/values-ru/strings.xml`
- Create: `apps/android/app/src/main/res/values-en/strings.xml`
- Create: `apps/android/app/src/test/java/com/manzil/consumer/LocalisationTest.kt`
- Modify: `apps/android/app/src/main/res/values/strings.xml` (audit pass)

**Interfaces:**
- Consumes: every string key defined in Tasks 1–19.
- Produces: complete `values-ru/` and `values-en/` overlays and a test that fails when a key is added to the default without a translation.

**Source:** `packages/shared/src/ui-copy.ts` already holds trilingual copy for the web. Port the equivalent phrases rather than inventing new ones, so the app and the site say the same thing. Where the app has no web equivalent (throttle states, permission copy, the device-local saves note), write fresh copy in all three.

Uzbek Latin and Russian Cyrillic both run longer than English. Where a translation is more than ~30% longer than the Uzbek, check the affected screen at 320dp width and at the largest font scale before accepting it.

- [ ] **Step 1: Write the failing test**

`LocalisationTest.kt`:

```kotlin
package com.manzil.consumer

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import javax.xml.parsers.DocumentBuilderFactory

class LocalisationTest {

    private fun keysIn(path: String): Set<String> {
        val file = File(path)
        assertTrue("Missing resource file: $path", file.exists())

        val doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(file)
        val names = mutableSetOf<String>()

        listOf("string", "plurals").forEach { tag ->
            val nodes = doc.getElementsByTagName(tag)
            for (i in 0 until nodes.length) {
                val node = nodes.item(i)
                // Skip <item> children of <plurals>, which share the tag name.
                if (node.parentNode?.nodeName == "resources") {
                    node.attributes.getNamedItem("name")?.nodeValue?.let(names::add)
                }
            }
        }
        return names
    }

    private val base = "src/main/res"

    @Test
    fun `russian translates every default key`() {
        val missing = keysIn("$base/values/strings.xml") - keysIn("$base/values-ru/strings.xml")
        assertEquals("Untranslated in ru: $missing", emptySet<String>(), missing)
    }

    @Test
    fun `english translates every default key`() {
        val missing = keysIn("$base/values/strings.xml") - keysIn("$base/values-en/strings.xml")
        assertEquals("Untranslated in en: $missing", emptySet<String>(), missing)
    }

    @Test
    fun `no overlay defines a key the default does not have`() {
        val default = keysIn("$base/values/strings.xml")
        assertEquals(emptySet<String>(), keysIn("$base/values-ru/strings.xml") - default)
        assertEquals(emptySet<String>(), keysIn("$base/values-en/strings.xml") - default)
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*LocalisationTest'`
Expected: FAIL — `values-ru/strings.xml` and `values-en/strings.xml` do not exist.

- [ ] **Step 3: Audit the default file**

Read `values/strings.xml` end to end. For every key confirm: it is actually referenced somewhere (delete it if not), it uses positional format specifiers (`%1$s`, not `%s`) so translators can reorder, and any string with a count is a `<plurals>`, not a `<string>`.

- [ ] **Step 4: Write the Russian overlay**

Create `values-ru/strings.xml` translating every key. A representative subset, to fix tone — formal «вы», no exclamation marks, no transliterated English where a Russian word exists:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Manzil</string>
    <string name="tab_home">Главная</string>
    <string name="tab_search">Поиск</string>
    <string name="tab_concierge">Гурман</string>
    <string name="tab_saved">Сохранённые</string>
    <string name="tab_profile">Профиль</string>

    <string name="error_network">Нет подключения к интернету. Проверьте связь и попробуйте снова.</string>
    <string name="error_rate_limited">Слишком много запросов. Подождите немного и попробуйте снова.</string>
    <string name="error_rate_limited_minutes">Слишком много запросов. Попробуйте через %1$d мин.</string>
    <string name="error_unauthorized">Для этого действия нужно войти в аккаунт.</string>
    <string name="error_not_found">Не найдено.</string>
    <string name="error_server">Ошибка сервера. Попробуйте позже.</string>
    <string name="error_unknown">Что-то пошло не так.</string>

    <string name="action_save">Сохранить</string>
    <string name="action_unsave">Убрать из сохранённых</string>
    <string name="action_retry">Повторить</string>
    <string name="cover_no_photo">Фото пока нет</string>
    <string name="rating_no_reviews">Пока нет отзывов</string>
    <string name="distance_km">%1$.1f км</string>

    <string name="home_empty_title">Платформа только начинается</string>
    <string name="home_empty_body">Пока показывать почти нечего. Воспользуйтесь поиском или добавьте свой бизнес — станьте первым.</string>

    <string name="saved_device_only">Сохранённые места хранятся только на этом устройстве. При удалении приложения список пропадёт.</string>

    <string name="concierge_unavailable_title">Гурман сейчас отдыхает</string>
    <string name="concierge_unavailable_body">Рекомендации временно недоступны. Попробуйте поиск — он работает полностью.</string>
    <string name="concierge_throttled_body_minutes">Слишком много вопросов. Попробуйте через %1$d мин. Пока можно воспользоваться поиском.</string>

    <plurals name="rating_with_reviews">
        <item quantity="one">%1$.1f, %2$d отзыв</item>
        <item quantity="few">%1$.1f, %2$d отзыва</item>
        <item quantity="many">%1$.1f, %2$d отзывов</item>
        <item quantity="other">%1$.1f, %2$d отзыва</item>
    </plurals>
</resources>
```

Russian needs `one`/`few`/`many`/`other`; Uzbek and English need only `one`/`other`. Getting this wrong produces "12 отзыв", which reads as broken software. Translate every remaining key in the same file.

- [ ] **Step 5: Write the English overlay**

Create `values-en/strings.xml` with the same key set. Representative subset:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Manzil</string>
    <string name="tab_home">Home</string>
    <string name="tab_search">Search</string>
    <string name="tab_concierge">Gurman</string>
    <string name="tab_saved">Saved</string>
    <string name="tab_profile">Profile</string>

    <string name="error_network">No internet connection. Check your connection and try again.</string>
    <string name="error_rate_limited">Too many requests. Wait a moment and try again.</string>
    <string name="error_rate_limited_minutes">Too many requests. Try again in %1$d min.</string>
    <string name="error_unauthorized">Sign in to do that.</string>
    <string name="error_not_found">Not found.</string>
    <string name="error_server">Server error. Try again shortly.</string>
    <string name="error_unknown">Something went wrong.</string>

    <string name="action_save">Save</string>
    <string name="action_unsave">Remove from saved</string>
    <string name="action_retry">Try again</string>
    <string name="cover_no_photo">No photo yet</string>
    <string name="rating_no_reviews">No reviews yet</string>
    <string name="distance_km">%1$.1f km</string>

    <string name="home_empty_title">The platform is just getting started</string>
    <string name="home_empty_body">There is not much to show yet. Try a search, or add your business and be the first.</string>

    <string name="saved_device_only">Saved places are stored on this device only. Uninstalling the app clears the list.</string>

    <string name="concierge_unavailable_title">Gurman is resting</string>
    <string name="concierge_unavailable_body">Recommendations are temporarily unavailable. Search is working normally.</string>
    <string name="concierge_throttled_body_minutes">Too many questions. Try again in %1$d min. Search still works in the meantime.</string>

    <plurals name="rating_with_reviews">
        <item quantity="one">%1$.1f, %2$d review</item>
        <item quantity="other">%1$.1f, %2$d reviews</item>
    </plurals>
</resources>
```

- [ ] **Step 6: Verify each language on a device**

Run the app and switch through all three from Profile. Check specifically: the bottom tab labels do not truncate in Russian, `home_empty_body` wraps without clipping at 320dp, and the Cyrillic display face renders in Unbounded rather than falling back — compare a Russian heading against a Latin one; a fallback is visible as a different letterform.

- [ ] **Step 7: Run tests and commit**

Run: `cd apps/android && ./gradlew :app:testDebugUnitTest --tests '*LocalisationTest'`
Expected: PASS — all three.

```bash
git add apps/android
git commit -m "feat(android): Russian and English localisation with coverage test"
```

---

### Task 21: Play Store readiness

**Files:**
- Modify: `apps/android/app/build.gradle.kts`
- Modify: `apps/android/app/proguard-rules.pro`
- Create: `apps/android/app/src/main/baseline-prof.txt`
- Create: `apps/android/RELEASE.md`
- Modify: `.github/workflows/android.yml`

**Interfaces:**
- Consumes: everything.
- Produces: a signable, minified AAB and a written release checklist.

- [ ] **Step 1: Configure release signing**

Add to `app/build.gradle.kts` above `buildTypes`:

```kotlin
    signingConfigs {
        create("release") {
            storeFile = localProps.getProperty("RELEASE_STORE_FILE")?.let { file(it) }
            storePassword = secret("RELEASE_STORE_PASSWORD", "")
            keyAlias = secret("RELEASE_KEY_ALIAS", "")
            keyPassword = secret("RELEASE_KEY_PASSWORD", "")
        }
    }
```

and `signingConfig = signingConfigs.getByName("release")` inside the `release` block, guarded so a developer without the keystore can still build:

```kotlin
    if (localProps.getProperty("RELEASE_STORE_FILE") != null) {
        signingConfig = signingConfigs.getByName("release")
    }
```

Generate the upload keystore **outside the repository**:

```bash
keytool -genkeypair -v -keystore ~/manzil-upload.jks -keyalg RSA -keysize 4096 \
  -validity 10000 -alias manzil-upload
```

Back it up somewhere durable. Losing it means losing the ability to update the app. Enrol in **Play App Signing** so Google holds the app signing key and this one is only the upload key — recoverable if lost. Note in `RELEASE.md` that `apps/mobile/android/app/debug.keystore` is committed and that this is acceptable only because it is a debug key; the release keystore must never follow it.

- [ ] **Step 2: Add ProGuard rules**

`app/proguard-rules.pro`:

```proguard
# kotlinx.serialization keeps its generated serializers via reflection.
-if @kotlinx.serialization.Serializable class **
-keepclassmembers class <1> {
    static <1>$Companion Companion;
}
-keepclasseswithmembers class **.*$serializer { *; }
-keepclassmembers class ** { *** Companion; }

# Retrofit interfaces are proxied at runtime.
-keep,allowobfuscation,allowshrinking interface retrofit2.Call
-keep,allowobfuscation,allowshrinking class retrofit2.Response
-keepattributes Signature, InnerClasses, EnclosingMethod, RuntimeVisibleAnnotations

# 2GIS ships native code reached through JNI.
-keep class ru.dgis.sdk.** { *; }

# Clerk models are deserialised reflectively.
-keep class com.clerk.api.** { *; }
```

Build and **install the release variant on a device**. R8 breakage is invisible in debug and is the single most common way an Android app ships broken: `./gradlew :app:installRelease`, then exercise home, search, detail, review and concierge.

- [ ] **Step 3: Add crash reporting**

Add the Sentry Gradle plugin and `implementation("io.sentry:sentry-android:8.24.0")`, initialising it in `ManzilApp.onCreate` with the DSN read from `secret("SENTRY_DSN", "")`. **Do not enable it when the DSN is blank** — a misconfigured SDK that fails on every start is worse than no reporting. Set `tracesSampleRate = 0.1` and enable `isEnableUserInteractionTracing`. Confirm the ProGuard mapping file uploads on release builds, or every stack trace arrives obfuscated and useless.

- [ ] **Step 4: Generate a baseline profile**

Add the `androidx.baselineprofile` plugin and a `:baselineprofile` test module that exercises cold start → Home → Search → Detail, then run `./gradlew :app:generateReleaseBaselineProfile`. This measurably improves cold start and scroll jank on the low-to-mid-range devices that dominate the Uzbek market — the users most likely to abandon a slow first launch.

- [ ] **Step 5: Write RELEASE.md**

`apps/android/RELEASE.md` must contain, as a checklist:

**Blocking on other workstreams:**
- [ ] Account deletion endpoint exists (Workstream B) and the Profile row is enabled
- [ ] `https://manzil.uz/uz/profile/delete` is publicly reachable — Play requires a web deletion URL as well as the in-app path
- [ ] Privacy policy and terms rewritten to Uzbek standard (Workstream C) and reachable at stable URLs
- [ ] `/v1/search` filters `status: "claimed"` and `mergedIntoId: null` (Workstream B) — until then the app's client-side filter is the only thing preventing unclaimed listings from appearing
- [ ] Legal sign-off on O'RQ-547 data localisation (`ceo-office/LEGAL-REVIEW-REQUIRED.md`) — **blocks launch, not development**

**Store listing:**
- [ ] `targetSdk = 36`; Play requires Android 16 for new submissions from 2026-08-31
- [ ] AAB built and signed; enrolled in Play App Signing
- [ ] Feature graphic (1024×500) and at least 4 screenshots per language (uz, ru, en)
- [ ] Short and full descriptions in all three languages
- [ ] Privacy policy URL set
- [ ] Content rating questionnaire completed

**Data Safety form:**
- [ ] Approximate location — collected, not shared, used for app functionality, optional
- [ ] Email address and phone number — collected via Clerk for account management
- [ ] No user-supplied photos in v1
- [ ] Data deletion request path declared

**UGC compliance** (reviews make this a UGC app):
- [ ] In-app reporting works end to end (Task 13) and lands in the moderation queue
- [ ] Moderation is actually staffed — an unworked queue is a policy violation, not just a backlog
- [ ] `UserStatus`/`bannedAt` enforcement verified

**Pre-submission verification:**
- [ ] Release build installed and manually exercised on a physical device (R8 check)
- [ ] Clerk bot protection enabled on the phone/SMS factor
- [ ] `https://manzil.uz/.well-known/assetlinks.json` published with the **release** signing certificate SHA-256, and App Links verified (`adb shell pm get-app-links com.manzil.consumer`)
- [ ] TalkBack pass over search → detail → review
- [ ] Largest font scale and 320dp width checked in all three languages
- [ ] Dark theme checked on every screen

- [ ] **Step 6: Extend CI**

Add a `release-build` job to `.github/workflows/android.yml` running `./gradlew :app:bundleRelease` on tags, with the keystore supplied from repository secrets and decoded at runtime. It must **fail the build if `local.properties` is present in the checkout** — that would mean a secret was committed.

- [ ] **Step 7: Commit**

```bash
git add apps/android .github/workflows/android.yml
git commit -m "chore(android): release signing, R8 rules, Sentry, baseline profile, release checklist"
```

---

### Task 22: Retire the Expo prototype

**Files:**
- Move: `apps/mobile/PRODUCT.md` → `tech-office/android/design/PRODUCT.md`
- Move: `apps/mobile/DESIGN.md` → `tech-office/android/design/DESIGN.md`
- Delete: `apps/mobile/`, `apps/mobile-old/`, `Manzil.apk`
- Modify: `tech-office/android/design/PRODUCT.md` (amend the anti-references)
- Modify: `package.json` (remove the workspace entry)
- Modify: `docs/superpowers/specs/2026-08-03-android-consumer-app-design.md` (close §11)

**Do this last.** The prototype is the only rendered reference for several screens; deleting it before the Kotlin equivalents exist removes something the implementer may want to look at.

- [ ] **Step 1: Move the product documents first**

```bash
git mv apps/mobile/PRODUCT.md tech-office/android/design/PRODUCT.md
git mv apps/mobile/DESIGN.md tech-office/android/design/DESIGN.md
git commit -m "docs(android): move product and design docs out of the Expo prototype"
```

These remain the product source of truth and outlive the prototype.

- [ ] **Step 2: Amend the anti-references**

The spec (§4) requires this rather than leaving a silent contradiction. `PRODUCT.md` currently warns against decoration; the rebuild is deliberately more expressive. Replace the Anti-references section with:

```markdown
## Anti-references

Avoid generic directory apps with flat lists and no trust signals. Avoid
over-decorated AI chat-first products where the assistant hides the core search
workflow. Avoid tourist-brochure styling, heavy gradients, tiny labels, or
layouts that break when Uzbek or Russian text wraps.

**Decoration versus confidence.** These warnings target decoration that
competes with information — ornament that makes a rating harder to find. They
are not an argument for timidity. The app should be visually confident: large
display type, whole coloured surfaces, real photography, and a designed
no-photo state. The test is whether a visual choice helps a user decide where
to go. Large type on a business name helps. A gradient behind a rating does not.
```

- [ ] **Step 3: Confirm nothing depends on the prototype**

```bash
grep -rn "apps/mobile" --include="*.json" --include="*.ts" --include="*.tsx" \
  --include="*.yml" --include="*.md" . | grep -v node_modules | grep -v docs/superpowers
```

Every remaining hit must be a doc reference you are about to update. `@manzil/shared` is consumed by `apps/web` as well, so it stays.

- [ ] **Step 4: Delete**

```bash
git rm -r apps/mobile apps/mobile-old
rm -f Manzil.apk   # untracked (gitignored) — plain rm, not git rm
```

Remove `"apps/mobile"` from the `workspaces` array in the root `package.json`, then:

```bash
npm install   # regenerates package-lock.json without the removed workspace
```

- [ ] **Step 5: Verify the monorepo still builds**

Run: `npm run build` (or the repo's equivalent) and `npx tsc --noEmit`
Expected: unchanged results. Nothing outside `apps/mobile` referenced it.

- [ ] **Step 6: Close the spec's open items**

Update the §11 table in the design spec to record the resolutions:

| Item | Resolution |
|---|---|
| Archivo Cyrillic | **Resolved.** Archivo declares `latin`, `latin-ext`, `menu`, `vietnamese` only — no Cyrillic. Display is **Unbounded**, body **IBM Plex Sans**; both declare `cyrillic` and `cyrillic-ext`. |
| O'RQ-547 data localisation | Open. CEO office. Blocks launch, not development. |
| 2GIS key and Compose integration | **Resolved.** `ru.dgis.sdk:sdk-map` + `ru.dgis.sdk:compose-map` from `artifactory.2gis.dev/sdk-maven-release`; key file `assets/dgissdk.key` registered against `com.manzil.consumer`; `DGis.initialize(applicationContext)`. |
| Play `targetSdk` | **Resolved.** API 36 (Android 16), required for new submissions from 2026-08-31. |

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: retire the Expo prototype in favour of the native Android app"
```

---

## Self-Review

Run after the plan is written, before execution starts.

**1. Spec coverage**

| Spec section | Covered by |
|---|---|
| §3 architecture, single module, package layout | Task 1, File Structure |
| §3 stack table (Compose, Nav, Retrofit, Hilt, DataStore, Coil, 2GIS, location, Clerk) | Tasks 1, 4, 7, 9, 10, 18, 19 |
| §3 reuse — tokens, copy, screen map, principles | Tasks 2, 20, 22 |
| §4 photography leads, typographic no-photo state | Task 8 |
| §4 type hierarchy, gold scarcity, Material Symbols | Tasks 2, 8, 10 |
| §4 three shapes on Home | Task 11 |
| §4 motion — shared element, collapsing toolbar, press-scale | Tasks 8, 13 |
| §4 dark theme, dynamic colour disabled | Task 2 |
| §4 typography prerequisite | **Resolved** — Archivo has no Cyrillic; Unbounded + IBM Plex Sans (Task 2) |
| §4 amend PRODUCT.md anti-references | Task 22 |
| §5 every endpoint | Tasks 4, 6 |
| §5 client-side distance sort | Task 6 |
| §5 throttle states designed | Tasks 3, 8, 14, 16 |
| §5 error localisation | Task 3 |
| §6 nav, tab back stacks, deep links, App Links | Task 10 |
| §6 auth, anonymous default, gate points, bot protection | Task 9 |
| §6 language, `localeConfig`, in-app switching | Tasks 17, 20 |
| §6 DataStore, coarse location, three permission states | Tasks 7, 18 |
| §9 AAB, targetSdk 36, Data Safety, UGC, listing assets, Sentry, R8, baseline profile | Tasks 13, 21 |
| §10 unit tests, contract tests, Compose UI tests, a11y | Tasks 5, 8, 10, and every ViewModel task |
| §11 open items | Resolved in Tasks 2, 19, 21; recorded in Task 22 |

**Gap accepted:** the spec's shared-element transition (`SharedTransitionLayout`) is described in Task 13 but has no automated test — Compose transition assertions are brittle. It is on the Task 21 manual checklist instead.

**2. Placeholder scan** — no "TBD"/"TODO"/"implement later". Three places defer deliberately, each with an explicit reason and a named alternative: the Clerk API surface (verify against the pinned release), the 2GIS `MapComposable` parameters (version-specific), and the account-deletion endpoint (Workstream B). Each says what to do if the assumption fails.

**3. Type consistency** — verified across tasks: `ManzilResult`/`ManzilError` (3) used unchanged in 6, 9, 11–19. `BusinessSummary` (6) consumed identically by 8, 11, 12, 15, 19. `PriceTier.fromRaw` (6) is the single normaliser for both `priceTier` shapes. `SavedStore.toggle/remove` (7) called from 11, 13, 15. `AuthRepository.isSignedIn` (9) consumed by 13, 14, 17. `LatLng` (6) flows through 12, 18, 19. `haversineKm` (6) reused in 12.

**One inconsistency found and fixed during review:** `RatingRow` collapses its semantics with `clearAndSetSemantics`, which removes the `"4.6"` and `"12"` text nodes from the semantics tree — Task 8's original test asserted on those nodes and would have failed. The test now asserts the merged content description instead, and a no-reviews case was added.

**4. Scope** — 22 tasks is large for one plan, but the tasks are strictly sequential within one deliverable and splitting would produce plans that cannot ship independently. Tasks 1–10 (foundation and data layer) are a natural checkpoint: at Task 10 the app builds, talks to the live API, authenticates, and navigates, with no screens. That is the right place to pause and reassess if the schedule slips.

