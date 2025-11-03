import { IsUUID, IsOptional, IsEnum } from 'class-validator';

export class AssignConversationDto {
  @IsOptional()
  @IsUUID()
  teamMemberId?: string;

  @IsEnum(['unassigned', 'ai_bot', 'team_member', 'round_robin'])
  assignmentType: string;
}
