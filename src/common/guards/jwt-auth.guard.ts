import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { verifySessionToken } from '../../auth/jwt';

// Only guards PUT /assistant-config, every other route stays open on purpose.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;

    if (!token) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Missing bearer token.' });
    }

    try {
      const secret = this.configService.getOrThrow<string>('JWT_SECRET');
      verifySessionToken(token, secret);
      return true;
    } catch {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Invalid or expired token.' });
    }
  }
}
