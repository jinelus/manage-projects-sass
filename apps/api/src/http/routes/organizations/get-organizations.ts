import { roleSchema } from '@repo/auth'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function getOrganizations(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Get organizations',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              organizations: z.array(
                z.object({
                  id: z.string().uuid(),
                  name: z.string(),
                  slug: z.string(),
                  avatarUrl: z.string().nullable(),
                  role: roleSchema,
                }),
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const sub = await request.getCurruentUserId()

        const organizations = await prisma.organization.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            avatarUrl: true,
            members: {
              select: {
                role: true,
              },
              where: {
                userId: sub,
              },
            },
          },
          where: {
            members: {
              some: {
                userId: sub,
              },
            },
          },
        })

        const organizationsWithRole = organizations.map(
          ({ members, ...orgs }) => {
            return {
              ...orgs,
              role: members[0].role,
            }
          },
        )

        // const { shouldAttachUsersByDomain: _, ...rest } = organization

        return reply.status(200).send({ organizations: organizationsWithRole })
      },
    )
}
