import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { StoreModule } from './store/store.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, StoreModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
