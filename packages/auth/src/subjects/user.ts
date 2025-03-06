// eslint-disable-next-line import/no-extraneous-dependencies
import { z } from 'zod'

export const userSubject = z.tuple([
  z.union([
    z.literal('create'),
    z.literal('manage'),
    z.literal('delete'),
    z.literal('invite'),
    z.literal('get'),
    z.literal('update'),
  ]),
  z.literal('User'),
])

export type UserSubject = z.infer<typeof userSubject>
