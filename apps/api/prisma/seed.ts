import { faker } from '@faker-js/faker'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function seed() {
  await prisma.organization.deleteMany()
  await prisma.user.deleteMany()

  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'a@b.com',
      passwordHash: '123456',
      avatarUrl: 'https://github.com/jinelus.png',
    },
  })

  const user2 = await prisma.user.create({
    data: {
      name: faker.name.fullName(),
      email: faker.internet.email(),
      passwordHash: await hash('123456', 6),
      avatarUrl: faker.image.avatarGitHub(),
    },
  })

  const user3 = await prisma.user.create({
    data: {
      name: faker.name.fullName(),
      email: faker.internet.email(),
      avatarUrl: faker.image.avatarGitHub(),
      passwordHash: await hash('123456', 6),
    },
  })

  await prisma.organization.create({
    data: {
      name: faker.company.name().concat(' - Admin'),
      ownerId: user.id,
      domain: 'domain.com',
      slug: 'domain-com',
      avatarUrl: 'https://github.com/jinelus.png',
      shouldAttachUsersByDomain: true,
      members: {
        createMany: {
          data: [
            { userId: user.id, role: 'ADMIN' },
            { userId: user2.id, role: 'MEMBER' },
            { userId: user3.id, role: 'MEMBER' },
          ],
        },
      },
      projects: {
        createMany: {
          data: [
            {
              name: faker.lorem.word(6),
              description: faker.lorem.sentence(),
              ownerId: user.id,
              slug: faker.lorem.slug(5),
              avatarUrl: faker.image.avatarGitHub(),
            },
            {
              name: faker.lorem.word(6),
              description: faker.lorem.sentence(),
              ownerId: faker.helpers.arrayElement([
                user.id,
                user2.id,
                user3.id,
              ]),
              slug: faker.lorem.slug(5),
              avatarUrl: faker.image.avatarGitHub(),
            },
          ],
        },
      },
    },
  })

  await prisma.organization.create({
    data: {
      name: faker.company.name(),
      ownerId: user.id,
      slug: 'domain-member',
      avatarUrl: 'https://github.com/jinelus.png',
      shouldAttachUsersByDomain: true,
      members: {
        createMany: {
          data: [
            { userId: user.id, role: 'MEMBER' },
            { userId: user2.id, role: 'MEMBER' },
            { userId: user3.id, role: 'MEMBER' },
          ],
        },
      },
      projects: {
        createMany: {
          data: [
            {
              name: faker.lorem.word(6),
              description: faker.lorem.sentence(),
              ownerId: user.id,
              slug: faker.lorem.slug(5),
              avatarUrl: faker.image.avatarGitHub(),
            },
            {
              name: faker.lorem.word(6),
              description: faker.lorem.sentence(),
              ownerId: faker.helpers.arrayElement([
                user.id,
                user2.id,
                user3.id,
              ]),
              slug: faker.lorem.slug(5),
              avatarUrl: faker.image.avatarGitHub(),
            },
          ],
        },
      },
    },
  })

  await prisma.organization.create({
    data: {
      name: faker.company.name().concat(' - Billing'),
      ownerId: user.id,
      slug: 'domain-biling',
      avatarUrl: 'https://github.com/jinelus.png',
      shouldAttachUsersByDomain: true,
      members: {
        createMany: {
          data: [
            { userId: user.id, role: 'BILLING' },
            { userId: user2.id, role: 'MEMBER' },
            { userId: user3.id, role: 'MEMBER' },
          ],
        },
      },
      projects: {
        createMany: {
          data: [
            {
              name: faker.lorem.word(6),
              description: faker.lorem.sentence(),
              ownerId: user.id,
              slug: faker.lorem.slug(5),
              avatarUrl: faker.image.avatarGitHub(),
            },
            {
              name: faker.lorem.word(6),
              description: faker.lorem.sentence(),
              ownerId: faker.helpers.arrayElement([
                user.id,
                user2.id,
                user3.id,
              ]),
              slug: faker.lorem.slug(5),
              avatarUrl: faker.image.avatarGitHub(),
            },
          ],
        },
      },
    },
  })
}

seed().then(() => {
  console.log('Database has been seeded')
})
