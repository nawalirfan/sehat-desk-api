import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { patientCreateSchema, patientQuerySchema, patientUpdateSchema } from './patients.schema';
import { ok } from '../common/envelope';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  list(@Query(new ZodValidationPipe(patientQuerySchema)) query: ReturnType<typeof patientQuerySchema.parse>) {
    return ok(this.patientsService.list(query));
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return ok(this.patientsService.getById(id));
  }

  @Post()
  @HttpCode(201)
  create(@Body(new ZodValidationPipe(patientCreateSchema)) body: ReturnType<typeof patientCreateSchema.parse>) {
    return ok(this.patientsService.create(body));
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(patientUpdateSchema)) body: ReturnType<typeof patientUpdateSchema.parse>,
  ) {
    return ok(this.patientsService.update(id, body));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return ok(this.patientsService.softDelete(id));
  }
}
