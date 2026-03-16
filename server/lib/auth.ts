import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { twoFactor } from 'better-auth/plugins'
import { db } from './db'
import * as schema from '../../drizzle/schema'
import { logActivity } from '../utils/log'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 Minuten cachen, kein neues Cookie bei jedem Request
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    twoFactor({
      issuer: 'MeineApp',
    }),
  ],
  user: {
    additionalFields: {
      firstName: {
        type: 'string',
        required: false,
        input: true,
      },
      lastName: {
        type: 'string',
        required: false,
        input: true,
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          await logActivity(session.userId, 'login')
        },
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
})
