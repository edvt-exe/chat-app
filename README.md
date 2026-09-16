# Chat App

A full-stack real-time messaging application with React and TypeScript on the frontend, and an Express, Prisma, PostgreSQL, and Socket.IO backend.

## Motivation

The project implements the core infrastructure required for a modern direct-messaging client: authenticated users, persistent conversations, real-time message delivery, media uploads, reactions, stories, and presence state. It provides a compact reference implementation for coordinating REST APIs, WebSocket events, relational persistence, filesystem storage, and browser-side session state.

## Tech Stack

### Frontend

- TypeScript 6
- React 19
- React DOM 19
- Vite 8
- Tailwind CSS 3
- PostCSS and Autoprefixer
- Axios
- Socket.IO Client 4
- Framer Motion
- Oxlint

### Backend

- Node.js
- TypeScript 7
- Express 5
- Prisma 6
- PostgreSQL
- Socket.IO 4
- JSON Web Tokens
- bcrypt
- Nodemailer
- Multer
- Helmet
- CORS
- Express Rate Limit
- tsx

## Key Features

- User registration with username, email, and password validation.
- Password hashing with bcrypt.
- Login using username or email followed by a time-limited six-digit email verification code.
- JWT authentication with seven-day token expiration.
- Authenticated REST API requests using Bearer tokens.
- Socket.IO authentication using JWT credentials.
- Direct conversation creation and conversation history loading.
- Real-time text message delivery.
- Real-time file message delivery for images, videos, audio, and documents.
- Typing indicators.
- Online and offline presence tracking with last-seen timestamps.
- Message deletion by the original sender.
- Message reactions with per-user and per-emoji uniqueness.
- Story creation using image or video uploads.
- Story viewing, view tracking, reactions, and 24-hour expiration.
- Hourly cleanup of expired stories and their local media files.
- User search by username.
- Profile username and biography updates.
- Avatar uploads with a five-megabyte limit.
- Password changes.
- Browser notifications and notification sounds.
- Local chat wallpaper persistence through `localStorage`.
- Responsive chat interface with Tailwind CSS and Framer Motion transitions.
- API rate limiting of 200 requests per 15-minute window under `/api`.
- Security headers through Helmet.
- Static media delivery through `/uploads`.

## Local Setup & Installation

### Prerequisites

- Node.js and npm
- PostgreSQL
- An SMTP-compatible email account or service for login verification codes

### 1. Create the PostgreSQL database

Create a database named `chatapp`:

```bash
createdb chatapp
```

Alternatively, using `psql`:

```bash
psql -U postgres -c "CREATE DATABASE chatapp;"
```

### 2. Configure the backend

```bash
cd chat-app/backend
npm ci
```

Create `backend/.env` using the variables listed below.

Apply the Prisma migrations and generate the Prisma client:

```bash
npx prisma migrate deploy
npx prisma generate
```

Start the backend in development mode:

```bash
npm run dev
```

The backend listens on `http://localhost:3000` by default.

For a production-style build:

```bash
npm run build
npm start
```

### 3. Configure the frontend

Open a second terminal:

```bash
cd chat-app/frontend
npm ci
npm run dev
```

The Vite development server listens on `http://localhost:5173` by default.

The frontend currently uses `http://localhost:3000` directly for Axios requests, Socket.IO connections, and uploaded media URLs.

## Environment Variables

Create `backend/.env`:

| Variable | Required | Description | Example |
|---|---:|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma | `postgresql://postgres:change-me@localhost:5432/chatapp` |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs | `replace-with-a-long-random-secret` |
| `PORT` | No | HTTP and Socket.IO server port | `3000` |
| `FRONTEND_URL` | No | Allowed Socket.IO frontend origin | `http://localhost:5173` |
| `EMAIL_FROM` | Yes | Sender address for verification emails | `no-reply@example.test` |
| `EMAIL_HOST` | Yes | SMTP server hostname | `smtp.example.test` |
| `EMAIL_PORT` | Yes | SMTP server port | `587` |
| `EMAIL_USER` | Yes | SMTP username | `smtp-user` |
| `EMAIL_PASS` | Yes | SMTP password or application password | `replace-with-smtp-password` |

`EMAIL_*` values are required for password-based login because the backend sends a verification code before issuing a JWT.

## Project Architecture

```text
chat-app/
├── backend/
│   ├── prisma/
│   │   ├── migrations/          Versioned PostgreSQL schema migrations
│   │   └── schema.prisma        Prisma data model and database configuration
│   ├── src/
│   │   ├── controllers/         HTTP request handlers
│   │   ├── db/                  Prisma client initialization
│   │   ├── jobs/                Scheduled story cleanup
│   │   ├── middleware/          JWT authentication and Multer upload handling
│   │   ├── routes/              Authentication, upload, story, user, and message routes
│   │   ├── services/            Authentication, conversation, message, reaction, email, and story logic
│   │   ├── sockets/             Socket.IO authentication and chat event handlers
│   │   ├── types/               Backend TypeScript contracts
│   │   └── server.ts            Express and HTTP server entry point
│   ├── uploads/                 Local filesystem storage for uploaded media
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/                  Static browser assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/            Registration and login interface
│   │   │   ├── chat/            Sidebar, conversations, messages, and typing UI
│   │   │   ├── layout/          Authenticated application layout
│   │   │   ├── settings/        Profile, password, avatar, and wallpaper controls
│   │   │   ├── stories/         Story creation and viewing interface
│   │   │   └── ui/              Shared avatar and notification components
│   │   ├── contexts/             Authentication and chat state providers
│   │   ├── hooks/                Socket event hooks
│   │   ├── services/             Axios API client and Socket.IO client
│   │   ├── types/                Frontend TypeScript models
│   │   ├── App.tsx               Authentication gate and main application switch
│   │   └── main.tsx              React application entry point
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig*.json
├── package.json                  Root metadata; frontend and backend run independently
└── .gitignore
```

## Backend Interfaces

### REST API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/verify-code`
- `POST /api/upload`
- `GET /api/stories`
- `POST /api/stories`
- `POST /api/stories/:storyId/view`
- `GET /api/users/search`
- `GET /api/users/conversations`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `POST /api/users/me/avatar`
- `PATCH /api/users/me/password`
- `DELETE /api/messages/:messageId`

### Socket.IO Events

- `conversation:start`
- `conversation:history`
- `message:send`
- `message:sendFile`
- `message:read`
- `reaction:toggle`
- `story:react`
- `typing:start`
- `typing:stop`
- `message:new`
- `message:seen`
- `reaction:updated`
- `story:new`
- `notification:message`
- `notification:reaction`
- `user:online`
- `user:offline`
