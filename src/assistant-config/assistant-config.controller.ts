import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AssistantConfigService } from './assistant-config.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { assistantConfigUpdateSchema } from './assistant-config.schema';
import type { AssistantConfigUpdateInput } from './assistant-config.schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ok } from '../common/envelope';

@Controller('assistant-config')
export class AssistantConfigController {
  constructor(private readonly assistantConfigService: AssistantConfigService) {}

  @Get()
  get() {
    return ok(this.assistantConfigService.get());
  }

  @Get('default-prompt')
  getDefaultPrompt() {
    return ok({ prompt: this.assistantConfigService.getDefaultPrompt() });
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  async update(@Body(new ZodValidationPipe(assistantConfigUpdateSchema)) body: AssistantConfigUpdateInput) {
    return ok(await this.assistantConfigService.update(body));
  }
}
