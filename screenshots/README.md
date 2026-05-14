# DAWin — Screenshot Archive

Visual reference for every sprint, date-labeled. Used by the discovery agent and PM to track what has shipped.

## Folder convention
```
screenshots/
  sprint-N-YYYY-MM-DD/
    01-session-room-1440.jpg     Full session room at 1440×900
    02-session-room-1920.jpg     Full session room at 1920×1080
    03-<feature>.jpg             Key new feature per sprint
    NOTES.md                     What changed this sprint
```

## How to regenerate
Run the UAT agent at sprint close — it takes screenshots automatically and commits them here.
