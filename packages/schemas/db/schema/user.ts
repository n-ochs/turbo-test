import { pgTable, text, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-valibot'
import { v7 as uuid } from 'uuid'
import { timestamps } from './constants'

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => uuid()),
  email: varchar('email', { length: 50 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: varchar('first_name', { length: 50 }).notNull(),
  lastName: varchar('last_name', { length: 50 }).notNull(),
  ...timestamps,
})

export const CreateUserSchema = createInsertSchema(users)
export const ReadUserSchema = createSelectSchema(users)
export const UpdateUserSchema = createInsertSchema(users)
