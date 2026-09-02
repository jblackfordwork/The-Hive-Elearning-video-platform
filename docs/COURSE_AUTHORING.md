# Course Authoring Guide

Each equipment course is a sequence of video lessons. The system enforces this flow for students:

**Watch video → take randomized quiz → meet passing score → next lesson unlocks.**

## Create a course

1. Admin → **Courses** → **New course**.
2. Enter the course title, equipment name, description, and optional thumbnail URL.
3. Save the draft.
4. Add lessons in the order students should complete them.

## Lesson settings

Each lesson has:

- title and order;
- YouTube, external MP4/WebM URL, or a repository-hosted path such as `training-videos/heat-press.mp4`;
- optional written directions;
- passing score percentage;
- number of questions to show per attempt.

The quiz does not unlock until the video reaches its end event. Administrators have a visible testing-only control to mark the video complete while checking a course.

## Build a randomized question bank

For each lesson, add more active questions than the number shown per attempt. Example:

- Question bank: 10 questions
- Questions per attempt: 5
- Passing score: 80%

Every attempt shuffles the question bank, selects 5 questions, and independently shuffles their answer choices. Failed retries produce another randomized set. Randomization means students may receive different questions; it does not guarantee every student's set is unique.

Each question supports four answer options in version 1. Choose the correct option and optionally add an explanation that appears after submission.

## Publishing safeguards

A course cannot publish until:

- it has a title and equipment name;
- it contains at least one lesson;
- every lesson has a supported video URL;
- every lesson has at least as many active questions as its configured questions-per-attempt count;
- each active question has at least two filled answer choices and a valid correct answer.

## Quiz result retention

On submission, the attempt stores a snapshot of the exact question wording, displayed options, selected answer, correct answer, score, pass/fail result, and timestamp. Editing the question bank later does not rewrite previous attempt records.
