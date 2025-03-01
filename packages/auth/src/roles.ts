// eslint-disable-next-line import/no-extraneous-dependencies
import { z } from 'zod'

export const roleSchema = z.union([
  z.literal('ADMIN'),
  z.literal('MEMBER'),
  z.literal('BILLING'),
])

export type Role = z.infer<typeof roleSchema>
