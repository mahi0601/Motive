# Motive — Free Distribution (no Play Store, no $25)

Goal: a working Android APK you can hand to anyone, with a free backend.
Everything is free, but you must create two free accounts (MongoDB Atlas + Render).

---

## The 4 steps

### 1. Free database — MongoDB Atlas
1. Sign up at https://www.mongodb.com/cloud/atlas (free **M0** tier).
2. Create a cluster → **Database Access**: add a user + password.
3. **Network Access** → allow `0.0.0.0/0` (so Render can connect).
4. **Connect → Drivers** → copy the connection string:
   `mongodb+srv://<user>:<pass>@cluster0.xxxx.mongodb.net/motive?retryWrites=true&w=majority`

### 2. Free backend — Render
1. Push `motive-backend/` to a GitHub repo.
2. Sign up at https://render.com → **New → Blueprint** → connect the repo.
3. Render reads `motive-backend/render.yaml` and pre-fills everything except:
   - **MONGO_URI** → paste the Atlas string from step 1.
   - (Email vars only if you use reminders.)
4. Deploy. You get a URL like `https://motive-backend.onrender.com`.
5. Verify it's live: open `https://motive-backend.onrender.com/api/health` → should return `{"status":"ok"}`.

> Free tier note: Render sleeps the service after ~15 min idle; the first request after
> sleep takes ~30s to wake. Fine for personal/free distribution.

### 3. Point the app at the live backend
Edit `Motive/.env`:
```
VITE_API_BASE_URL=https://motive-backend.onrender.com
```

### 4. Build the distributable APK
```bash
cd Motive
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
npm run apk
# → android/app/build/outputs/apk/release/app-release.apk
```
Share that `.apk` file (Google Drive link, email, etc.). To install: open it on an
Android phone → allow "install from unknown sources" → Install.

---

## Already configured for you
- `render.yaml` sets `FRONTEND_URL=https://localhost,capacitor://localhost` and the
  cross-site cookie flags (`COOKIE_SAMESITE=none`, `COOKIE_SECURE=true`) the native
  webview needs for login/refresh to work.
- Release signing keystore + `npm run apk` one-command build.

## If login still fails after deploy
- Confirm `/api/health` returns ok (DB connected).
- Confirm `.env` URL has **no trailing slash** and uses **https**.
- Google sign-in (`gapi-script`) may need an Android OAuth client in Google Cloud
  Console using package `com.motive.app` + SHA-1
  `00:B6:8D:14:67:CF:72:B8:57:29:A9:BE:8B:65:B0:68:C4:9E:70:47`.

---

## Want the Play Store later?
That path needs the $25 fee + identity verification (unavoidable). The signed
**AAB** for it is already buildable: `cd android && ./gradlew bundleRelease`.
