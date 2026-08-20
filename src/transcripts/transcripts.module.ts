import { Module } from '@nestjs/common';
import { TranscriptsController } from './transcripts.controller';
import { TranscriptsService } from './transcripts.service';
import { TranscriptsRepository } from './transcripts.repository';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [PatientsModule],
  controllers: [TranscriptsController],
  providers: [TranscriptsService, TranscriptsRepository],
  exports: [TranscriptsService],
})
export class TranscriptsModule {}
