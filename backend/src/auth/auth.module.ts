import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './guards/auth.guard';
import { SupabaseStrategy } from './strategies/supabase.strategy';

@Module({
    imports: [
        PassportModule,
        ConfigModule,
        JwtModule.registerAsync({
            useFactory: (configService: ConfigService) => {
              return {
                global: true,
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: 40000 },
              }
            },
            inject: [ConfigService],
          }),
    ],
    providers: [AuthGuard, SupabaseStrategy],
    exports: [AuthGuard, JwtModule]
})
export class AuthModule {}