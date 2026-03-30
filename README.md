## Xpectra Web (Phase 1)

Phase 1 includes local, offline-friendly credentials authentication with NextAuth.

### Environment

Create `.env.local`:

```bash
NEXTAUTH_SECRET=replace-with-a-long-random-string
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
```

Auth data is stored locally in `data/users.json` (gitignored).
Database schema bootstrap runs automatically on first tRPC/API call.

### Drizzle

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Schema and migrations are in `server/db/schema.ts` and `drizzle/`.

### Getting started

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000), then create an account at `/register`.

### Auth routes

- `GET/POST /api/auth/[...nextauth]`
- `POST /api/auth/register`

### tRPC route

- `GET/POST /api/trpc/[trpc]`
