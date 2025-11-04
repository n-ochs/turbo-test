import * as v from 'valibot'

export const UserSchema = v.object({
  id: v.string(),
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
})

export type User = v.InferInput<typeof UserSchema>
