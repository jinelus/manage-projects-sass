import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request-error'

export async function rejectInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/invites/:inviteId/reject',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Reject an invite',
          security: [{ bearerAuth: [] }],
          params: z.object({ inviteId: z.string().uuid() }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { inviteId } = request.params

        const userId = await request.getCurruentUserId()

        const invite = await prisma.invite.findUniqueOrThrow({
          where: { id: inviteId },
        })

        if (!invite) {
          throw new BadRequestError('Invite not found')
        }

        const user = await prisma.user.findUnique({
          where: { id: userId },
        })

        if (!user) {
          throw new BadRequestError('User not found')
        }

        if (invite.email !== user.email) {
          throw new BadRequestError('this invite belongs to another user')
        }

        await prisma.invite.delete({
          where: { id: inviteId },
        })

        return reply.status(204).send()
      },
    )
}
