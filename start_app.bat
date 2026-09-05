@echo off
echo Starting Operating System Simulator Engine...
echo.

:: Start FastAPI Backend in a new window
start "FastAPI Backend" cmd /c "uvicorn api.main:app --reload"
echo [OK] Backend API launched on port 8000

:: Start React Frontend in a new window
start "React Frontend" cmd /c "cd frontend && npm run dev"
echo [OK] React Frontend launched

:: Wait 3 seconds for Vite server to spin up, then open browser
timeout /t 3 /nobreak > NUL
echo [OK] Opening Dashboard...
start http://localhost:5173

echo.
echo Servers are running in separate background windows.
echo To stop them, simply close the black terminal windows that popped up.
pause
