import { IsString, IsUUID, IsEnum, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  conversation_id: string;

  @IsEnum(['customer', 'agent', 'system', 'ai_bot'])
  sender_type: string;

  @IsOptional()
  @IsUUID()
  sender_id?: string;

  @IsOptional()
  @IsString()
  sender_name?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(['text', 'image', 'video', 'audio', 'file', 'location', 'contact', 'sticker'])
  content_type?: string;

  @IsOptional()
  @IsArray()
  attachments?: any[];

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
  platform_message_id?: string;

  @IsOptional()
  @IsBoolean()
  is_internal_note?: boolean;
}
