This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Recommended: run everything in Docker, so local dev uses the same Node/Alpine platform as the production image instead of whatever's on your host (see the `app` service in docker-compose.yml for why that matters — a past issue with Prisma's native query engine specifically):

```bash
docker compose up -d
```

That starts Postgres, then installs dependencies and runs the dev server inside a container on http://localhost:3000, with hot reload via a bind mount. First start is slower (installing deps in the container); `docker compose logs -f app` to watch it.

Alternatively, for a faster local loop without Docker for the app itself (just be sure your Node version matches `.nvmrc`):

```bash
docker compose up -d postgres
npx prisma migrate deploy
npx prisma db seed
npm run dev
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
