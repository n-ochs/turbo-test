import { BadRequestException } from '@nestjs/common'
import {
  array,
  number,
  object,
  optional,
  parse,
  parseAsync,
  string,
  ValiError,
} from 'valibot'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ValibotValidationPipe } from './valibot.pipe'

// Mock valibot functions
vi.mock('valibot', async () => {
  const actual = await vi.importActual<typeof import('valibot')>('valibot')
  return {
    ...actual,
    parse: vi.fn(),
    parseAsync: vi.fn(),
  }
})

describe('valibotValidationPipe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('synchronous validation', () => {
    it('should successfully validate and return parsed value', async () => {
      const schema = object({
        name: string(),
        age: number(),
      })

      const input = { name: 'John', age: 30 }
      const expectedOutput = { name: 'John', age: 30 }

      vi.mocked(parse).mockReturnValue(expectedOutput)

      const pipe = new ValibotValidationPipe(schema)
      const result = await pipe.transform(input)

      expect(result).toBe(expectedOutput)
      expect(parse).toHaveBeenCalledWith(schema, input)
      expect(parseAsync).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException on validation error', async () => {
      const schema = object({
        name: string(),
        age: number(),
      })

      const input = { name: 'John', age: 'invalid' }

      const valiError = new ValiError([
        {
          kind: 'validation',
          type: 'number',
          input: 'invalid',
          expected: 'number',
          received: 'string',
          message: 'Invalid type: Expected number but received string',
          path: [{ type: 'object', origin: 'value', input, key: 'age', value: 'invalid' }],
        },
      ])

      vi.mocked(parse).mockImplementation(() => {
        throw valiError
      })

      const pipe = new ValibotValidationPipe(schema)

      await expect(pipe.transform(input)).rejects.toThrow(BadRequestException)

      try {
        await pipe.transform(input)
      }
      catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        const response = (error as BadRequestException).getResponse() as any
        expect(response.message).toBe('Validation failed')
        expect(response.errors).toEqual([
          {
            path: 'age',
            message: 'Invalid type: Expected number but received string',
          },
        ])
      }
    })

    it('should handle nested path errors correctly', async () => {
      const schema = object({
        user: object({
          profile: object({
            email: string(),
          }),
        }),
      })

      const input = { user: { profile: { email: 123 } } }

      const valiError = new ValiError([
        {
          kind: 'validation',
          type: 'string',
          input: 123,
          expected: 'string',
          received: 'number',
          message: 'Invalid email',
          path: [
            { type: 'object', origin: 'value', input, key: 'user', value: input.user },
            { type: 'object', origin: 'value', input: input.user, key: 'profile', value: input.user.profile },
            { type: 'object', origin: 'value', input: input.user.profile, key: 'email', value: 123 },
          ],
        },
      ])

      vi.mocked(parse).mockImplementation(() => {
        throw valiError
      })

      const pipe = new ValibotValidationPipe(schema)

      try {
        await pipe.transform(input)
      }
      catch (error) {
        const response = (error as BadRequestException).getResponse() as any
        expect(response.errors[0].path).toBe('user.profile.email')
      }
    })

    it('should handle empty path correctly', async () => {
      const schema = string()
      const input = 123

      const valiError = new ValiError([
        {
          kind: 'validation',
          type: 'string',
          input: 123,
          expected: 'string',
          received: 'number',
          message: 'Invalid type',
          path: undefined,
        },
      ])

      vi.mocked(parse).mockImplementation(() => {
        throw valiError
      })

      const pipe = new ValibotValidationPipe(schema)

      try {
        await pipe.transform(input)
      }
      catch (error) {
        const response = (error as BadRequestException).getResponse() as any
        expect(response.errors[0].path).toBe('')
      }
    })

    it('should rethrow non-ValiError exceptions', async () => {
      const schema = object({ name: string() })
      const input = { name: 'John' }

      const customError = new Error('Something went wrong')
      vi.mocked(parse).mockImplementation(() => {
        throw customError
      })

      const pipe = new ValibotValidationPipe(schema)

      await expect(pipe.transform(input)).rejects.toThrow(customError)
      await expect(pipe.transform(input)).rejects.not.toThrow(BadRequestException)
    })

    it('should handle multiple validation errors', async () => {
      const schema = object({
        name: string(),
        age: number(),
        email: string(),
      })

      const input = { name: 123, age: 'invalid', email: null }

      const valiError = new ValiError([
        {
          kind: 'validation',
          type: 'string',
          input: 123,
          expected: 'string',
          received: 'number',
          message: 'Name must be string',
          path: [{ type: 'object', origin: 'value', input, key: 'name', value: 123 }],
        },
        {
          kind: 'validation',
          type: 'number',
          input: 'invalid',
          expected: 'number',
          received: 'string',
          message: 'Age must be number',
          path: [{ type: 'object', origin: 'value', input, key: 'age', value: 'invalid' }],
        },
        {
          kind: 'validation',
          type: 'string',
          input: null,
          expected: 'string',
          received: 'null',
          message: 'Email is required',
          path: [{ type: 'object', origin: 'value', input, key: 'email', value: null }],
        },
      ])

      vi.mocked(parse).mockImplementation(() => {
        throw valiError
      })

      const pipe = new ValibotValidationPipe(schema)

      try {
        await pipe.transform(input)
      }
      catch (error) {
        const response = (error as BadRequestException).getResponse() as any
        expect(response.errors).toHaveLength(3)
        expect(response.errors).toEqual([
          { path: 'name', message: 'Name must be string' },
          { path: 'age', message: 'Age must be number' },
          { path: 'email', message: 'Email is required' },
        ])
      }
    })
  })

  describe('asynchronous validation', () => {
    it('should use parseAsync when async option is true', async () => {
      const schema = object({
        name: string(),
        age: number(),
      })

      const input = { name: 'John', age: 30 }
      const expectedOutput = { name: 'John', age: 30 }

      vi.mocked(parseAsync).mockResolvedValue(expectedOutput)

      const pipe = new ValibotValidationPipe(schema, { async: true })
      const result = await pipe.transform(input)

      expect(result).toBe(expectedOutput)
      expect(parseAsync).toHaveBeenCalledWith(schema, input)
      expect(parse).not.toHaveBeenCalled()
    })

    it('should handle async validation errors', async () => {
      const schema = object({
        name: string(),
        age: number(),
      })

      const input = { name: 'John', age: 'invalid' }

      const valiError = new ValiError([
        {
          kind: 'validation',
          type: 'number',
          input: 'invalid',
          expected: 'number',
          received: 'string',
          message: 'Invalid age',
          path: [{ type: 'object', origin: 'value', input, key: 'age', value: 'invalid' }],
        },
      ])

      vi.mocked(parseAsync).mockRejectedValue(valiError)

      const pipe = new ValibotValidationPipe(schema, { async: true })

      await expect(pipe.transform(input)).rejects.toThrow(BadRequestException)

      try {
        await pipe.transform(input)
      }
      catch (error) {
        const response = (error as BadRequestException).getResponse() as any
        expect(response.message).toBe('Validation failed')
        expect(response.errors).toEqual([
          {
            path: 'age',
            message: 'Invalid age',
          },
        ])
      }
    })

    it('should rethrow non-ValiError in async mode', async () => {
      const schema = object({ name: string() })
      const input = { name: 'John' }

      const customError = new Error('Async error')
      vi.mocked(parseAsync).mockRejectedValue(customError)

      const pipe = new ValibotValidationPipe(schema, { async: true })

      await expect(pipe.transform(input)).rejects.toThrow(customError)
      await expect(pipe.transform(input)).rejects.not.toThrow(BadRequestException)
    })
  })

  describe('edge cases', () => {
    it('should handle path with undefined keys', async () => {
      const schema = array(string())
      const input = [123, 456]

      const valiError = new ValiError([
        {
          kind: 'validation',
          type: 'string',
          input: 123,
          expected: 'string',
          received: 'number',
          message: 'Invalid item',
          path: [
            { type: 'array', origin: 'value', input, key: undefined as unknown as number, value: 123 },
          ],
        },
      ])

      vi.mocked(parse).mockImplementation(() => {
        throw valiError
      })

      const pipe = new ValibotValidationPipe(schema)

      try {
        await pipe.transform(input)
      }
      catch (error) {
        const response = (error as BadRequestException).getResponse() as any
        expect(response.errors[0].path).toBe('')
      }
    })

    it('should handle mixed path types correctly', async () => {
      const schema = object({
        items: array(object({
          id: number(),
        })),
      })

      const input = { items: [{ id: 'invalid' }] }

      const valiError = new ValiError([
        {
          kind: 'validation',
          type: 'number',
          input: 'invalid',
          expected: 'number',
          received: 'string',
          message: 'Invalid ID',
          path: [
            { type: 'object', origin: 'value', input, key: 'items', value: input.items },
            { type: 'array', origin: 'value', input: input.items, key: 0, value: input.items[0] },
            { type: 'object', origin: 'value', input: input.items[0], key: 'id', value: 'invalid' },
          ],
        },
      ])

      vi.mocked(parse).mockImplementation(() => {
        throw valiError
      })

      const pipe = new ValibotValidationPipe(schema)

      try {
        await pipe.transform(input)
      }
      catch (error) {
        const response = (error as BadRequestException).getResponse() as any
        expect(response.errors[0].path).toBe('items.0.id')
      }
    })

    it('should handle null and undefined values', async () => {
      const schema = object({
        name: optional(string()),
        age: number(),
      })

      const validInput = { name: undefined, age: 30 }
      vi.mocked(parse).mockReturnValue(validInput)

      const pipe = new ValibotValidationPipe(schema)
      const result = await pipe.transform(validInput)

      expect(result).toBe(validInput)
      expect(parse).toHaveBeenCalledWith(schema, validInput)
    })
  })
})
