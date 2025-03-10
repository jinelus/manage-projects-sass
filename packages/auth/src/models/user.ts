// eslint-disable-next-line import/no-extraneous-dependencies
import { z } from 'zod'

import { roleSchema } from '../roles'

export const userSchema = z.object({
  __typename: z.literal('User').default('User'),
  role: roleSchema,
  id: z.string(),
})
export type User = z.infer<typeof userSchema>
