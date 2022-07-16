cd %~dp0

setlocal
set WEBBUILDER=%~dp0..\WebBuilder
set NODEJS=%~dp0..\..
set NODE_PATH=%NODEJS%\node_modules

%NODEJS%\node webbuilderfile.js %*
