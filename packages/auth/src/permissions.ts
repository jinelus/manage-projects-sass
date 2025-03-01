import { AbilityBuilder } from '@casl/ability'

import { AppAbility } from '.'
import { User } from './models/user'
import { Role } from './roles'

type PermissionsByRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>,
) => void

export const permissions: Record<Role, PermissionsByRole> = {
  ADMIN: (user, builder) => {
    const { can, cannot } = builder

    can('manage', 'all')

    cannot(['transfer_ownership', 'update'], 'Organization')
    can(['transfer_ownership', 'update'], 'Organization', { ownerId: user.id })
  },
  MEMBER: (user, builder) => {
    const { can } = builder

    can('get', 'User')

    can(['create', 'get'], 'Project')
    can(['update', 'delete'], 'Project', { ownerId: user.id })
  },
  BILLING: (_, builder) => {
    const { can } = builder

    can('manage', 'Billing')
  },
}
