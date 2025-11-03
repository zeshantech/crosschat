import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('team')
@UseGuards(AuthGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  async findAll(@Query('businessId') businessId: string) {
    return this.teamService.findAll(businessId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.teamService.findOne(id);
  }

  @Post('invite')
  async invite(
    @Body() inviteDto: InviteTeamMemberDto,
    @Query('businessId') businessId: string,
  ) {
    return this.teamService.invite(inviteDto, businessId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTeamMemberDto,
  ) {
    return this.teamService.update(id, updateDto);
  }

  @Patch(':id/role')
  async updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.teamService.updateRole(id, role);
  }

  @Post(':id/deactivate')
  async deactivate(@Param('id') id: string) {
    return this.teamService.deactivate(id);
  }

  @Post(':id/activate')
  async activate(@Param('id') id: string) {
    return this.teamService.activate(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.teamService.remove(id);
  }
}
