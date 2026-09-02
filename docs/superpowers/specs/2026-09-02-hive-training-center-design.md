# The Hive Training Center — Design Specification

## Goal
Build a branded e-learning platform for Genesee Career Institute's The Hive School Store that can be deployed as a static React application on GitHub Pages or Netlify, while using Firebase Authentication and Cloud Firestore for Google sign-in, persistent progress, role-based administration, course assignments, lesson quizzes, and reporting.

## Approved product behavior
- Branding is exclusively **Genesee Career Institute — The Hive School Store**.
- Students sign in with Google. Their user record is created/updated automatically on sign-in.
- Administrators can promote selected existing users to administrator role.
- Administrators can create, edit, publish, archive, and assign equipment courses.
- Courses contain ordered lessons. Each lesson contains a training video, optional written directions, and a quiz question bank.
- Transcript and AI-generated transcript features from LearnStream are removed.
- A lesson quiz is automatically assembled from the lesson question bank. The quiz can select a configured number of questions and shuffle both question order and option order.
- Quiz selection is randomized per attempt so users do not necessarily receive the same questions.
- Every quiz attempt stores the exact questions/options presented, submitted answers, correctness, score, passing status, and timestamps so administrators can review individual results.
- A student cannot advance to the next lesson until the current lesson's video is completed and the current quiz reaches the configured passing score.
- Failed quizzes can be retried with a new randomized selection.
- Administrators can see per-user course progress, lesson status, attempts, and quiz results.
- The first administrator is bootstrapped manually in Firestore after first sign-in; subsequent administrators can be managed in the app.

## Deployment architecture
### Frontend
- React 19 + Vite 7.
- React Router with hash routing so GitHub Pages works without custom rewrite rules.
- Tailwind CSS already present in LearnStream is retained for utility styling.
- The application builds to static files in `dist/`.
- GitHub Actions deploys `dist/` to GitHub Pages.
- `netlify.toml` is included as an alternate deployment path.

### Cloud services
- Firebase Authentication: Google provider.
- Cloud Firestore: users, courses, assignments, progress, attempts.
- No Express server, MongoDB, Supabase, Gemini, transcript service, or Python process.
- Firebase browser config is supplied through Vite environment variables. Firebase browser API keys are treated as public configuration; authorization is enforced with Authentication and Firestore Security Rules.

## Data model
### `users/{uid}`
```js
{
  uid,
  displayName,
  email,
  photoURL,
  role: 'student' | 'admin',
  createdAt,
  lastLoginAt
}
```

### `courses/{courseId}`
```js
{
  title,
  slug,
  description,
  equipmentName,
  thumbnailUrl,
  status: 'draft' | 'published' | 'archived',
  createdBy,
  createdAt,
  updatedAt
}
```

### `courses/{courseId}/lessons/{lessonId}`
```js
{
  title,
  order,
  description,
  videoUrl,
  videoType: 'youtube' | 'mp4',
  passingScorePercent,
  quizQuestionCount,
  requireVideoCompletion: true,
  createdAt,
  updatedAt
}
```

### `courses/{courseId}/lessons/{lessonId}/questions/{questionId}`
```js
{
  prompt,
  options: [
    { id: 'a', text: '...' },
    { id: 'b', text: '...' }
  ],
  correctOptionId: 'b',
  explanation,
  active: true
}
```

### `assignments/{uid_courseId}`
```js
{
  uid,
  courseId,
  assignedBy,
  assignedAt,
  dueDate: null | Timestamp,
  status: 'assigned' | 'in_progress' | 'completed'
}
```

### `progress/{uid_courseId}`
```js
{
  uid,
  courseId,
  currentLessonId,
  completedLessonIds: [],
  percentComplete,
  startedAt,
  completedAt,
  updatedAt,
  lessons: {
    [lessonId]: {
      videoCompleted: boolean,
      quizPassed: boolean,
      bestScorePercent: number,
      attemptCount: number,
      completedAt: Timestamp | null
    }
  }
}
```

