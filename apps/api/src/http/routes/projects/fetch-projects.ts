import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { UnAuthorizedError } from '../_errors/unauthorized-error'

export async function fetchProjects(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/projects',
      {
        schema: {
          tags: ['Projects'],
          summary: 'Get all projects on an organization',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          querystring: z.object({
            page: z.coerce.number().default(1),
          }),
          response: {
            200: z.object({
              projects: z.array(
                z.object({
                  name: z.string(),
                  id: z.string().uuid(),
                  slug: z.string(),
                  ownerId: z.string(),
                  avatarUrl: z.string().nullable(),
                  organizationId: z.string(),
                  description: z.string().nullable(),
                  createdAt: z.date(),
                  onwer: z.object({
                    name: z.string().nullable(),
                    id: z.string().uuid(),
                    avatarUrl: z.string().nullable(),
                  }),
                }),
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params

        const { page } = request.query

        const { membership, organization } =
          await request.getUserMemberShip(slug)

        const ability = getUserPermissions(membership.userId, membership.role)

        if (ability.cannot('get', 'Project')) {
          throw new UnAuthorizedError(
            "You are not allowed to get this organization's projects",
          )
        }

        const projects = await prisma.project.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            avatarUrl: true,
            slug: true,
            ownerId: true,
            organizationId: true,
            createdAt: true,
            onwer: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          where: {
            organizationId: organization.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
          skip: (page - 1) * 20,
        })

        return reply.status(200).send({
          projects,
        })
      },
    )
}
