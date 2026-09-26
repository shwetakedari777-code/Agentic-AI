# Agentflow AI

Agentflow AI turns natural-language requests into visual workflows, then runs them through planner, execution, validation, recovery, and monitoring agents.

## Requirements

- Node.js 20 LTS recommended (Node.js 18.18 or newer is required)
- npm
- MongoDB and Redis are optional for local development; the server falls back to in-memory storage and job scheduling when they are unavailable

## Install

From the repository root, install the root, server, and client dependencies:

```powershell
npm run install:all
```

Create the server environment file:

```powershell
Copy-Item server/.env.example server/.env
```

The example settings work for local development. `JWT_SECRET` and `CREDENTIAL_ENCRYPTION_KEY` have development defaults in the server configuration; replace them with private values before sharing or deploying the application. The encryption key must be 64 hexadecimal characters (32 bytes). Do not commit real secrets.

The client defaults to the local API and Socket.IO URLs. To override them, create `client/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## Run Locally

Start the API and web client together from the repository root:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Check API availability at [http://localhost:5000/api/health](http://localhost:5000/api/health).

To start processes separately, run these commands in separate terminals, from the repository root:

```powershell
npm run dev:server
```

```powershell
npm run dev:client
```

To create and serve a production client build, run each command in its own terminal:

```powershell
npm run build:client
npm run start:server
npm run start:client
```

The API defaults to port 5000 and the client to port 3000. Set `PORT` in `server/.env` to change the API port. To change the client port, update the `dev` and `start` scripts in `client/package.json`.

## Development Login

When the user collection is empty, the server seeds these local accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@agentflow.ai` | `Password123!` |
| Operator | `operator@agentflow.ai` | `Password123!` |

You can also register an account in the app. Change demo credentials before using a shared environment.

## Optional Configuration

**MongoDB:** Set `MONGODB_URI` in `server/.env` to a running MongoDB instance to persist users, workflows, executions, logs, integrations, and notifications. When MongoDB is not reachable, the app uses an in-memory document store; its data is lost when the server stops.

**Redis:** Set `REDIS_URL` to a running Redis instance to use BullMQ for execution scheduling. When Redis is unavailable, jobs use an in-memory queue and are not durable across restarts.

**AI generation:** Set `OPENROUTER_API_KEY` to use OpenRouter. If absent or unavailable, the service tries `GEMINI_API_KEY`; when neither is configured, a deterministic local builder handles common email, invoice, Slack/Discord notification, and Sheets prompts.

**Real provider integrations:** Configure the relevant client ID, client secret, and callback URL in `server/.env` for Gmail, Slack, Discord, or Google Sheets. Register the exact callback URL with the provider. The values in `.env.example` use `http://localhost:5000/api/integrations/oauth/<provider>/callback`. Without provider credentials, development simulation may exercise the local connection flow, but it does not send real messages or modify real sheets.

OAuth access and refresh tokens are encrypted with `CREDENTIAL_ENCRYPTION_KEY`. Keep this key unchanged for any database containing saved integrations; changing it prevents existing credentials from being decrypted.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start API and client together |
| `npm run dev:server` | Start API with Nodemon |
| `npm run dev:client` | Start Next.js development server |
| `npm run build:client` | Build the client for production |
| `npm run start:server` | Start the API without Nodemon |
| `npm run start:client` | Serve the production client |

## Troubleshooting

- **Port 5000 is busy:** Set a different `PORT` in `server/.env` and update `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` in `client/.env.local` to use that port.
- **The client cannot reach the API:** Confirm the API is running, `CLIENT_URL` is `http://localhost:3000`, and `NEXT_PUBLIC_API_URL` ends with `/api`.
- **Data disappears on restart:** MongoDB is unavailable; start MongoDB and set `MONGODB_URI` to a valid connection string.
- **Jobs are not durable:** Start Redis and set `REDIS_URL`.
- **Real provider actions fail:** Configure that provider's OAuth app and callback URL, then connect it from the Integrations page. A simulated connection is not a live provider connection.
