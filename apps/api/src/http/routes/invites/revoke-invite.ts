import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { BadRequestError } from '../_errors/bad-request-error'
import { UnAuthorizedError } from '../_errors/unauthorized-error'

export async function revokeInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/invites/:inviteId',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Revoke an invite',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), inviteId: z.string().uuid() }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug, inviteId } = request.params

        const { membership, organization } =
          await request.getUserMemberShip(slug)

        const ability = getUserPermissions(membership.userId, membership.role)

        if (ability.cannot('delete', 'Invite')) {
          throw new UnAuthorizedError(
            'You are not allowed to revoke invites in this organization',
          )
        }

        const invite = await prisma.invite.findUnique({
          where: {
            id: inviteId,
          },
        })

        if (!invite) {
          throw new BadRequestError('Invite not found')
        }

        if (invite.organizationId !== organization.id) {
          throw new BadRequestError('Invite not found')
        }

        await prisma.invite.delete({
          where: {
            id: inviteId,
          },
        })

        return reply.status(204).send()
      },
    )
}
