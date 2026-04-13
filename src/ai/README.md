# AI Module

This folder contains AI-related frontend code for the admin panel.

## Structure

- `components/`: Reusable chat UI components
- `hooks/`: Chat state and orchestration hooks
- `services/`: API integrations for AI features
- `pages/`: Route-level AI pages

## Current Feature

- `AiAssistantPage` (AI Assistant): Supports fullscreen mode and in-app mode
- Frontend endpoint fallback chain:
  - `/api/chat`
  - `/chat`
  - local dev ports `3002` and `3001`
- Backend forwards requests to Gemini (`GEMINI_API_KEY` + `GEMINI_MODEL`)

## Future Extensions

- Add multi-chat history persistence
- Add prompt templates per module (customers, payments, workers)
- Add role-based AI capabilities
