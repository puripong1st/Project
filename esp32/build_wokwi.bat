@echo off
REM ============================================================
REM  SmartAccess ESP32 — Build Script for Wokwi Simulator
REM  รันไฟล์นี้ใน Command Prompt หรือ Terminal ใน VS Code
REM ============================================================

echo.
echo ========================================
echo  SmartAccess ESP32 Wokwi Build Script
echo ========================================
echo.

REM ตรวจสอบว่ามี arduino-cli ในเครื่องหรือยัง
where arduino-cli >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] ไม่พบ arduino-cli ในระบบ
    echo.
    echo กรุณาติดตั้งก่อนใช้งาน:
    echo   winget install --id ArduinoSA.CLI -e
    echo.
    echo หลังจากติดตั้งแล้ว ให้ปิดและเปิด Terminal ใหม่ แล้วรันสคริปต์นี้อีกครั้ง
    pause
    exit /b 1
)

echo [OK] พบ arduino-cli:
arduino-cli version
echo.

REM ตรวจสอบว่าติดตั้ง ESP32 board package แล้วหรือยัง
echo [1/3] ตรวจสอบ ESP32 board package...
arduino-cli board listall esp32 2>&1 | findstr "esp32:esp32:esp32" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] กำลังเพิ่ม ESP32 board URL...
    arduino-cli config add board_manager.additional_urls https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
    echo [INFO] กำลังอัปเดต board index - อาจใช้เวลา 1-2 นาที...
    arduino-cli core update-index
    echo [INFO] กำลังติดตั้ง ESP32 board package - อาจใช้เวลา 5-10 นาที...
    arduino-cli core install esp32:esp32
) else (
    echo [OK] ESP32 board package พร้อมใช้งานแล้ว
)
echo.

REM ติดตั้ง ArduinoJson library
echo [2/3] ตรวจสอบ ArduinoJson library...
arduino-cli lib list 2>&1 | findstr "ArduinoJson" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] กำลังติดตั้ง ArduinoJson library...
    arduino-cli lib install ArduinoJson
) else (
    echo [OK] ArduinoJson พร้อมใช้งานแล้ว
)
echo.

REM คอมไพล์ sketch
echo [3/3] กำลังคอมไพล์ ESP32 sketch...
echo   Input:  esp32.ino
echo   Output: build/esp32.ino.bin
echo.

arduino-cli compile ^
    --fqbn esp32:esp32:esp32 ^
    --output-dir "%~dp0build" ^
    "%~dp0."

if exist "%~dp0build\esp32.ino.bin" (
    echo.
    echo ========================================
    echo  [SUCCESS] คอมไพล์สำเร็จ!
    echo ========================================
    echo.
    echo ไฟล์ที่สร้างขึ้น:
    dir "%~dp0build\*.bin" 2>nul
    dir "%~dp0build\*.elf" 2>nul
    echo.
    echo ขั้นตอนต่อไป:
    echo   1. เปิด VS Code ในโฟลเดอร์ Project
    echo   2. เปิดไฟล์ esp32/diagram.json
    echo   3. กด F1 > "Wokwi: Start Simulator"
) else (
    echo.
    echo [ERROR] คอมไพล์ล้มเหลว กรุณาตรวจสอบ error ด้านบน
)

echo.
pause
