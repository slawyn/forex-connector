@echo off

set WINDOW_NAME="myappserver"
tasklist /FI "WINDOWTITLE eq %WINDOW_NAME%" /fo csv 2>NUL | find /I "WindowsTerminal.exe"
if "%ERRORLEVEL%"=="0" (
    echo %WINDOW_NAME% " already running!"
) else (
    start %WINDOW_NAME% python ./backend/app.py
)

pushd frontend
npm start
popd