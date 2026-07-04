@echo off
echo ==============================================================
echo   TORMENTA INDUMENTARIA - SLOW FASHION WORKSHOP OPTIMIZER
echo ==============================================================
echo Iniciando servidor FastAPI local...
echo Abre tu navegador en: http://127.0.0.1:8000
echo ==============================================================
echo Generando registro de diagnostico en run_log.txt...
python main.py > run_log.txt 2>&1
if %errorlevel% neq 0 (
    echo Intento fallido con Python global. Probando con uv... >> run_log.txt
    uv run main.py >> run_log.txt 2>&1
)
pause
