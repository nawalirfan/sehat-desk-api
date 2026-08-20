import { Module } from '@nestjs/common';
import { AssistantConfigController } from './assistant-config.controller';
import { AssistantConfigService } from './assistant-config.service';
import { AssistantConfigRepository } from './assistant-config.repository';
import { AuthModule } from '../auth/auth.module';
import { VapiModule } from '../vapi/vapi.module';

@Module({
  imports: [AuthModule, VapiModule],
  controllers: [AssistantConfigController],
  providers: [AssistantConfigService, AssistantConfigRepository],
})
export class AssistantConfigModule {}
