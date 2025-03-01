import { organizationSchema } from '@repo/auth'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { UnAuthorizedError } from '../_errors/unauthorized-error'

export async function shutdownOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:slug',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Shutdown an organization',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params

        const { membership, organization } =
          await request.getUserMemberShip(slug)

        const authOrganization = organizationSchema.parse(organization)

        const ability = getUserPermissions(membership.userId, membership.role)

        if (ability.cannot('delete', authOrganization)) {
          throw new UnAuthorizedError(
            'You are not allowed to shutdown this organization',
          )
        }

        await prisma.member.deleteMany({
          where: {
            organizationId: organization.id,
          },
        })

        await prisma.organization.delete({ where: { id: organization.id } })

        return reply.status(204).send()
      },
    )
}
