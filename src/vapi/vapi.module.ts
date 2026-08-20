import { Module } from '@nestjs/common';
import { VapiController } from './vapi.controller';
import { ToolHandlersService } from './tool-handlers.service';
import { EndOfCallHandlerService } from './end-of-call-handler.service';
import { VapiAdminClient } from './vapi-admin.client';
import { PatientsModule } from '../patients/patients.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { TranscriptsModule } from '../transcripts/transcripts.module';

@Module({
  imports: [PatientsModule, AppointmentsModule, TranscriptsModule],
  controllers: [VapiController],
  providers: [ToolHandlersService, EndOfCallHandlerService, VapiAdminClient],
  exports: [VapiAdminClient],
})
export class VapiModule {}
