import { roleSchema } from '@repo/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { UnAuthorizedError } from '../_errors/unauthorized-error'

export async function getMembers(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/members',
      {
        schema: {
          tags: ['Members'],
          summary: 'Get members of an organization',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              members: z.array(
                z.object({
                  userId: z.string().uuid(),
                  name: z.string().nullable(),
                  avatarUrl: z.string().nullable(),
                  email: z.string(),
                  id: z.string().uuid(),
                  role: roleSchema,
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

        if (ability.cannot('get', 'User')) {
          throw new UnAuthorizedError(
            'You are not allowed to get organization members',
          )
        }

        const members = await prisma.member.findMany({
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
          orderBy: {
            role: 'asc',
          },
          where: {
            organizationId: organization.id,
          },
        })

        const membersWithRole = members.map(({ user, ...member }) => ({
          ...member,
          userId: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          email: user.email,
        }))

        return reply.status(200).send({
          members: membersWithRole,
        })
      },
    )
}
