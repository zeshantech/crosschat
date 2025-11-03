import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';

export class InviteTeamMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsEnum(['owner', 'admin', 'manager', 'agent', 'limited_agent'])
  role: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  title?: string;
}
