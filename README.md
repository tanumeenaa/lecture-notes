# Lecture Notes

Lecture Notes turns class recordings and board photos into editable, searchable subject notebooks. Subjects and lectures are private to their owner.

## Requirements

- Node.js 20 or newer
- MongoDB 6 or newer, local or hosted
- A Gemini API key for transcription, board reading, and note generation

## Setup

From the repository root:

```sh
npm install
```

Create a private `server/.env` file for local development with the server variables listed in the Deployment section. Use a local MongoDB URI, a random JWT secret, and a Gemini API key. `GEMINI_MODEL` defaults to the current Flash model. Do not commit environment files. For local file storage, leave `CLOUDINARY_URL` unset; configure it to use authenticated Cloudinary storage.

## Run

Start both applications from the root:

```sh
npm run dev
```

The client runs at <http://localhost:5175> and the API at <http://localhost:5003>. Start MongoDB before the API. For separate terminals, use `npm run dev -w server` and `npm run dev -w client` from the root.

Run the server tests and production client build with:

```sh
npm test
npm run build
```

## Architecture

The React client calls a protected Express API. Mongoose stores users, subjects, timetable slots, and lecture records. Multer validates and stages uploads before a storage adapter saves them to local disk or authenticated Cloudinary. Private media is read through an ownership-checked API route.

The server layout follows the feature boundaries:

- `server/src/models` contains the Mongoose schemas and indexes.
- `server/src/routes` and `controllers` expose authenticated API operations.
- `server/src/middleware` handles JWT authorization, multipart validation, and errors.
- `server/src/ai` contains the Gemini provider and material-grounded prompts.
- `server/src/jobs` runs lecture processing and persists each status transition.
- `server/src/storage` selects local or Cloudinary storage.
- `client/src/pages` contains the dashboard, subject, timetable, notebook, lecture, and search screens.

## Design Decisions

- **Background processing and status:** Upload requests save the lecture first, then queue an in-process job. The lecture moves through `uploaded`, `transcribing`, `reading_board`, `writing_notes`, and `done`, or to `failed` with an error message. The client polls the status endpoint and can request a retry. Jobs are intentionally small and in-process; they do not require a separate worker service.
- **AI provider abstraction:** `transcribeAudio`, `extractBoardText`, and `generateNotes` are isolated in `server/src/ai/provider.js`. Credentials are read only on the server. Audio above the inline request threshold uses Gemini's file upload API. Tests inject a fake provider and never call Gemini.
- **Speech and board alignment:** Transcript segments retain approximate start and end times. Each board photo has an offset in minutes from lecture start. Both sources are supplied together to note generation so the model can place board material beside the closest speech. Timing is approximate, not word-level diarization.
- **Ownership:** Protected routes use the authenticated user ID in every data query. Subject-owned slots and lectures are checked before creation, and private media and exports are only served after checking lecture ownership.
- **Search and continuity:** MongoDB text search is indexed over note text and transcript segments. Notebook topics are collected from generated Markdown headings; the latest completed lecture supplies a short continuity summary for the notebook and the next lecture.

## Limitations

Handwriting recognition accuracy varies with handwriting, image quality, language, and diagram complexity. AI-generated notes can omit or misinterpret details; review the transcript, board text, and notes before relying on them. Gemini free-tier/API limits can restrict request volume, supported media sizes, or model availability. Recordings should only be made with the lecturer's permission and in accordance with your institution's policies. Transcript timestamps are approximate. The in-process background queue does not survive a server restart while a lecture is being processed.

## Deployment

The client and server are deployed separately. Set environment variables in each hosting provider's configuration rather than committing secrets.

| Application | Variable | Purpose |
| --- | --- | --- |
| Server | `NODE_ENV` | Enables production configuration validation. |
| Server | `PORT` | Port assigned by the hosting platform. |
| Server | `MONGODB_URI` | MongoDB connection string. |
| Server | `JWT_SECRET` | Secret used to sign authentication tokens. |
| Server | `GEMINI_API_KEY` | Server-side Gemini API credential. |
| Server | `GEMINI_MODEL` | Gemini model identifier; defaults to the current Flash model. |
| Server | `CLIENT_URL` | One or more allowed client origins, comma-separated. |
| Server | `CLOUDINARY_URL` | Optional Cloudinary connection URL for persistent media storage. |
| Client | `VITE_API_URL` | Deployed server origin; the client appends `/api`. Leave unset for the local Vite proxy. |

### Render

Create a web service with these settings:

| Setting | Value |
| --- | --- |
| Root directory | `server` |
| Build command | `npm install` |
| Start command | `npm start` |

Configure the server environment variables in the Render dashboard. Use a persistent MongoDB service and configure `CLOUDINARY_URL` for uploads because the free hosting disk is temporary. Add the deployed Vercel origin to `CLIENT_URL`.

### Vercel

Create a project with these settings:

| Setting | Value |
| --- | --- |
| Root directory | `client` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variable | `VITE_API_URL` |

Set `VITE_API_URL` to the deployed server origin. The `client/vercel.json` rewrite serves the SPA entry point for client-side routes.