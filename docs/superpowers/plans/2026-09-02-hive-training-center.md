# The Hive Training Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deployable GCI The Hive equipment-training LMS with Google sign-in, randomized lesson quizzes, sequential unlocking, student progress, and administrator course/user/reporting tools.

**Architecture:** Convert the LearnStream React frontend into a static Vite SPA and replace its Express/Mongo/AI backend with Firebase Authentication and Cloud Firestore. Keep all domain operations behind focused service modules so GitHub Pages is the primary deployment target while Netlify remains an alternate host.

**Tech Stack:** React 19, Vite 7, React Router, Tailwind CSS, Firebase Authentication, Cloud Firestore, react-youtube, Vitest, Testing Library, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-02-hive-training-center-design.md`

## Global Constraints
- Branding must say Genesee Career Institute and The Hive School Store; remove LearnStream branding.
- No transcript, Gemini, AI quiz generation, Express, MongoDB, Supabase, or Python backend.
- Static-host compatible with GitHub Pages and Netlify.
- Google sign-in through Firebase Authentication.
- Firestore persists users, courses, assignments, progress, and attempts.
- Quizzes are randomized from administrator-authored lesson question banks.
- Next lesson unlocks only after video completion and passing quiz score.
- Administrators can inspect exact per-user quiz results and attempts.

---

### Task 1: Project foundation and Firebase client

**Files:**
- Create project from LearnStream `frontend/` in isolated workspace.
- Modify: `package.json`
- Modify: `vite.config.js`
- Create: `.env.example`
- Create: `src/lib/firebase.js`
- Create: `src/lib/firebaseConfig.js`
- Create: `src/test/setup.js`
- Create: `src/lib/firebaseConfig.test.js`
- Delete/omit: LearnStream server runtime and transcript/AI dependencies.

**Interfaces:**
- Produces: `getFirebaseConfig(env) -> { config, missingKeys }`
- Produces: exports `firebaseApp`, `auth`, `db`, `googleProvider`, `firebaseReady`.

- [ ] Write failing tests proving missing Firebase env keys are detected and a complete Vite env object is normalized.
- [ ] Run the test and verify RED.
- [ ] Implement `firebaseConfig.js` and `firebase.js` minimally.
- [ ] Install `firebase`, `react-youtube`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom`; add `test` scripts.
- [ ] Run tests, lint, and build; verify GREEN.

### Task 2: Quiz and progression domain logic

**Files:**
- Create: `src/domain/quiz.js`
- Create: `src/domain/quiz.test.js`
- Create: `src/domain/progress.js`
- Create: `src/domain/progress.test.js`
- Create: `src/domain/video.js`
- Create: `src/domain/video.test.js`

**Interfaces:**
- Produces: `buildQuiz(questionBank, count, randomFn=Math.random)`.
- Produces: `gradeQuiz(quiz, answers)`.
- Produces: `canCompleteLesson({videoCompleted, quizPassed})`.
- Produces: `calculateCourseProgress(lessonIds, completedLessonIds)`.
- Produces: `getNextLesson(lessons, completedLessonIds)`.
- Produces: `parseVideoUrl(url)` returning `{type:'youtube', id}` or `{type:'mp4', url}` or `null`.

- [ ] Write failing tests for deterministic question selection, option shuffling, grading, passing/unlocking, percentages, next lesson, and video parsing.
- [ ] Run tests and verify RED for missing implementations.
- [ ] Implement minimal pure functions.
- [ ] Run tests and verify GREEN.

### Task 3: Authentication and protected routing

**Files:**
- Replace: `src/context/AuthContext.jsx`
- Modify: `src/hooks/useAuth.js`
- Create: `src/services/userService.js`
- Create: `src/components/auth/RequireAuth.jsx`
- Create: `src/components/auth/RequireAdmin.jsx`
- Create: `src/pages/Auth/SignIn.jsx`
- Create: `src/pages/Setup/FirebaseSetup.jsx`

**Interfaces:**
- `AuthContext`: `{user, profile, loading, isAuthenticated, isAdmin, signInWithGoogle, signOutUser}`.
- `ensureUserProfile(firebaseUser)` upserts non-role profile fields and preserves role.

- [ ] Write failing tests for route guard decision helpers and allowed-domain validation.
- [ ] Implement Google popup auth and user-profile synchronization.
- [ ] Add setup/error states for missing Firebase config.
- [ ] Verify tests and build.

### Task 4: Firestore services and security rules

**Files:**
- Create: `src/services/courseService.js`
- Create: `src/services/assignmentService.js`
- Create: `src/services/progressService.js`
- Create: `src/services/attemptService.js`
- Create: `src/services/adminService.js`
- Create: `firestore.rules`
- Create: `firestore.indexes.json`
- Create: `firebase.json`

**Interfaces:**
- Course CRUD functions and lesson/question CRUD.
- Assignment list/create/remove functions.
- Progress load/upsert/complete functions.
- Attempt create/list functions.
- Admin list-users/promote/demote functions.

