import { roleSchema } from '@repo/auth'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { UnAuthorizedError } from '../_errors/unauthorized-error'

export async function getInvites(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/invites',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Get all organization invites',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          response: {
            200: z.object({
              invites: z.array(
                z.object({
                  id: z.string(),
                  createdAt: z.date(),
                  role: roleSchema,
                  email: z.string(),
                  author: z
                    .object({
                      name: z.string().nullable(),
                      id: z.string(),
                    })
                    .nullable(),
                }),
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params

        const { membership, organization } =
          await request.getUserMemberShip(slug)

        const ability = getUserPermissions(membership.userId, membership.role)

        if (ability.cannot('get', 'Invite')) {
          throw new UnAuthorizedError(
            'You are not allowed to get invites for this organization',
          )
        }

        const invites = await prisma.invite.findMany({
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          where: {
            organizationId: organization.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        return reply.status(200).send({ invites })
      },
    )
}
