# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# ── Clientglass release rules (R8 is on for release builds) ───────────────────
# Capacitor starts the web view, then loads its bridge and plugins BY NAME from
# assets/capacitor.plugins.json and calls them from JavaScript via reflection and
# @JavascriptInterface. Renaming or removing those classes would leave the app
# starting to a blank screen, so they are kept as they are. Everything else (the
# bulk of androidx and Material) is still shrunk.
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.** { *; }
-keep class com.motive.app.** { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Readable crash reports: keep file names and line numbers, hide the file name.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
