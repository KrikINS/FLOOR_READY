---
description: Workflow for committing changes with automated version bumping
---

1.  **Read Version**: Read `src/version.ts` to get the current version.
2.  **Determine Bump**:
    *   If functionality was added -> Bump Minor (x.Y.0)
    *   If only bug fixes/edits -> Bump Patch (x.y.Z)
    *   (Default to Patch for routine commits)
3.  **Update Version File**:
    *   Update `src/version.ts` with the new version string.
4.  **Commit**:
    *   Stage all changes: `git add .`
    *   Commit with message including version? (Optional, but good practice).
    *   `git commit -m "<type>: <message>"`
5.  **Push**:
    *   `git push`
