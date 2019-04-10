set root=%~dp0

call %root%..\TranslateTS\TranslateTS.cmd %root%src/jannesen.language.nl.ts %root%src/jannesen.language.de.ts %root%src/jannesen.language.fi.ts

pause