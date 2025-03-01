import { defineAbilityFor, projectSchema } from '@repo/auth'

const ability = defineAbilityFor({ role: 'ADMIN', id: '1' })
const ability2 = defineAbilityFor({ role: 'MEMBER', id: '1' })

const project = projectSchema.parse({ id: '1', ownerId: '4' })

console.log(ability.can('manage', 'all'))
console.log(ability.can('get', 'Billing'))

console.log(ability2.can('manage', 'Billing'))
console.log(ability2.can('get', 'User'))
console.log(ability2.can('delete', project))
