# The Hive Training Center

A lightweight equipment-training LMS for **Genesee Career Institute — The Hive School Store**.

The site is designed to deploy as static files on **GitHub Pages** or **Netlify** while Firebase handles Google sign-in and persistent training records. It does not require Supabase, MongoDB, an always-on Node server, a transcript service, or AI-generated quizzes.

## Features

- Google sign-in with automatic user profile creation
- Optional school Google-domain restriction
- Student dashboard for assigned equipment courses
- Ordered video lessons with sequential locking
- YouTube, external MP4/WebM, and repository-hosted `public/training-videos/` videos
- Administrator-authored quiz question banks
- Randomized question selection and shuffled choices per attempt
- Configurable questions-per-attempt and passing score
- Automatic progress and completion tracking
- Immutable quiz attempt history for administrator review
- Student drilldown showing exact questions/answers/results
- Course creation, editing, publishing, and archiving
- Bulk course assignment to students
- Administrator role management
- GitHub Pages deployment workflow and Netlify config
- Firestore security rules included

## Student lesson flow

1. Open an assigned course.
2. Complete the current training video.
3. The lesson quiz unlocks automatically.
4. Submit the randomized quiz.
5. A passing score completes the lesson and unlocks the next video.
6. A failed attempt can be retried with a newly randomized question set.

## Local development

```bash
cp .env.example .env
# Fill in the Firebase web configuration values.
npm ci
npm test
npm run dev
```

## Deployment

See [`docs/FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md) first. It covers Google Authentication, Firestore, security rules, the first administrator, GitHub Pages variables, and Netlify.

- GitHub Pages: `.github/workflows/deploy-pages.yml`
- Netlify: `netlify.toml`

## Course and admin documentation

- [`docs/COURSE_AUTHORING.md`](docs/COURSE_AUTHORING.md)
- [`docs/ADMIN_GUIDE.md`](docs/ADMIN_GUIDE.md)
- [`docs/FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md)

## Tests

Pure domain behavior is covered with Node's built-in test runner, including Firebase configuration validation, email-domain access, randomized quizzes, grading, course publishing validation, lesson unlocking, progress calculations, and video URL parsing.

```bash
npm test
```

## Assessment security

This edition prioritizes zero-cost static hosting. Quiz grading is client-side, which is appropriate for routine equipment training but should not be considered tamper-resistant high-stakes assessment. The grading logic is isolated so it can later be moved to a Netlify Function/server endpoint without changing course authoring or historical attempt records.

## License / attribution

The project began from the MIT-licensed LearnStream frontend supplied for this build. See `LICENSE` and `NOTICE.md`.
