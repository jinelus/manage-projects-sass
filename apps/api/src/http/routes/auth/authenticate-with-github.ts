import { env } from '@repo/env'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request-error'

export async function authenticateWithGithub(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/sessions/github',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Authenticate with Github',
        body: z.object({
          code: z.string(),
        }),
        response: {
          201: z.object({
            token: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { code } = request.body

      const url = new URL('https://github.com/login/oauth/access_token')

      url.searchParams.set('client_id', env.GITHUB_CLIENT_ID)
      url.searchParams.set('client_secret', env.GITHUB_SECRET_ID)
      url.searchParams.set('redirect_uri', env.GITHUB_REDIRECT_URL)
      url.searchParams.set('code', code)

      const githubAccessTokenResponse = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      })

      const dataSchema = z.object({
        access_token: z.string(),
        token_type: z.literal('bearer'),
        scope: z.string(),
      })
      const githubAccessTokenResponseJson =
        await githubAccessTokenResponse.json()

      const { access_token: accessToken } = dataSchema.parse(
        githubAccessTokenResponseJson,
      )

      const githubUserResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const userDataSchema = z.object({
        id: z.number(),
        name: z.string().nullable(),
        email: z.string().email().nullable(),
        avatar_url: z.string().url(),
      })

      const {
        id: githubId,
        name,
        email,
        avatar_url: avatarUrl,
      } = userDataSchema.parse(await githubUserResponse.json())

      if (!email) {
        throw new BadRequestError('Your github account does not have an email')
      }

      let user = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name,
            avatarUrl,
          },
        })
      }

      let account = await prisma.account.findUnique({
        where: {
          provider_userId: {
            provider: 'GITHUB',
            userId: user.id,
          },
        },
      })

      if (!account) {
        account = await prisma.account.create({
          data: {
            provider: 'GITHUB',
            providerAccountId: githubId.toString(),
            userId: user.id,
          },
        })
      }

      const token = await reply.jwtSign(
        {},
        { sign: { sub: user.id, expiresIn: '1d' } },
      )

      return reply.status(201).send({ token })
    },
  )
}
