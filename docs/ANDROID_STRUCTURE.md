# Android Project Structure

This document outlines the directory layout for the native Android implementation used by the Perspective App.

```text
perspective-android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/perspective/
│   │   │   │   ├── MainActivity.kt
│   │   │   │   ├── ui/
│   │   │   │   │   ├── theme/
│   │   │   │   │   │   ├── Color.kt
│   │   │   │   │   │   ├── Theme.kt
│   │   │   │   │   │   └── Type.kt
│   │   │   │   │   ├── screens/
│   │   │   │   │   │   ├── OnboardingScreen.kt
│   │   │   │   │   │   ├── DashboardScreen.kt
│   │   │   │   │   │   ├── ExerciseScreen.kt
│   │   │   │   │   │   ├── EchoScoreScreen.kt
│   │   │   │   │   │   └── SettingsScreen.kt
│   │   │   │   │   └── components/
│   │   │   │   │       ├── EchoScoreCard.kt
│   │   │   │   │       ├── ExerciseCard.kt
│   │   │   │   │       └── PerspectiveInput.kt
│   │   │   │   ├── data/
│   │   │   │   │   ├── models/
│   │   │   │   │   ├── repository/
│   │   │   │   │   └── api/
│   │   │   │   └── viewmodel/
│   │   │   └── res/
│   │   └── test/
│   └── build.gradle.kts
└── gradle/
```
