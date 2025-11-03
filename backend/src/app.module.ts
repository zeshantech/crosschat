import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { StoreModule } from './store/store.module';
import { SupabaseModule } from './common/supabase/supabase.module';
import { BusinessesModule } from './businesses/businesses.module';
import { TeamModule } from './team/team.module';
import { CustomersModule } from './customers/customers.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    StoreModule,
    BusinessesModule,
    TeamModule,
    CustomersModule,
    ConversationsModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
