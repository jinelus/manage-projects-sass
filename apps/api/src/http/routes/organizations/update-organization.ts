import { organizationSchema } from '@repo/auth'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { BadRequestError } from '../_errors/bad-request-error'
import { UnAuthorizedError } from '../_errors/unauthorized-error'

export async function updateOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:slug',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Update an organization',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          body: z.object({
            name: z.string(),
            domain: z.string().nullable(),
            shouldAttachUsersByDomain: z.boolean().optional(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params

        const { name, domain, shouldAttachUsersByDomain } = request.body

        const { membership, organization } =
          await request.getUserMemberShip(slug)

        const authOrganization = organizationSchema.parse(organization)

        const ability = getUserPermissions(membership.userId, membership.role)

        if (ability.cannot('update', authOrganization)) {
          throw new UnAuthorizedError(
            'You are not allowed to update this organization',
          )
        }

        if (domain) {
          const organizationWithSameDomain =
            await prisma.organization.findFirst({
              where: {
                domain,
                id: {
                  not: organization.id,
                },
              },
            })

          if (organizationWithSameDomain) {
            throw new BadRequestError(
              'Organization with same domain already exists',
            )
          }
        }

        await prisma.organization.update({
          where: {
            id: organization.id,
          },
          data: {
            name,
            domain,
            shouldAttachUsersByDomain,
          },
        })

        return reply.status(204).send()
      },
    )
}
