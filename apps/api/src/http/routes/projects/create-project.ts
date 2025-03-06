import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/utils/generate-slug'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { BadRequestError } from '../_errors/bad-request-error'

export async function createProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/projects',
      {
        schema: {
          tags: ['Projects'],
          summary: 'Create a project',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          body: z.object({
            name: z.string(),
            description: z.string().nullable(),
            avatarUrl: z.string().nullable(),
          }),
          response: {
            201: z.object({ projectId: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params

        const { name, avatarUrl, description } = request.body

        const { membership, organization } =
          await request.getUserMemberShip(slug)

        const ability = getUserPermissions(membership.userId, membership.role)

        if (ability.cannot('create', 'Project')) {
          throw new BadRequestError(
            'You do not have permission to create a project',
          )
        }

        const project = await prisma.project.create({
          data: {
            name,
            description,
            avatarUrl,
            ownerId: membership.userId,
            organizationId: organization.id,
            slug: generateSlug(name),
          },
        })

        return reply.status(201).send({ projectId: project.id })
      },
    )
}
