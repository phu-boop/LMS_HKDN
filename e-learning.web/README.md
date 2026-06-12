This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev -p ${port}
```

## Environment Variables

Copy `.env.example` to `.env.local`.

For local multi-tenant domain routing, use:

```dotenv
NEXT_PUBLIC_ROOT_DOMAIN=lvh.me
NEXT_PUBLIC_LOGIN_DOMAIN=http://id.lvh.me:8081
NEXT_PUBLIC_ADMIN_DOMAIN=http://lms-admin.lvh.me:8081
NEXT_PUBLIC_LOCAL_ROOT_HOST=lvh.me
NEXT_PUBLIC_LOCAL_PORT=8081
```

Then run `npm run dev` and access:

- `http://id.lvh.me:8081` for login
- `http://lms-admin.lvh.me:8081` for centralized admin
- `http://<tenant>.lvh.me:8081` for tenant portals (for example `http://stem.lvh.me:8081`)

Avoid `*.localhost` for cross-subdomain auth testing. Browsers commonly do not persist a shared cookie domain for `localhost`, so redirects can land on the target subdomain without the auth token.

## How to call API

1. Add new API in `requests/factory` folder
2. Export new API in `requests/factory/index.ts` file
3. Call API in component

```ts
// Import RequestFactory
import rf from '@/requests/RequestFactory';

// Call api
await rf.getRequest({RequestName}).{RequestAction}(payload);

// Ex: await rf.getRequest('AuthRequest').login(payload);

```

## Tech Stack

- [Next.js](https://nextjs.org/)
- [Material UI](https://material-ui.com/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)

- [Wagmi](https://wagmi.sh/)

- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [Husky](https://typicode.github.io/husky/#/)
- Lint Staged

[...]

## Deployment

- Develop (branch `develop`): [dev.domain.me](https://dev.domain.me/)
- Staging (branch `staging`): [staging.domain.me](https://staging.domain.me/)
- Production (branch `main`): [domain.me](https://domain.me/)

The app is deployed on [Vercel](https://vercel.com/).

## Workflow

- Checkout to a new branch from `release` branch
- Make PR to `develop` branch and `release` branch
- Add label to PR:

  - `wip` for work in progress
  - `waiting-review` for review
  - `please-test` for testing
  - `bug` for bug fixing
  - `feature` for new feature
  - `refactor` for refactoring
  - `chore` for other changes
  - ...

- Merge PR to `develop` branch and waiting for review
- Testing on `develop` branch and merge to `release` branch once it's done
