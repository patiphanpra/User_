@echo off
REM migrate.bat - Helper script for running migrations on Windows

setlocal enabledelayedexpansion

set MIGRATIONS_PATH=backend\migrations
set DATABASE_URL=%DATABASE_URL:postgresql://postgres:postgres@localhost:5432/member_mgmt?sslmode=disable%

if not defined MIGRATE_CMD set MIGRATE_CMD=migrate

if "%1"=="up" (
    echo Applying migrations...
    %MIGRATE_CMD% -path %MIGRATIONS_PATH% -database "%DATABASE_URL%" up
    if !errorlevel! equ 0 (
        echo Migrations applied successfully
        %MIGRATE_CMD% -path %MIGRATIONS_PATH% -database "%DATABASE_URL%" version
    )
) else if "%1"=="down" (
    echo Rolling back migrations...
    %MIGRATE_CMD% -path %MIGRATIONS_PATH% -database "%DATABASE_URL%" down
    if !errorlevel! equ 0 (
        echo Migrations rolled back
    )
) else if "%1"=="version" (
    echo Checking migration version...
    %MIGRATE_CMD% -path %MIGRATIONS_PATH% -database "%DATABASE_URL%" version
) else if "%1"=="force" (
    if "%2"=="" (
        echo Error: version not specified
        exit /b 1
    )
    echo Forcing migration version to %2%...
    %MIGRATE_CMD% -path %MIGRATIONS_PATH% -database "%DATABASE_URL%" force %2%
    echo Forced to version %2%
) else (
    echo Usage: %0% [command]
    echo.
    echo Commands:
    echo   up        Apply all pending migrations
    echo   down      Rollback all migrations
    echo   version   Show current migration version
    echo   force VER Force to specific version
)
