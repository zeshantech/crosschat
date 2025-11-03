import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  customer_id: string;

  @IsEnum([
    'whatsapp',
    'instagram',
    'facebook',
    'twitter',
    'telegram',
    'email',
    'widget',
    'voice_call',
    'sms',
  ])
  platform: string;

  @IsOptional()
  @IsString()
  platform_conversation_id?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsEnum(['low', 'normal', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsUUID()
  assigned_to?: string;
}
