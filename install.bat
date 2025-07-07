@echo off
echo 네이버 API Claude Desktop 확장 프로그램 설치 스크립트
echo.

echo 1. Node.js 의존성 설치 중...
call npm install
if %errorlevel% neq 0 (
    echo 의존성 설치 실패!
    pause
    exit /b 1
)

echo.
echo 2. DXT 도구 설치 중...
call npm install -g @anthropic-ai/dxt
if %errorlevel% neq 0 (
    echo DXT 도구 설치 실패!
    pause
    exit /b 1
)

echo.
echo 3. 확장 프로그램 패키징 중...
call dxt pack
if %errorlevel% neq 0 (
    echo 패키징 실패!
    pause
    exit /b 1
)

echo.
echo 설치 완료!
echo 생성된 .dxt 파일을 Claude Desktop에 드래그하여 설치하세요.
echo.
pause 