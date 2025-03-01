import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

import { UnAuthorizedError } from '../_errors/unauthorized-error'

export async function resetPassword(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/reset-password',
      {
        schema: {
          tags: ['Auth'],
          summary: 'Reset password',
          body: z.object({
            code: z.string(),
            password: z.string().min(6),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { code, password } = request.body

        const token = await prisma.token.findUnique({
          where: {
            id: code,
          },
        })

        if (!token) {
          throw new UnAuthorizedError('Invalid auth token')
        }

        const passwordHash = await hash(password, 6)

        await prisma.user.update({
          where: {
            id: token.userId,
          },
          data: {
            passwordHash,
          },
        })

        return reply.status(204).send()
      },
    )
}
