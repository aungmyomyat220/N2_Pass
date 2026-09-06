import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
export function authConfigured() {
  return Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_URL && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  if (!authConfigured()) throw new Error('Login is not configured');
  return instance ??= createAuth();
}
function createAuth() {
  return betterAuth({
    database: new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }),
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    socialProviders: { google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! } },
  });
}
