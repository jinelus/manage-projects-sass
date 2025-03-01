import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    SERVER_PORT: z.coerce.number().default(3333),
    DATABASE_URL: z.string().url(),

    JWT_SECRET: z.string(),

    GITHUB_CLIENT_ID: z.string(),
    GITHUB_SECRET_ID: z.string(),
    GITHUB_REDIRECT_URL: z.string(),
  },
  client: {},
  shared: {},
  runtimeEnv: {
    SERVER_PORT: process.env.SERVER_PORT,
    DATABASE_URL: process.env.DATABASE_URL,

    JWT_SECRET: process.env.JWT_SECRET,

    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_SECRET_ID: process.env.GITHUB_SECRET_ID,
    GITHUB_REDIRECT_URL: process.env.GITHUB_REDIRECT_URL,
  },
  emptyStringAsUndefined: true,
})
