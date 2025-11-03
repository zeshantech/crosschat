import { IsString, IsOptional, IsObject, IsBoolean, IsEnum } from 'class-validator';

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsEnum(['owner', 'admin', 'manager', 'agent', 'limited_agent'])
  role?: string;

  @IsOptional()
  @IsObject()
  permissions?: any;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
