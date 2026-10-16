@echo off
setlocal
rem  UV3 PLATFORM - agregar, commitear y subir cambios a GitHub/Vercel
rem  USO: deploy_push.bat "mensaje de commit"
rem  Nota: el archivo debe guardarse con fin de linea CRLF y solo ASCII.

cd /d "F:\uv3-platform"

if "%~1"=="" (
    set "MSG=chore: actualizacion %DATE% %TIME%"
) else (
    set "MSG=%~1"
)

echo =======================================================
echo   UV3 PLATFORM - SUBIR CAMBIOS A GITHUB Y VERCEL
echo =======================================================
echo.
echo Mensaje de commit: %MSG%
echo.

git add -A
if errorlevel 1 goto :error

git diff --cached --quiet
if not errorlevel 1 goto :nothing

git commit -m "%MSG%"
if errorlevel 1 goto :error

echo Enviando a origin main...
echo Si el navegador se abre, confirma la autorizacion con 1 clic.
echo.
git push origin main
if errorlevel 1 goto :error

echo.
echo =======================================================
echo  [EXITO] Cambios enviados. Vercel esta compilando ahora.
echo =======================================================
goto :end

:nothing
echo [AVISO] No hay cambios pendientes por subir.
goto :end

:error
echo.
echo =======================================================
echo  [ERROR] No se pudieron enviar los cambios.
echo  Revisa los mensajes de git de arriba.
echo =======================================================

:end
echo.
endlocal
pause
