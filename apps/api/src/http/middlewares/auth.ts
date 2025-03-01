import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'

import { prisma } from '@/lib/prisma'

import { UnAuthorizedError } from '../routes/_errors/unauthorized-error'

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request) => {
    request.getCurruentUserId = async () => {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>()

        return sub
      } catch {
        throw new UnAuthorizedError('Invalid auth token')
      }
    }

    request.getUserMemberShip = async (slug: string) => {
      const userId = await request.getCurruentUserId()

      const member = await prisma.member.findFirst({
        where: {
          userId,
          organization: {
            slug,
          },
        },
        include: {
          organization: true,
        },
      })

      if (!member) {
        throw new UnAuthorizedError(
          'Your are not a member of this organization',
        )
      }

      const { organization, ...membership } = member

      return {
        organization,
        membership,
      }
    }
  })
})
