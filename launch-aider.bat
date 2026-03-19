@echo off
cd /d "C:\Users\GTM_PLANETARY_RIG 1\OneDrive\Desktop\GTM Planetary Projects\Ready2Spray_AI_Local"
echo Starting Aider...
echo.
aider --yes-always --read .ai-tasks/aider-instructions.md --message "Create README.md at project root with the content shown in aider-instructions.md"
pause
