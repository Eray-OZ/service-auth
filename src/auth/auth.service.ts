import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import type { User } from '@prisma/client';
import { Provider, Role } from '@prisma/client';
import { RegisterDto } from './dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    
    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
      provider: Provider.LOCAL,
      role: Role.USER,
      isEmailVerified: false,
      emailVerificationToken,
    });

    // Mock email sending
    console.log(`Email verification token for ${user.email}: ${emailVerificationToken}`);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.password && await this.usersService.validatePassword(password, user.password)) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenValid = await this.usersService.validateRefreshToken(
      refreshToken,
      user.hashedRefreshToken,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string) {
    await this.usersService.clearRefreshToken(userId);
    return { message: 'Logout successful' };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.verifyEmail(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string) {
    const resetToken = await this.usersService.createPasswordResetToken(email);
    if (!resetToken) {
      // Don't reveal if user exists or not
      return { message: 'If an account with that email exists, a password reset link has been sent' };
    }

    // Mock email sending
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return { message: 'If an account with that email exists, a password reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.resetPassword(token, newPassword);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    return { message: 'Password reset successful' };
  }

  async deleteAccount(userId: string) {
    await this.usersService.delete(userId);
    return { message: 'Account deleted successfully' };
  }

  async googleLogin(profile: any) {
    let user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      // Create new user from Google profile
      user = await this.usersService.create({
        email: profile.email,
        provider: Provider.GOOGLE,
        role: Role.USER,
        isEmailVerified: true, // Google users are pre-verified
      });
    } else if (user.provider !== Provider.GOOGLE) {
      throw new UnauthorizedException('This email is already registered with a different method');
    }

    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const jwtExpiry = this.configService.get<string>('JWT_EXPIRY') || '15m';
    const jwtRefreshExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRY') || '7d';

    if (!jwtSecret || !jwtRefreshSecret) {
      throw new Error('JWT secrets are not configured');
    }

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: jwtExpiry as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtRefreshSecret,
      expiresIn: jwtRefreshExpiry as any,
    });

    return { accessToken, refreshToken };
  }
}
