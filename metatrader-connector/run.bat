@echo off
set MT5_PATH=C:\Program Files\FxPro - MetaTrader 5\terminal64.exe
set MT5_CONFIG=%CD%\backend\config\start.ini
set MT5_NAME=terminal64.exe




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


:: Start mt5
tasklist | find /I "%MT5_NAME%" >NUL
if "%ERRORLEVEL%"=="0" (
    echo %MT5_NAME% " already running, killing it!"
    taskkill /IM "%MT5_NAME%" /F
)
echo   %MT5_NAME% " starting!"
start "%MT5_NAME%" "%MT5_PATH%" /config:%MT5_CONFIG%


:: Start react
npm start --prefix frontend
