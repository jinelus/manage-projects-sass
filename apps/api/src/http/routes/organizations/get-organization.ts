import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'

export async function getOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Get an organization',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              organization: z.object({
                id: z.string(),
                name: z.string(),
                domain: z.string().nullable(),
                slug: z.string(),
                ownerId: z.string(),
                avatarUrl: z.string().nullable(),
                createdAt: z.date(),
                updatedAt: z.date(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params

        const { organization } = await request.getUserMemberShip(slug)

        return reply.status(200).send({ organization })
      },
    )
}
