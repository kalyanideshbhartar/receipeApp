@echo off
set "PATH=C:\Windows\System32;C:\Windows\System32\WindowsPowerShell\v1.0;%PATH%"
set "MAVEN_OPTS=-Xmx1024m"
set "SONAR_TOKEN=squ_f324442f0e324fd9c0806fbf4ac48f95b059da9a"
set "SONAR_KEY=Recipe-Backend"
set "SONAR_URL=http://localhost:9000"

echo ============================================================
echo   SonarQube Analysis - Recipe Backend
echo ============================================================

echo.
echo [PRE-CHECK] Verifying SonarQube accessibility...
curl.exe -s --max-time 10 %SONAR_URL%/api/server/version > nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] SonarQube is NOT responding at %SONAR_URL%.
    echo Please ensure the Docker container is running.
    exit /b 1
)
echo [OK] SonarQube is accessible!

echo.
echo [PHASE 1] Running Tests, JaCoCo and Sonar Analysis...
call mvnw.cmd clean test jacoco:report sonar:sonar -DskipITs -Dsonar.projectKey=%SONAR_KEY% -Dsonar.host.url=%SONAR_URL% -Dsonar.login=%SONAR_TOKEN%

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Maven build or Sonar analysis FAILED!
    echo Check the logs above for details.
    exit /b 1
)

echo.
echo ============================================================
echo   [SUCCESS] SonarQube Analysis Complete!
echo   View report: %SONAR_URL%/dashboard?id=%SONAR_KEY%
echo ============================================================
pause
