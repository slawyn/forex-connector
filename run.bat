@echo off


:: Start flask
set WINDOW_NAME="backend-proxy"
tasklist /FI "WINDOWTITLE eq %WINDOW_NAME%" /fo csv 2>NUL | find /I "WindowsTerminal.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo %WINDOW_NAME% " already running!"
    REM taskkill /IM "WindowsTerminal.exe" /F
) else (
    echo  %WINDOW_NAME% " starting!"
    start %WINDOW_NAME% python ./backend/proxy.py 
)


:: Start react
npm start --prefix frontend