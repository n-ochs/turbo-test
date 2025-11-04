import { config as baseConfig } from './base.js'

/**
 * @type {import("@antfu/eslint-config").Rules}
 */
export const rules = {}

export const config = baseConfig.append([
  {
    rules,
  },
])
