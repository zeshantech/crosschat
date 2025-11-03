import { IsString, IsOptional, IsEmail, IsUrl, IsObject } from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsObject()
  settings?: any;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
