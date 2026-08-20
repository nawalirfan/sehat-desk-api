# SehatDesk API

A voice AI patient registration system. You call a real phone number, a conversational AI agent collects your patient intake information, confirms it back to you, and saves it. The same data is also available through a REST API and (separately) a small admin dashboard.

This repo is the backend: the REST API, the database, and the webhook handlers that let the phone agent actually write and read patient data.

## Live demo

- **Phone number:** +1 (571) 498-9126
- **API base URL:** https://sehatdesk-api-production.up.railway.app
- **Dashboard:** https://sehatdesk-dashboard.vercel.app

Call the number, register as a new patient, then hit `GET /patients` on the API base URL to confirm your record actually landed.

## Architecture

```
Caller
  |
  v
Vapi (speech-to-text, text-to-speech, GPT-4.1 mini)
  |
  v
POST /vapi/tool-calls or POST /vapi/end-of-call
  |
  v
service layer (PatientsService, AppointmentsService, TranscriptsService)
  |
  v
SQLite (Railway persistent volume)
```

```
REST client (dashboard, curl, a reviewer)
  |
  v
GET/POST/PUT/DELETE /patients
  |
  v
same service layer as above
```

The part worth calling out: the Vapi webhook and the REST controllers are two thin adapters over the same service layer. Neither one talks to the database directly. When the phone agent saves a patient, it's calling the exact same `PatientsService.create()` method the REST `POST /patients` endpoint calls, same validation, same write path. There is no second, parallel way to get data into this database.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Telephony + voice | [Vapi](https://vapi.ai) | Handles the phone number, speech-to-text, text-to-speech, and turn-taking, so the actual work here is the conversation design and the backend, not building a telephony stack from scratch. |
| LLM | OpenAI GPT-4.1 mini | Fast, cheap, reliable function-calling, and the tier Vapi's model picker actually offered at setup time. |
| Backend framework | NestJS + TypeScript | Structured module/controller/service layering with dependency injection, which keeps the "one service layer, two entry points" architecture enforceable rather than just a convention. |
| Validation | Zod, via a small custom pipe | The same schema needs to validate a request body and a Vapi tool-call argument object, Zod schemas are plain functions that don't care which one calls them, unlike DTOs tied to Nest's HTTP pipeline. |
| Database | SQLite via `better-sqlite3` | Zero setup, a single file, synchronous API keeps the data layer simple. Fine for this scope; see Known Limitations for the tradeoff. |
| Hosting | Railway | A persistent volume for the SQLite file (so data survives restarts and redeploys) plus a free public HTTPS domain, no separate object storage or database service to wire up. |
| Auth | Stateless JWT | One admin, one protected route (the dashboard's settings write). A signed token with an expiry is all the "session" that actually needs. |

## Setup

```bash
git clone https://github.com/nawalirfan/sehat-desk-api.git
cd sehat-desk-api
npm install
cp .env.example .env
```

Fill in `.env` with real values (see [Environment variables](#environment-variables) below), then:

```bash
npm run db:migrate   # creates the SQLite file and applies the schema
npm run start:dev    # starts the API on http://localhost:3000, watching for changes
```

To run it the way it runs in production:

```bash
npm run build
npm run start:prod
```

## Environment variables

All of these are required, the app validates them at boot and refuses to start if any are missing (see `src/config/env.validation.ts`).

| Variable | Purpose |
|---|---|
| `PORT` | Port the server listens on. Railway sets this automatically in production, don't override it there. |
| `NODE_ENV` | `development` locally, `production` when deployed. |
| `DATABASE_PATH` | Path to the SQLite file. `./data/sehatdesk.db` locally, `/data/sehatdesk.db` on Railway once the volume is mounted at `/data`. |
| `OPENAI_API_KEY` | Used by Vapi as the LLM provider for the assistant, configured on Vapi's side, not called directly by this backend. |
| `VAPI_API_KEY` | Server-side key used to push assistant config updates (greeting, voice, call limits) from the dashboard's settings page. |
| `VAPI_ASSISTANT_ID` | The specific Vapi assistant that `VAPI_API_KEY` updates. |
| `VAPI_TOOL_WEBHOOK_SECRET` | Shared secret Vapi sends as an `x-vapi-secret` header on every tool call and end-of-call event, checked on every request to `/vapi/*`. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Login for the dashboard's settings page. |
| `JWT_SECRET` | Signs the session token issued on login. |
| `CORS_ORIGIN` | The dashboard's origin, so its browser-side requests aren't blocked by CORS. |

## Testing it yourself

### The fast way: curl against the REST API

```bash
# list patients
curl https://sehatdesk-api-production.up.railway.app/patients

# create one
curl -X POST https://sehatdesk-api-production.up.railway.app/patients \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Alice",
    "last_name": "Nguyen",
    "date_of_birth": "1990-06-15",
    "sex": "Female",
    "phone_number": "5551239999",
    "address_line_1": "789 Pine St",
    "city": "Denver",
    "state": "CO",
    "zip_code": "80202"
  }'

# fetch by id
curl https://sehatdesk-api-production.up.railway.app/patients/<patient_id>

# filter by phone number, last name, or date of birth
curl "https://sehatdesk-api-production.up.railway.app/patients?phone_number=5551239999"
```

Full endpoint reference: [docs/api.md](docs/api.md).

### The real way: call the number

Call **+1 (571) 498-9126**. The agent will greet you and walk you through registering as a new patient, or updating your info if it recognizes your number from a previous call. A few things worth trying:

- **Corrections**: after it reads your info back, say something's wrong ("actually my last name is spelled D-A-V-I-S") and confirm it fixes just that field.
- **Calling back**: register once, hang up, call again from the same number. It should recognize you, read back what it already has, and ask if anything's changed rather than starting over.
- **Bad input**: give it an obviously wrong date of birth (in the future) or a phone number that isn't 10 digits, it should catch it and ask again specifically for that field.
- **Starting over**: mid-call, say "actually, can we start over" and confirm it drops what it collected and restarts.

After a call, confirm the record actually saved:

```bash
curl "https://sehatdesk-api-production.up.railway.app/patients?phone_number=<the number you called from>"
```

### What "working" looks like end to end

Register a patient on one call, hang up, call back from the same number on a different day, the agent should recognize you and the record should still be there. That's the core thing this whole system is built to prove.

## Prompt design

The system prompt lives in `prompts/system-prompt.md`, plain text, no markdown headers in the version actually pasted into Vapi (the `.md` file is for readability in this repo).

## Known limitations and trade-offs

- **SQLite, not Postgres.** Fine for this scope and this traffic level, wouldn't be the right call for real concurrent write load.
- **A dropped call mid-registration loses nothing but also saves nothing.** Only the final confirmed save writes to the database, so a dropped call before that point just means the caller tries again, no partial or garbage records.
- **Mock appointments and mock providers.** `schedule_appointment` picks from a small hardcoded list of upcoming weekday slots and cycles through a fixed roster of provider names. There's no real clinic calendar behind it, this is intentionally simple demo scheduling, not a real booking system.
- **Transcripts are stored raw.** No redaction of anything spoken during the call beyond truncating phone numbers in application logs.
- **No automated tests.** Dropped from scope to protect time for the core conversation flow, the backend, and documentation. 

## Next steps

- Automated tests for main backend logic.
- A more complete call-transcript view in the dashboard, currently the data is captured and reachable via the API but has no UI.
