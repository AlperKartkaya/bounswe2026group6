# NEPH Android Client

Native Kotlin + Jetpack Compose mobile app handling the emergency mobile flows (help requests and volunteer availability) with offline synchronization capabilities.

## Running the App on an Emulator

The easiest way to get a virtual phone running is via the official Android Studio app.

### 1. Setup the Virtual Phone
1. Go to developer.android.com/studio and download **Android Studio**. Install and open it.
2. Click the "More Actions" dropdown (⋮) on the main menu, and select **Virtual Device Manager**. (If a project is already open, click the phone icon in the top right).
3. Click **Create Device**, choose a standard phone (e.g. Pixel), and click Next/Finish to download the phone image.
4. Click the **Play button (▶️)** next to your new device to turn it on.
5. Wait 1-2 minutes for the phone to completely finish booting and show the Google home screen.

### 2. Install the Application
1. Open up Finder on your Mac and navigate to: `android/app/build/outputs/apk/debug/`
2. Locate the file named `app-debug.apk`.
3. With your virtual phone open, **drag and drop** the `app-debug.apk` file directly onto the virtual phone's screen.
4. Wait a few seconds, and the installed app icon will appear on the virtual phone. Click it to launch!
