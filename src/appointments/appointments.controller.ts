import { Controller, Get, Param } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { ok } from '../common/envelope';

@Controller('patients/:patientId/appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  list(@Param('patientId') patientId: string) {
    return ok(this.appointmentsService.listByPatient(patientId));
  }
}
