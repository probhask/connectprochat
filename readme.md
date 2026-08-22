# Connect+

A full-stack real-time chat application — React on the client, Express + MongoDB on the server, Socket.IO for live messaging and presence.

![Connect+ screenshot](./image/1.png)

---

![Connect+ screenshot](./image/2.png)

## Features

- **Real-time messaging** — messages, friend requests, and friend-request acceptances all deliver live over Socket.IO, room-scoped per conversation and per user; no polling, no manual refresh.
- **Email OTP verification** — new accounts must verify their email (6-digit code) before they can log in.
- **Login by email or username** — either identifies the account.
- **Friends & friend requests** — send, accept, reject, cancel; a live badge/notification reaches the other party immediately.
- **Direct messaging** — text and media (images/documents) attachments, with online/last-seen status.
- **User profiles** — update username/email/password, upload or remove a profile picture.
- **Explore** — paginated discovery of other users to connect with.

## Tech stack

**Client** — React + TypeScript + Vite, MUI (Material UI), TanStack Query for all server-state data (friends, requests, chat list, conversations, explore), Redux Toolkit for session/auth state only, Socket.IO client, Formik + Yup for forms.

**Server** — Node.js + Express + TypeScript, MongoDB via Mongoose, Socket.IO, JWT (access + refresh token) auth, Yup schema validation, Nodemailer (Gmail SMTP) for OTP email delivery.

## Architecture

The server is organized as one module per domain, each owning its own controllers, service functions, and Yup validation schemas — no controller talks to Mongoose directly:

```
server/src/
  modules/
    user/            auth, profile, side-profile
    otp/              email OTP send/verify
    friendRequest/
    conversation/     + message + chat-list
    upload/           + safe download path
  lib/
    async-wrapper.ts  Yup-validated, type-inferred request handling
    transaction.ts    tx.<model> transaction-scoped service factory
    services/paginate-query/
  sockets/
    handlers/         connection, conversation, message
    presence.ts, ioInstance.ts
```

Every write is scoped to the identity in the verified JWT (`req.userId`), never a client-supplied id. Every list endpoint goes through a shared, typed pagination service. `helmet`, `express-rate-limit`, and per-endpoint Yup schemas are applied throughout.

The client keeps only session state (who's logged in) in Redux; everything that's actually server data goes through TanStack Query, with one shared Axios instance (`services/apis/httpClient.ts`) and one design-token file (`theme/tokens.css`) as the single source of color for the whole UI.

```
client/src/
  hooks/            useExplore, useFriend, useFriendRequest, useMessage, …
  context/          SocketContext, ChatAppContext, ProfileContext, …
  services/apis/    httpClient.ts
  theme/            tokens.css, muiTheme.ts
  store/            authSlice only
```

## Getting started

### Prerequisites

- Node.js 18+
- A MongoDB database (Atlas or local)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) for sending OTP emails

### Server

```bash
cd server
npm install
```

Create `server/.env`:

```
MONGO_URL=mongodb+srv://...
DB_NAME=connect-plus

PORT=8001
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...
ACCESS_TOKEN_EXPIRATION=1d
REFRESH_TOKEN_EXPIRATION=15d

BACKEND_URL=http://localhost:8001
FRONTEND_URL=http://localhost:5173

SENDER_NAME=Connect+
EMAIL_USER=you@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# Dev only — lets you skip real email delivery while testing locally.
# Never set this in a deployed/production environment.
NODE_ENV=development
DEV_MASTER_OTP=000000
```

```bash
npm run dev      # nodemon, http://localhost:8001
```

### Client

```bash
cd client
npm install
```

Create `client/.env`:

```
VITE_BACKEND_URL=http://localhost:8001
```

```bash
npm run dev       # http://localhost:5173
```

### Verify it's working

```bash
cd server && npm run lint && npx tsc --noEmit
cd client && npm run lint && npx tsc -b
```

## Usage

- **Register** with a username, email, and password → an OTP is emailed to verify the address (or use `DEV_MASTER_OTP` locally) → verifying logs you straight in.
- **Log in** with either your email or username.
- **Explore** to find other users, send a friend request — the other person sees it arrive live.
- **Friends** page to accept/reject requests and start a conversation.
- **Chat** — messages, attachments, and read/online status update in real time.
- **Profile** to update your details or picture, or change your password.
