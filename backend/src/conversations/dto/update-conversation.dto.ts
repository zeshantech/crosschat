import { PartialType } from '@nestjs/mapped-types';
import { CreateConversationDto } from './create-conversation.dto';
import { IsOptional, IsEnum, IsArray, IsString } from 'class-validator';

export class UpdateConversationDto extends PartialType(CreateConversationDto) {
  @IsOptional()
  @IsEnum(['open', 'pending', 'resolved', 'closed', 'archived'])
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
