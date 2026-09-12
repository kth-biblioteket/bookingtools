This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Copy `.env.example` to `.env` and `bookingtools.env.example` to
`bookingtools.env`, and fill both in (`.env` is read automatically by
Docker Compose for `${VAR}` substitution — DB credentials, etc. —
`bookingtools.env` is injected straight into the app container via
`env_file`).

Everything — the app and its database — runs in Docker, so local dev uses
the same Node/Alpine platform as the production image instead of whatever's
on your host (see the `bookingtools` service in docker-compose-dev.yml for
why that matters — a past issue with Prisma's native query engine
specifically). `docker-compose.yml` (no suffix) is the production
deployment (Traefik, pulls the image from ghcr.io) — local dev always uses
`docker-compose-dev.yml` explicitly:

```bash
docker compose -f docker-compose-dev.yml up -d
```

That starts Postgres, then installs dependencies and runs the dev server
inside a container on http://localhost:3000, with hot reload via a bind
mount. First start is slower (installing deps in the container);
`docker compose -f docker-compose-dev.yml logs -f bookingtools` to watch it.

Run one-off Prisma commands (migrations, seeding, `prisma studio`) inside
the app container, not on the host — `DATABASE_URL` inside the container
points at the `bookingtools-db` service name, which only resolves inside
the Docker network:

```bash
docker exec bookingtools npx prisma migrate deploy
docker exec bookingtools npx prisma db seed
docker exec -it bookingtools npx prisma studio
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
