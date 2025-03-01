import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function requestPasswordRecover(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/password/recover',
      {
        schema: {
          tags: ['Auth'],
          summary: 'Request password recover',
          body: z.object({
            email: z.string().email(),
          }),
          response: {
            201: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { email } = request.body

        const userFromEmail = await prisma.user.findUnique({
          where: {
            email,
          },
        })

        if (!userFromEmail) {
          return reply.status(201).send()
        }

        await prisma.token.create({
          data: {
            type: 'PASSWORD_RECOVER',
            userId: userFromEmail.id,
          },
        })

        return reply.status(201).send()
      },
    )
}
