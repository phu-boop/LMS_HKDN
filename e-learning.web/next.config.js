/** @type {import('next').NextConfig} */
const localRootHost = process.env.NEXT_PUBLIC_LOCAL_ROOT_HOST || 'localhost';

const nextConfig = {
  allowedDevOrigins: [
    'localhost',
    localRootHost,
    `id.${localRootHost}`,
    `lms-admin.${localRootHost}`,
    `stem.${localRootHost}`,
    'stem.lvh.me',
    'stem.lvh.me:8081'
  ],
  transpilePackages: [
    '@fullcalendar/common',
    '@fullcalendar/daygrid',
    '@fullcalendar/interaction',
    '@fullcalendar/list',
    '@fullcalendar/react',
    '@fullcalendar/timegrid',
    '@fullcalendar/timeline',
    'react-pdf',
    'pdfjs-dist',
  ],
  trailingSlash: true,
  env: {
    HOST_API_KEY: process.env.HOST_API_KEY,
    NEXT_PUBLIC_HOST_API_URL: process.env.NEXT_PUBLIC_HOST_API_URL,
    NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
    NEXT_PUBLIC_LOGIN_DOMAIN: process.env.NEXT_PUBLIC_LOGIN_DOMAIN,
    NEXT_PUBLIC_ADMIN_DOMAIN: process.env.NEXT_PUBLIC_ADMIN_DOMAIN,
    NEXT_PUBLIC_LOCAL_ROOT_HOST: process.env.NEXT_PUBLIC_LOCAL_ROOT_HOST,
    NEXT_PUBLIC_LOCAL_PORT: process.env.NEXT_PUBLIC_LOCAL_PORT,
    // MAPBOX
    MAPBOX_API: '',
    // FIREBASE
    FIREBASE_API_KEY: '',
    FIREBASE_AUTH_DOMAIN: '',
    FIREBASE_PROJECT_ID: '',
    FIREBASE_STORAGE_BUCKET: '',
    FIREBASE_MESSAGING_SENDER_ID: '',
    FIREBASE_APPID: '',
    FIREBASE_MEASUREMENT_ID: '',
    // AWS COGNITO
    AWS_COGNITO_USER_POOL_ID: '',
    AWS_COGNITO_CLIENT_ID: '',
    // AUTH0
    AUTH0_CLIENT_ID: '',
    AUTH0_DOMAIN: '',
  },
};

module.exports = nextConfig;
