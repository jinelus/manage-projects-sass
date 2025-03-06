import { organizationSchema } from '@repo/auth'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { BadRequestError } from '../_errors/bad-request-error'
import { UnAuthorizedError } from '../_errors/unauthorized-error'

export async function updateProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:slug/projects/:projectId',
      {
        schema: {
          tags: ['Projects'],
          summary: 'Update a project',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            projectId: z.string(),
          }),
          body: z.object({
            name: z.string(),
            description: z.string().nullable(),
            avatarUrl: z.string().nullable(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug, projectId } = request.params

        const { name, avatarUrl, description } = request.body

        const { membership, organization } =
          await request.getUserMemberShip(slug)

        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            organizationId: organization.id,
          },
        })

        if (!project) {
          throw new BadRequestError('Project not found')
        }

        const authProject = organizationSchema.parse(project)

        const ability = getUserPermissions(membership.userId, membership.role)

        if (ability.cannot('update', authProject)) {
          throw new UnAuthorizedError(
            'You are not allowed to update this project',
          )
        }

        await prisma.project.update({
          where: {
            id: projectId,
          },
          data: {
            name,
            description,
            avatarUrl,
          },
        })

        return reply.status(204).send()
      },
    )
}
