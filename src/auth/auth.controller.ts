import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  UseGuards,
  Request,
  Res,
  HttpStatus,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard, RefreshTokenGuard, GoogleGuard } from './guards';
import { CurrentUser } from './decorators';
import { Public } from './decorators/public.decorator';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto';
import { User } from '@prisma/client';
import { ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req, @Body() refreshDto: RefreshTokenDto) {
    return this.authService.refreshTokens(req.user.userId, refreshDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: User) {
    return this.authService.logout(user.id);
  }

  @Public()
  @Get('verify-email')
  async verifyEmail(@Query() verifyDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyDto.token);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotDto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetDto.token, resetDto.password);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@CurrentUser() user: User) {
    return this.authService.deleteAccount(user.id);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleGuard)
  async googleAuth() {
    // This route initiates the Google OAuth flow
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleGuard)
  async googleAuthCallback(@Request() req, @Res() res: Response) {
    const tokens = await this.authService.googleLogin(req.user);
    
    // Redirect to frontend with tokens (adjust URL as needed)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/success?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  }
}
