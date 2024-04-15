@echo off

:: Windows config
set CONFIG=%CD%\config\config.json

:: Start flask
set WINDOW_NAME="backend-proxy"
tasklist /FI "WINDOWTITLE eq %WINDOW_NAME%" /fo csv 2>NUL | find /I "WindowsTerminal.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo %WINDOW_NAME% " already running!"
) else (
    echo  %WINDOW_NAME% [python ./backend/proxy.py %CONFIG%]
    start %WINDOW_NAME% /b python ./backend/proxy.py %CONFIG%
)

:: Start react
npm start --prefix frontend