### `attempts/{attemptId}`
```js
{
  uid,
  courseId,
  lessonId,
  startedAt,
  submittedAt,
  passingScorePercent,
  scorePercent,
  correctCount,
  totalQuestions,
  passed,
  questions: [
    {
      questionId,
      prompt,
      options: [{ id, text }],
      correctOptionId,
      selectedOptionId,
      correct
    }
  ]
}
```

## Quiz behavior
1. Fetch active questions for the lesson.
2. Shuffle question bank using Fisher-Yates.
3. Take `min(quizQuestionCount, activeQuestionCount)` questions.
4. Independently shuffle options for each selected question while preserving option IDs.
5. Render all questions and require an answer for each question before submission.
6. Grade against `correctOptionId`.
7. Persist an immutable attempt snapshot containing exact prompts/options/answers/results.
8. Update lesson progress with best score and attempt count.
9. If score meets `passingScorePercent` and video is complete, mark lesson complete and unlock the next lesson.
10. If failed, present retry action; retry produces a new randomized set.

## Video behavior
- YouTube URLs are normalized to a YouTube video ID and played with the YouTube IFrame API through `react-youtube`.
- MP4/WebM URLs use the native `<video>` element.
- `videoCompleted` becomes true when the player reports ended.
- During development/demo mode, administrators can use a visible `Mark video complete` control for testing; normal students cannot.

## Access control
- Unauthenticated users see a branded sign-in screen.
- Authenticated students can read published courses assigned to them and write only their own progress/attempt records.
- Administrators can read users, courses, assignments, progress, and attempts, and can write course content and assignments.
- Students cannot modify their own role.
- The client hides admin routes for non-admin users, and Firestore Security Rules enforce equivalent backend authorization.
- The first admin is bootstrapped by editing `users/{uid}.role` to `admin` in the Firebase Console. This one-time operation is documented.

## Screens
1. Sign in / welcome page.
2. Student dashboard with assigned courses and progress.
3. Course overview with ordered lessons and locked/unlocked/completed states.
4. Lesson player with video, directions, quiz, score, and next-lesson navigation.
5. Admin overview with student/course/completion statistics.
6. Admin students view with searchable progress and user-detail drilldown.
7. Admin attempt detail view showing exact quiz answers/results.
8. Admin courses list.
9. Admin course editor with lesson editor and question-bank editor.
10. Admin assignments view for assigning/unassigning courses.
11. Admin user management for granting/revoking admin access.

## Visual direction
- Clean school-store/workshop aesthetic, not a generic MOOC.
- Primary brand treatment uses deep navy/charcoal, white, and a honey/amber Hive accent.
- Strong high-contrast typography and accessible focus states.
- Equipment cards use large thumbnails, status chips, progress bars, and clear `Continue training` actions.
- The header displays `GENESEE CAREER INSTITUTE` and `THE HIVE • SCHOOL STORE TRAINING`.

## Error handling
- Firebase configuration errors show a setup screen rather than a blank application.
- Firestore permission errors provide an actionable message.
- Empty states explain how to create/assign a first course.
- Unsupported video URLs are rejected by the course editor.
- Course publishing is blocked if it has no lesson or a lesson has fewer quiz questions than required.

## Testing
- Unit tests for quiz randomization, scoring, video URL parsing, lesson unlocking, and progress percentages.
- Component tests for route protection and quiz submission behavior where practical.
- Production build verification with Vite.
- ESLint verification.
- Firebase Security Rules included and reviewed for role and ownership constraints.

## Known static-hosting limitation
Because GitHub Pages executes all application logic in the browser, client-side quiz grading cannot be considered tamper-resistant. The implementation isolates grading behind a service module so it can later be swapped for a Netlify Function or another server-side grader without changing course authoring or reporting data structures.
