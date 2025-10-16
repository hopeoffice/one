# Telegram-like Login Demo

Minimal demo of a Telegram-style phone-number login flow with a verification code countdown and a password step.

Features

- Enter phone number -> Save phone to `db.json` and send a demo verification code.
- 60s cooldown before resending a code; countdown shown on the "Send Code" button.
- Enter verification code -> Save code to `db.json` and move to password step.
- Enter password -> Save hashed password to `db.json` and show completion.

How to run

1. Install dependencies:

   npm install

2. Start server:

   npm start

3. Open http://localhost:3000 in your browser.

Security notes

- This is an educational demo. Do NOT use this as-is in production.
- Passwords are hashed with bcryptjs for demonstration, but the system uses a local file database (`lowdb`) and in-memory cooldowns.

DB schema (`db.json`)

- users: [{ id, phone, createdAt, verified, passwordHash, completedAt }]
- codes: [{ id, phone, code, createdAt }]

UI improvements

- The frontend now uses Inter font and a Telegram-like blue theme.
- Keyboard: press Enter to advance between steps.
- Inputs are nicer on mobile (inputmode attributes) and fields auto-focus.

New features

- Animated background (subtle floating radial shapes).
- Dark theme toggle (top-right) persisted to localStorage.
- High-fidelity logo asset at `public/assets/logo.svg`.
- Cooldowns are persisted in `db.json` so they survive server restarts.
- A simple test harness: run `npm test` to execute `run-tests.js`.