- [ ] Implement service modules using Firestore modular SDK with consistent converters/defaults.
- [ ] Add rules: authenticated user profile ownership, immutable self-role, admin-wide read/write privileges, student own progress/attempt writes, published assigned-course reads.
- [ ] Add indexes for attempts by uid/course/submittedAt and assignments by uid/status.
- [ ] Run lint/build.

### Task 5: Hive application shell and branding

**Files:**
- Replace: `src/App.jsx`
- Replace: `src/index.css`
- Replace/modify: `src/components/header/Header.jsx`
- Replace/modify: `src/components/navbar/Navbar.jsx`
- Create: `src/components/layout/AppShell.jsx`
- Create: `src/components/ui/StatusBadge.jsx`
- Create: `src/components/ui/ProgressBar.jsx`
- Create: `src/components/ui/EmptyState.jsx`

**Interfaces:**
- Routes use `HashRouter` compatibility and protected route wrappers.

- [ ] Replace generic LearnStream navigation and pages with Hive routes.
- [ ] Apply responsive high-contrast Hive visual system.
- [ ] Verify no visible `LearnStream` strings remain.
- [ ] Run lint/build.

### Task 6: Student dashboard, course overview, and sequential lessons

**Files:**
- Create: `src/pages/Student/StudentDashboard.jsx`
- Create: `src/pages/Student/CourseOverview.jsx`
- Create: `src/pages/Student/LessonPlayer.jsx`
- Create: `src/components/course/CourseCard.jsx`
- Create: `src/components/course/LessonList.jsx`
- Create: `src/components/course/TrainingVideo.jsx`
- Create: `src/components/quiz/LessonQuiz.jsx`

**Interfaces:**
- `TrainingVideo({videoUrl,onComplete})` calls `onComplete` once on ended.
- `LessonQuiz({questions,count,passingScore,onSubmitted})` returns attempt result.

- [ ] Write failing component/domain-facing tests for locked lesson and quiz pass state.
- [ ] Build assigned-course dashboard and progress cards.
- [ ] Build course overview with locked/unlocked/completed lessons.
- [ ] Build video player and quiz flow using Task 2 domain functions.
- [ ] Persist every attempt and update progress; navigate to next unlocked lesson on pass.
- [ ] Verify tests/lint/build.

### Task 7: Administrator dashboard and user result reporting

**Files:**
- Create: `src/pages/Admin/AdminDashboard.jsx`
- Create: `src/pages/Admin/Students.jsx`
- Create: `src/pages/Admin/StudentDetail.jsx`
- Create: `src/pages/Admin/AttemptDetail.jsx`
- Create: `src/pages/Admin/AdminUsers.jsx`

**Interfaces:**
- Student detail aggregates assignments, progress, and attempts by uid.
- Attempt detail renders immutable stored question snapshots.

- [ ] Build overview metrics and recent completion table.
- [ ] Build searchable student directory and progress drilldown.
- [ ] Build attempt result detail showing prompt, selected answer, correct answer, and correctness.
- [ ] Build admin role manager with safeguards preventing the current administrator from removing their own role.
- [ ] Run lint/build.

### Task 8: Course builder and assignments

**Files:**
- Create: `src/pages/Admin/Courses.jsx`
- Create: `src/pages/Admin/CourseEditor.jsx`
- Create: `src/pages/Admin/Assignments.jsx`
- Create: `src/components/admin/LessonEditor.jsx`
- Create: `src/components/admin/QuestionEditor.jsx`
- Create: `src/domain/courseValidation.js`
- Create: `src/domain/courseValidation.test.js`

**Interfaces:**
- `validateCourseForPublish(course, lessonsWithQuestions) -> {valid, errors}`.

- [ ] Write failing tests for publishing constraints and video URL validation.
- [ ] Implement course metadata editor.
- [ ] Implement ordered lesson editor with video URL, passing score, and quiz count.
- [ ] Implement question-bank editor with add/delete/edit choices and correct-answer selection.
- [ ] Block publishing when requirements fail.
- [ ] Implement assignment UI for selecting users and courses.
- [ ] Verify tests/lint/build.

### Task 9: Deployment, documentation, and demo readiness

**Files:**
- Create: `.github/workflows/deploy-pages.yml`
- Modify: `netlify.toml`
- Replace: `README.md`
- Create: `docs/FIREBASE_SETUP.md`
- Create: `docs/ADMIN_GUIDE.md`
- Create: `docs/COURSE_AUTHORING.md`
- Preserve: upstream MIT license attribution in `LICENSE` and `NOTICE.md`.

**Interfaces:**
- GitHub Pages workflow uses `npm ci`, `npm run test`, `npm run build`, then uploads `dist/`.

- [ ] Configure Vite base path for GitHub Pages using `VITE_BASE_PATH` with safe default `./`.
- [ ] Add GitHub Actions Pages deployment.
- [ ] Add Netlify build configuration.
- [ ] Document Firebase project setup, Google provider, authorized domains, Firestore rules/index deployment, environment variables, and one-time first-admin bootstrap.
- [ ] Document course creation and student reporting workflow.
- [ ] Run final tests, lint, build, and a static preview smoke check.
- [ ] Package the completed repository as a ZIP for the user.
