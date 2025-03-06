import { roleSchema } from '@repo/auth'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request-error'

export async function getPendingInvites(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/pending-invites',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Get all pending invites',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              invites: z.array(
                z.object({
                  id: z.string(),
                  email: z.string(),
                  role: roleSchema,
                  author: z
                    .object({
                      id: z.string(),
                      email: z.string(),
                      name: z.string().nullable(),
                      avatarUrl: z.string().nullable(),
                    })
                    .nullable(),
                  organization: z.object({
                    name: z.string(),
                  }),
                }),
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurruentUserId()

        const user = await prisma.user.findUnique({
          select: { email: true },
          where: { id: userId },
        })

        if (!user) {
          throw new BadRequestError('User not found')
        }

        const invites = await prisma.invite.findMany({
          select: {
            id: true,
            email: true,
            role: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            organization: {
              select: {
                name: true,
              },
            },
          },
          where: {
            email: user.email,
          },
        })

        return reply.status(200).send({ invites })
      },
    )
}
