import { Body, Controller, ForbiddenException, Headers, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ToolHandlersService, ToolCallResult, VapiToolCall } from './tool-handlers.service';
import { EndOfCallHandlerService } from './end-of-call-handler.service';

interface VapiToolCallRequest {
  message: {
    toolCallList: VapiToolCall[];
  };
}

// Set as a custom header on each tool in Vapi's dashboard, not a header Vapi sends automatically.
const VAPI_SECRET_HEADER = 'x-vapi-secret';

@Controller('vapi')
export class VapiController {
  constructor(
    private readonly toolHandlers: ToolHandlersService,
    private readonly endOfCallHandler: EndOfCallHandlerService,
    private readonly configService: ConfigService,
  ) {}

  @Post('tool-calls')
  async toolCalls(
    @Body() body: VapiToolCallRequest,
    @Headers() headers: Record<string, string>,
  ): Promise<{ results: ToolCallResult[] }> {
    this.verifySecret(headers);
    const results = await this.toolHandlers.handle(body.message.toolCallList);
    return { results };
  }

  // This is Vapi's general server-events URL. In the dashboard, only end-of-call-report
  // is checked as a sent message type, otherwise every mid-call event lands here too.
  @Post('end-of-call')
  async endOfCall(@Body() body: unknown, @Headers() headers: Record<string, string>) {
    this.verifySecret(headers);
    await this.endOfCallHandler.handle(body);
    return {};
  }

  private verifySecret(headers: Record<string, string>) {
    const expected = this.configService.getOrThrow<string>('VAPI_TOOL_WEBHOOK_SECRET');
    const provided = headers[VAPI_SECRET_HEADER];
    if (provided !== expected) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Invalid webhook secret.' });
    }
  }
}
