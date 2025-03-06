import { roleSchema } from '@repo/auth'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { BadRequestError } from '../_errors/bad-request-error'
import { UnAuthorizedError } from '../_errors/unauthorized-error'

export async function createInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/invites',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Create a new invite',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          body: z.object({
            email: z.string().email(),
            role: roleSchema || z.null(),
          }),
          response: {
            201: z.object({ inviteId: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params

        const { membership, organization } =
          await request.getUserMemberShip(slug)

        const ability = getUserPermissions(membership.userId, membership.role)

        if (ability.cannot('create', 'Invite')) {
          throw new UnAuthorizedError(
            'You are not allowed to create an invite in this organization',
          )
        }

        const { email, role } = request.body

        const [, domain] = email

        if (
          organization.shouldAttachUsersByDomain &&
          organization.domain === domain
        ) {
          throw new BadRequestError(
            `Users with ${domain} will be automatically attached to your organization on login`,
          )
        }

        const inviteWithSameEmail = await prisma.invite.findUnique({
          where: {
            email_organizationId: {
              email,
              organizationId: organization.id,
            },
          },
        })

        if (inviteWithSameEmail) {
          throw new BadRequestError(
            'Another invite with this email already exists',
          )
        }

        const memberWithSameEmail = await prisma.member.findFirst({
          where: {
            organizationId: organization.id,
            user: {
              email,
            },
          },
        })

        if (memberWithSameEmail) {
          throw new BadRequestError(
            'A member with this email already belongs to this organization',
          )
        }

        const invite = await prisma.invite.create({
          data: {
            email,
            role,
            organizationId: organization.id,
            authorId: membership.userId,
          },
        })

        return reply.status(201).send({ inviteId: invite.id })
      },
    )
}
