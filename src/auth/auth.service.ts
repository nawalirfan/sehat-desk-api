import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { signSessionToken } from './jwt';

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  login(username: string, password: string): { token: string } {
    const expectedUsername = this.configService.getOrThrow<string>('ADMIN_USERNAME');
    const expectedPassword = this.configService.getOrThrow<string>('ADMIN_PASSWORD');

    if (username !== expectedUsername || password !== expectedPassword) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Invalid username or password.' });
    }

    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    return { token: signSessionToken(secret) };
  }
}
