export function backendConfigured(){return !!(process.env.DATABASE_URL&&process.env.NEON_AUTH_BASE_URL&&process.env.NEON_AUTH_COOKIE_SECRET);}
