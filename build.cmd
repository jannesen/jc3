cd %~dp0

setlocal
set BUILDJS=%~dp0..\BuildJS
set NODEJS=%~dp0..\..
set NODE_PATH=%NODEJS%\node_modules
rem --inspect-brk
%NODEJS%\node buildjsfile.js %*
