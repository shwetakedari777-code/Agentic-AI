# Agentflow AI Deployment Guide

This guide deploys the Next.js frontend to Vercel and the Express/Socket.IO API to Render. MongoDB Atlas is the persistent database. Redis is optional, but required for durable BullMQ-backed execution scheduling.

## 1. Prepare and Push to Git

Run these commands from the project root in PowerShell:

```powershell
git init
git add .
git status --short
```

Before committing, inspect the staged file list. It must not contain `server/.env`, `client/.env.local`, any other real `.env` file, credentials, API keys, or generated `node_modules` / `.next` directories. `server/.env.example` is safe to commit only while it contains placeholders and development-only values.

Then commit and push to a new, empty GitHub repository:

```powershell
git commit -m "Prepare Agentflow AI for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

Replace the remote URL with your repository URL. If Git asks you to configure your identity, use your name and email with `git config --global user.name` and `git config --global user.email`.

The root `.gitignore` excludes `.env*` files except `.env.example`, dependencies, build output, logs, and deployment caches. If a secret was committed in an earlier commit, ignoring it now is not enough: rotate that secret and remove it from Git history before publishing the repository.

## 2. Deploy the API to Render

1. Push the repository to GitHub as described above.
2. In Render, create a **New + → Web Service** and connect the GitHub repository.
3. Set the service configuration:
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm ci`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
   - Use a Node.js 20 LTS runtime or newer.
4. Add the environment variables below in Render's service settings. Do not put production values in Git or in a `NEXT_PUBLIC_` variable.

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | Your deployed Vercel origin, e.g. `https://your-app.vercel.app` (no trailing slash) |
| `MONGODB_URI` | MongoDB Atlas connection string for the application database |
| `JWT_SECRET` | A unique, randomly generated secret; never use the development default |
| `CREDENTIAL_ENCRYPTION_KEY` | A unique 32-byte key encoded as exactly 64 hexadecimal characters |
| `OPENROUTER_API_KEY` | Optional; preferred AI workflow generator |
| `GEMINI_API_KEY` | Optional; AI fallback when OpenRouter is unset or fails |
| `REDIS_URL` | Optional for local/simple deployment; set to a managed Redis URL for durable queued jobs |

Render supplies `PORT`; the server reads it automatically. Do not add `PORT` unless Render specifically instructs you to.

Generate independent secrets locally without printing them into source files:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run it once for `JWT_SECRET` and again for `CREDENTIAL_ENCRYPTION_KEY`, then enter each output directly into the Render environment settings. The encryption key must remain stable after users connect integrations; changing it makes previously stored OAuth tokens unreadable.

### MongoDB Atlas

1. Create a database user with a strong password and grant it access to the Agentflow database.
2. Add the Render service's outbound IP addresses to Atlas **Network Access**. If your Render plan does not provide static outbound IPs, choose an access policy suitable for that plan; allowing `0.0.0.0/0` is less restrictive and should be paired with strong database credentials.
3. Copy the Atlas application connection string into Render's `MONGODB_URI`. Replace the username, password, and database name placeholders. URL-encode reserved characters in the password (for example, `@` as `%40`).
4. After deployment, open `https://YOUR-RENDER-SERVICE.onrender.com/api/health`. Confirm that `status` is `healthy` and `storage` is `mongodb`. If it says `in-memory-fallback`, check Render logs for Atlas authentication or network-access errors. The app currently continues in fallback mode when the database cannot be reached, so a healthy HTTP status by itself does not prove persistence is working.

### Render runtime note

A Render instance that sleeps or restarts loses in-memory records and queued jobs. Use MongoDB for durable application data and managed Redis for durable background job scheduling. Keep the API service running while the frontend is in use because Socket.IO connects directly to it.

## 3. Deploy the Frontend to Vercel

1. In Vercel, **Add New → Project** and import the same GitHub repository.
2. Set **Root Directory** to `client` and allow Vercel to detect Next.js.
3. Use the default Next.js build/output settings. The build command is `npm run build`; Vercel serves the generated Next.js app itself.
4. Add these environment variables for **Production** (and Preview too, if you intend to test preview deployments):

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://YOUR-RENDER-SERVICE.onrender.com/api` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://YOUR-RENDER-SERVICE.onrender.com` |

These values are public browser endpoints, not secrets. Do not place database URLs, JWT secrets, provider secrets, or API keys in any `NEXT_PUBLIC_` variable.

5. Deploy. Copy the final Vercel production origin and confirm Render's `CLIENT_URL` exactly matches it, including `https://` and without a trailing slash. If you later add a Vercel custom domain, update `CLIENT_URL` on Render to that exact origin and redeploy/restart the API.

The backend CORS policy allows only the origin set in `CLIENT_URL`. Vercel preview deployments use different origins; add a deliberate preview strategy before expecting browser API requests to work from preview URLs. Do not change the API to allow every origin in production.

## 4. Configure OAuth Integrations (Optional)

For each provider you plan to use, create/configure its OAuth app and set these environment variables on Render:

- Gmail: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REDIRECT_URI`
- Slack: `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_REDIRECT_URI`
- Discord: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`
- Google Sheets: `GOOGLE_SHEETS_CLIENT_ID`, `GOOGLE_SHEETS_CLIENT_SECRET`, `GOOGLE_SHEETS_REDIRECT_URI`

Set each redirect URI to the corresponding Render callback and register the exact same URL with the provider:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/integrations/oauth/gmail/callback
https://YOUR-RENDER-SERVICE.onrender.com/api/integrations/oauth/slack/callback
https://YOUR-RENDER-SERVICE.onrender.com/api/integrations/oauth/discord/callback
https://YOUR-RENDER-SERVICE.onrender.com/api/integrations/oauth/google-sheets/callback
```

Also ensure `CLIENT_URL` is the Vercel origin so successful OAuth callbacks return to the deployed integrations page. Restart/redeploy the Render service after changing environment variables. Development OAuth simulation is not a real provider connection and will not send messages or modify sheets.

## 5. Smoke-Test the Deployment

- Open the Vercel URL and register or sign in.
- Confirm the Render health endpoint reports `storage: "mongodb"`.
- Create or generate a workflow, save it, and verify it remains after a Render restart.
- Trigger an execution and check the live timeline and execution detail route.
- Connect a provider only after its production OAuth credentials and callback URL are configured.
- Check Render logs for startup errors, but never log or paste secret values.

## Troubleshooting

- **Render says `bad auth`:** Check the Atlas database username/password, ensure the URI has no unreplaced placeholders, and URL-encode reserved password characters.
- **Render falls back to memory:** Confirm `MONGODB_URI` is configured on the Render service itself and that the Atlas IP access list allows Render's outbound traffic.
- **Browser CORS error:** Set Render `CLIENT_URL` to the exact Vercel origin; do not include a path or trailing slash.
- **API requests fail in Vercel:** Check both `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL`, then redeploy Vercel because Next.js embeds these values at build time.
- **OAuth returns to localhost or rejects the callback:** Update the provider callback URL and matching Render `*_REDIRECT_URI` to the deployed Render HTTPS URL.
- **Background jobs disappear on restart:** Configure a managed Redis instance and set Render `REDIS_URL`.
