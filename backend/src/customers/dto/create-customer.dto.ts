import { IsString, IsOptional, IsEmail, IsObject, IsArray } from 'class-validator';

export class CreateCustomerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;

  @IsOptional()
  @IsObject()
  platform_identifiers?: {
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    telegram?: string;
    email?: string;
    widget?: string;
  };

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}
