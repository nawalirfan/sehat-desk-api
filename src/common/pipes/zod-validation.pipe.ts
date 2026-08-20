import { PipeTransform, UnprocessableEntityException } from '@nestjs/common';
import { ZodType } from 'zod';

// Same schema also gets called directly (schema.safeParse) inside the Vapi tool handlers, this is just the HTTP adapter around it.
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'One or more fields failed validation.',
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    return result.data;
  }
}
