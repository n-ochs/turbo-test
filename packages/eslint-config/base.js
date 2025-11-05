import antfu from '@antfu/eslint-config'

/**
 * @type {import("@antfu/eslint-config").Rules}
 */
export const rules = {
  'node/prefer-global/process': 'off',
  'ts/consistent-type-imports': 'off',
}

export const config = antfu({
  ignores: ['**/dist/**', '**/build/**', '**/output/**', '**/.turbo/**'],
  rules,
})
