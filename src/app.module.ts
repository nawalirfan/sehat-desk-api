import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { TranscriptsModule } from './transcripts/transcripts.module';
import { VapiModule } from './vapi/vapi.module';
import { AuthModule } from './auth/auth.module';
import { AssistantConfigModule } from './assistant-config/assistant-config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    // 100 requests per minute per IP. Vapi's own servers share one egress IP across every concurrent
    // call's tool calls, so this needs real headroom, still a hard ceiling against actual abuse.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    PatientsModule,
    AppointmentsModule,
    TranscriptsModule,
    VapiModule,
    AuthModule,
    AssistantConfigModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
