import { PartialType } from '@nestjs/mapped-types';
import { CreateBusinessDto } from './create-business.dto';
import { IsOptional, IsEnum } from 'class-validator';

export class UpdateBusinessDto extends PartialType(CreateBusinessDto) {
  @IsOptional()
  @IsEnum(['starter', 'professional', 'business', 'enterprise'])
  plan_type?: string;

  @IsOptional()
  @IsEnum(['trial', 'active', 'past_due', 'cancelled', 'expired'])
  subscription_status?: string;
}
