import {
  AbilityBuilder,
  CreateAbility,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability'
// eslint-disable-next-line import/no-extraneous-dependencies
import { z } from 'zod'

import { User } from './models/user'
import { permissions } from './permissions'
import { billingSubject } from './subjects/billing'
import { inviteSubject } from './subjects/invite'
import { organizationSubject } from './subjects/organization'
import { projectSubject } from './subjects/project'
import { userSubject } from './subjects/user'

export * from './models/user'
export * from './models/project'
export * from './models/organization'
export * from './roles'

// const actions = ['manage', 'create', 'invite', 'delete'] as const
// const subjects = ['User', 'Project', 'all'] as const

const appAbilitiesSchema = z.union([
  projectSubject,
  billingSubject,
  organizationSubject,
  inviteSubject,
  userSubject,
  z.tuple([z.literal('manage'), z.literal('all')]),
])

type AppAbilities = z.infer<typeof appAbilitiesSchema>

export type AppAbility = MongoAbility<AppAbilities>
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

export function defineAbilityFor(user: User) {
  const builder = new AbilityBuilder(createAppAbility)

  if (typeof permissions[user.role] !== 'function') {
    throw new Error(`Role ${user.role} not found`)
  }

  permissions[user.role](user, builder)

  const ability = builder.build({
    detectSubjectType(subject) {
      // eslint-disable-next-line no-underscore-dangle
      return subject.__typename
    },
  })

  ability.can = ability.can.bind(ability)
  ability.cannot = ability.cannot.bind(ability)

  return ability
}
