import { BadRequestException } from '@nestjs/common'
import * as v from 'valibot'
import { ValibotValidationPipe } from './valibot.pipe'

describe('valibotValidationPipe', () => {
  describe('basic Validation', () => {
    it('should pass valid data through unchanged', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number(),
      })

      const pipe = new ValibotValidationPipe(schema)
      const validData = { name: 'John', age: 30 }

      const result = pipe.transform(validData)

      expect(result).toEqual(validData)
    })

    it('should throw BadRequestException for invalid data', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number(),
      })

      const pipe = new ValibotValidationPipe(schema)
      const invalidData = { name: 'John', age: 'thirty' }

      expect(() => pipe.transform(invalidData)).toThrow(BadRequestException)
    })

    it('should handle missing required fields', () => {
      const schema = v.object({
        name: v.string(),
        email: v.string(),
      })

      const pipe = new ValibotValidationPipe(schema)
      const incompleteData = { name: 'John' }

      expect(() => pipe.transform(incompleteData)).toThrow(BadRequestException)
    })
  })

  describe('error Message Formatting', () => {
    it('should format single validation error correctly', () => {
      const schema = v.object({
        email: v.pipe(v.string(), v.email()),
      })

      const pipe = new ValibotValidationPipe(schema)
      const invalidData = { email: 'not-an-email' }

      try {
        pipe.transform(invalidData)
        fail('Should have thrown BadRequestException')
      }
      catch (error) {
        if (!(error instanceof BadRequestException)) {
          throw error
        }
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error.getResponse()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: expect.any(String),
              message: expect.any(String),
            }),
          ]),
        )
      }
    })

    it('should format multiple validation errors correctly', () => {
      const schema = v.object({
        name: v.pipe(v.string(), v.minLength(2)),
        age: v.pipe(v.number(), v.minValue(18)),
      })

      const pipe = new ValibotValidationPipe(schema)
      const invalidData = { name: 'A', age: 10 }

      try {
        pipe.transform(invalidData)
        fail('Should have thrown BadRequestException')
      }
      catch (error) {
        if (!(error instanceof BadRequestException)) {
          throw error
        }
        const response = error.getResponse() as any[]
        expect(response).toHaveLength(2)
        expect(response).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: 'name',
              message: expect.any(String),
            }),
            expect.objectContaining({
              path: 'age',
              message: expect.any(String),
            }),
          ]),
        )
      }
    })

    it('should handle nested object validation errors', () => {
      const schema = v.object({
        user: v.object({
          profile: v.object({
            email: v.pipe(v.string(), v.email()),
          }),
        }),
      })

      const pipe = new ValibotValidationPipe(schema)
      const invalidData = {
        user: {
          profile: {
            email: 'invalid',
          },
        },
      }

      try {
        pipe.transform(invalidData)
        fail('Should have thrown BadRequestException')
      }
      catch (error) {
        if (!(error instanceof BadRequestException)) {
          throw error
        }
        const response = error.getResponse() as any[]
        expect(response[0].path).toContain('user.profile.email')
      }
    })
  })

  describe('array Validation', () => {
    it('should validate array items', () => {
      const schema = v.object({
        tags: v.array(v.string()),
      })

      const pipe = new ValibotValidationPipe(schema)
      const validData = { tags: ['tag1', 'tag2'] }

      const result = pipe.transform(validData)

      expect(result).toEqual(validData)
    })

    it('should handle array validation errors', () => {
      const schema = v.object({
        numbers: v.array(v.number()),
      })

      const pipe = new ValibotValidationPipe(schema)
      const invalidData = { numbers: [1, 'two', 3] }

      expect(() => pipe.transform(invalidData)).toThrow(BadRequestException)
    })

    it('should report correct path for array item errors', () => {
      const schema = v.object({
        items: v.array(
          v.object({
            id: v.number(),
            name: v.string(),
          }),
        ),
      })

      const pipe = new ValibotValidationPipe(schema)
      const invalidData = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 'two', name: 'Item 2' }, // Invalid id
        ],
      }

      try {
        pipe.transform(invalidData)
        fail('Should have thrown BadRequestException')
      }
      catch (error) {
        if (!(error instanceof BadRequestException)) {
          throw error
        }
        const response = error.getResponse() as any[]
        expect(response[0].path).toContain('items.1.id')
      }
    })
  })

  describe('edge Cases', () => {
    it('should handle null input', () => {
      const schema = v.object({
        name: v.string(),
      })

      const pipe = new ValibotValidationPipe(schema)

      expect(() => pipe.transform(null)).toThrow(BadRequestException)
    })

    it('should handle undefined input', () => {
      const schema = v.object({
        name: v.string(),
      })

      const pipe = new ValibotValidationPipe(schema)

      expect(() => pipe.transform(undefined)).toThrow(BadRequestException)
    })

    it('should handle empty object when all fields are optional', () => {
      const schema = v.object({
        name: v.optional(v.string()),
        age: v.optional(v.number()),
      })

      const pipe = new ValibotValidationPipe(schema)
      const emptyData = {}

      const result = pipe.transform(emptyData)

      expect(result).toEqual(emptyData)
    })

    it('should rethrow non-ValiError errors', () => {
      const schema = v.custom(() => {
        throw new Error('Custom error')
      })

      const pipe = new ValibotValidationPipe(schema)

      expect(() => pipe.transform('any')).toThrow('Custom error')
    })
  })

  describe('complex Schema Types', () => {
    it('should handle union types', () => {
      const schema = v.union([
        v.string(),
        v.number(),
      ])

      const pipe = new ValibotValidationPipe(schema)

      expect(pipe.transform('test')).toBe('test')
      expect(pipe.transform(42)).toBe(42)
      expect(() => pipe.transform(true)).toThrow(BadRequestException)
    })

    it('should handle optional fields', () => {
      const schema = v.object({
        required: v.string(),
        optional: v.optional(v.string()),
      })

      const pipe = new ValibotValidationPipe(schema)
      const dataWithoutOptional = { required: 'value' }

      const result = pipe.transform(dataWithoutOptional)

      expect(result).toEqual(dataWithoutOptional)
    })

    it('should handle nullable fields', () => {
      const schema = v.object({
        name: v.nullable(v.string()),
      })

      const pipe = new ValibotValidationPipe(schema)

      expect(pipe.transform({ name: null })).toEqual({ name: null })
      expect(pipe.transform({ name: 'John' })).toEqual({ name: 'John' })
    })

    it('should handle transformation schemas', () => {
      const schema = v.pipe(
        v.object({
          email: v.string(),
        }),
        v.transform(data => ({
          ...data,
          email: data.email.toLowerCase(),
        })),
      )

      const pipe = new ValibotValidationPipe(schema)
      const input = { email: 'TEST@EXAMPLE.COM' }

      const result = pipe.transform(input)

      expect(result).toEqual({ email: 'test@example.com' })
    })
  })
})
