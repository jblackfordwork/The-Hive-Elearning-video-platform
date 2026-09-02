# Firebase Setup — The Hive Training Center

The web application can live entirely in GitHub Pages or Netlify. Firebase supplies Google Authentication and Cloud Firestore data storage.

## 1. Create the Firebase project

1. Open the Firebase Console and create a project for The Hive Training Center.
2. Add a **Web app** to the project.
3. Copy the web configuration values shown by Firebase.
4. Create a local `.env` from `.env.example` and fill in each `VITE_FIREBASE_*` value.

The Firebase browser configuration is not a server password. Access to training data is enforced by Firebase Authentication and `firestore.rules`.

## 2. Turn on Google sign-in

1. Firebase Console → **Authentication** → **Sign-in method**.
2. Enable **Google**.
3. Select the project support email and save.
4. Authentication → **Settings** → **Authorized domains**.
5. Add every hostname that will serve the site, for example:
   - `YOUR-GITHUB-USERNAME.github.io`
   - your Netlify hostname, such as `the-hive-training.netlify.app`
   - any future custom domain.

Optional school-account restriction is configured with:

```env
VITE_ALLOWED_EMAIL_DOMAINS=students.geneseeisd.org,geneseeisd.org
```

Leave that variable empty if any Google account should be allowed.

## 3. Create Cloud Firestore

1. Firebase Console → **Firestore Database** → **Create database**.
2. Choose the region appropriate for the school.
3. Start in production mode.
4. Replace the generated rules with the contents of `firestore.rules` and publish them.

You can also deploy the included rules with the Firebase CLI script:

```bash
npm ci
firebase login
firebase use YOUR_FIREBASE_PROJECT_ID
npm run deploy:firebase
```

## 4. Bootstrap the first administrator

This is intentionally a manual one-time step so a new student cannot make themselves an administrator.

1. Deploy/run the site with Firebase configured.
2. Sign in once with the Google account that should own the system.
3. The site automatically creates `users/{uid}` with `role: "student"`.
4. Firebase Console → Firestore → `users` → open that user's document.
5. Change `role` from `student` to `admin`.
6. The open website should update automatically; if not, sign out and back in.

After this, use **Admin Access** inside The Hive Training Center to promote other signed-in users. Administrators are prevented by the UI from removing their own administrator role.

## 5. GitHub Pages variables

In GitHub, open the repository → **Settings** → **Secrets and variables** → **Actions** → **Variables**. Add:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_ALLOWED_EMAIL_DOMAINS`

Then repository **Settings** → **Pages** → Source: **GitHub Actions**.

Pushing to `main` runs tests, builds the Vite site, and publishes `dist/`.

## 6. Netlify alternative

Import the same GitHub repository in Netlify. `netlify.toml` already specifies:

- Build command: `npm run build`
- Publish directory: `dist`

Add the same `VITE_*` environment values in Netlify site settings, then add the Netlify hostname to Firebase Authentication's authorized domains.

## Data collections

The app creates these collections as needed:

- `users`
- `courses` with nested `lessons` and nested `questions`
- `assignments`
- `progress`
- `attempts`

Do not manually create these collections ahead of time.

## Static-host quiz integrity note

The GitHub-Pages-first build performs grading in the student's browser. Attempts are recorded and Firestore rules restrict normal writes, but this is not a tamper-resistant high-stakes testing system. A determined technical user can inspect browser-delivered quiz data. For equipment training this may be acceptable; if stronger assessment security is needed later, move only the grading function to a Netlify Function or another server-side endpoint. The attempt data model is already designed for that migration.
