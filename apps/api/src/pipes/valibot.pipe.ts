import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import { BaseSchema, InferOutput, parse, parseAsync, ValiError } from 'valibot'

@Injectable()
export class ValibotValidationPipe<TSchema extends BaseSchema<unknown, unknown, any>>
implements PipeTransform<unknown, InferOutput<TSchema>> {
  constructor(
    private schema: TSchema,
    private options?: { async?: boolean },
  ) {}

  async transform(value: unknown): Promise<InferOutput<TSchema>> {
    try {
      if (this.options?.async) {
        return await parseAsync(this.schema, value)
      }
      return parse(this.schema, value)
    }
    catch (error) {
      if (error instanceof ValiError) {
        const errors = error.issues.map(issue => ({
          path: issue.path?.map(p => String(p.key ?? '')).filter(Boolean).join('.') || '',
          message: issue.message,
        }))
        throw new BadRequestException({
          message: 'Validation failed',
          errors,
        })
      }
      throw error
    }
  }
}
