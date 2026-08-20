import { Controller, Get, Param } from '@nestjs/common';
import { TranscriptsService } from './transcripts.service';
import { ok } from '../common/envelope';

@Controller('patients/:patientId/transcripts')
export class TranscriptsController {
  constructor(private readonly transcriptsService: TranscriptsService) {}

  @Get()
  list(@Param('patientId') patientId: string) {
    return ok(this.transcriptsService.listByPatient(patientId));
  }
}
