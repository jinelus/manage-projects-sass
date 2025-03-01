import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/utils/generate-slug'

import { BadRequestError } from '../_errors/bad-request-error'

export async function createOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Create an organization',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            domain: z.string(),
            shouldAttachUsersByDomain: z.boolean().optional(),
          }),
          response: {
            201: z.object({ organizationId: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { name, domain, shouldAttachUsersByDomain } = request.body

        const userId = await request.getCurruentUserId()

        if (domain) {
          const organizationWithSameDomain =
            await prisma.organization.findUnique({
              where: {
                domain,
              },
            })

          if (organizationWithSameDomain) {
            throw new BadRequestError(
              'Organization with same domain already exists',
            )
          }
        }

        const organization = await prisma.organization.create({
          data: {
            name,
            domain,
            shouldAttachUsersByDomain,
            ownerId: userId,
            slug: generateSlug(name),
            members: {
              create: {
                userId,
                role: 'ADMIN',
              },
            },
          },
        })

        return reply.status(201).send({ organizationId: organization.id })
      },
    )
}
