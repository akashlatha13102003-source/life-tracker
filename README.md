# Life Tracker

A personal tracker for workouts, spending, water and goals. It runs on iPhone as a home-screen web app.
It's free: GitHub Pages hosts the app and Firebase (free Spark plan) stores the data.

## How your data stays private

- The code in this repository is public. **Your data is not.** It lives in your own Firebase database.
- You must sign in to see anything. Database rules (`firestore.rules`) only let **your** account read or
  write **your** data. Anyone who opens the website without your password sees only the sign-in screen.
- The Firebase settings in `firebase-config.js` are meant to be public. They only identify the project
  and give no access by themselves.
- After you create your account, you turn off new sign-ups and lock the rules to your User ID (step 4).

## Setup

### 1. Firebase (free, no credit card)
1. Go to https://console.firebase.google.com and sign in with your Google account.
2. **Create a project**, e.g. `life-tracker`. You can turn Google Analytics off.
3. **Build → Authentication → Get started → Email/Password → Enable → Save.**
4. **Build → Firestore Database → Create database.** Pick location `asia-south1 (Mumbai)` and choose
   **production mode**.
5. In Firestore, open the **Rules** tab, paste the contents of `firestore.rules`, and click **Publish**.
6. **Project settings (⚙️) → General → Your apps → Web (`</>`)**. Register the app (no hosting needed) and copy
   the `firebaseConfig` values into `firebase-config.js`.

### 2. GitHub Pages
1. On GitHub, create a **new repository** (e.g. `life-tracker`). It must be **Public** for free Pages.
2. **Add file → Upload files**, then drag in everything from this folder, including the `icons` folder.
   Click **Commit changes**.
3. **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `root` → Save.**
4. After about 1 minute your app is live at `https://<your-username>.github.io/life-tracker/`.

### 3. iPhone
1. Open the link in **Safari** → tap **Create my account** (use a strong password).
2. Tap **Share → Add to Home Screen**. Open it from the home screen and sign in once.

### 4. Lock it down (2 minutes)
1. In the app: **⚙️ Settings → Copy my User ID**.
2. Firebase → Firestore → **Rules**: change `request.auth.uid == userId` to
   `request.auth.uid == userId && userId == "YOUR-USER-ID"` → **Publish**.
3. Firebase → Authentication → **Settings → User actions** → untick **Enable create (sign-up)** → Save.

### 5. Water reminders
In the app: **Water → How to set up reminders**. It uses the free iPhone **Shortcuts** app.

## Test mode
If `firebase-config.js` is left as `null`, the app runs in test mode and saves data in the browser only.
