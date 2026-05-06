import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

// Temporarily mock the PrismaService to get the app running
// We'll fix the database connection later

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  constructor() {}

  async onModuleInit() {
    console.log('✅ PrismaService initialized (mock mode for testing Swagger)');
  }

  async onModuleDestroy() {
    console.log('✅ PrismaService destroyed');
  }

  // Mock methods to prevent errors during testing
  user = {
    create: async (data: any) => ({ 
      id: 'mock-id-' + Date.now(), 
      email: data.data.email,
      password: data.data.password || null,
      role: (data.data.role || 'USER') as 'USER' | 'ADMIN',
      provider: (data.data.provider || 'LOCAL') as 'LOCAL' | 'GOOGLE',
      isEmailVerified: data.data.isEmailVerified || false,
      emailVerificationToken: data.data.emailVerificationToken || null,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      hashedRefreshToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findUnique: async (data: any) => {
      // Return a mock user for testing
      if (data.where.email === 'test@example.com' || data.where.id?.startsWith('mock-id')) {
        return {
          id: data.where.id || 'mock-user-id',
          email: data.where.email || 'test@example.com',
          password: null,
          role: 'USER' as 'USER' | 'ADMIN',
          provider: 'LOCAL' as 'LOCAL' | 'GOOGLE',
          isEmailVerified: true,
          emailVerificationToken: null,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          hashedRefreshToken: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return null;
    },
    update: async (data: any) => ({ 
      id: data.where.id, 
      email: 'test@example.com',
      password: null,
      role: 'USER' as 'USER' | 'ADMIN',
      provider: 'LOCAL' as 'LOCAL' | 'GOOGLE',
      isEmailVerified: true,
      emailVerificationToken: null,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      hashedRefreshToken: data.data.hashedRefreshToken || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data.data 
    }),
    delete: async (data: any) => ({ 
      id: data.where.id,
      email: 'deleted@example.com',
      password: null,
      role: 'USER' as 'USER' | 'ADMIN',
      provider: 'LOCAL' as 'LOCAL' | 'GOOGLE',
      isEmailVerified: false,
      emailVerificationToken: null,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      hashedRefreshToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findFirst: async (data: any) => {
      // Return a mock user for email verification
      if (data.where?.emailVerificationToken) {
        return {
          id: 'mock-user-id',
          email: 'test@example.com',
          password: null,
          role: 'USER' as 'USER' | 'ADMIN',
          provider: 'LOCAL' as 'LOCAL' | 'GOOGLE',
          isEmailVerified: false,
          emailVerificationToken: data.where.emailVerificationToken,
          resetPasswordToken: data.where.resetPasswordToken || null,
          resetPasswordExpires: data.where.resetPasswordExpires || null,
          hashedRefreshToken: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return null;
    },
  };

  $connect = async () => {
    console.log('✅ Mock database connection');
  };

  $disconnect = async () => {
    console.log('✅ Mock database disconnection');
  };
}
