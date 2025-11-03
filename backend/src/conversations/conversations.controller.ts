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
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { AssignConversationDto } from './dto/assign-conversation.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('conversations')
@UseGuards(AuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async findAll(
    @Query('businessId') businessId: string,
    @Query('status') status?: string,
    @Query('platform') platform?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('unassignedOnly') unassignedOnly?: string,
  ) {
    return this.conversationsService.findAll(businessId, {
      status,
      platform,
      assignedTo,
      unassignedOnly: unassignedOnly === 'true',
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Post()
  async create(
    @Body() createDto: CreateConversationDto,
    @Query('businessId') businessId: string,
  ) {
    return this.conversationsService.create(createDto, businessId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateConversationDto,
  ) {
    return this.conversationsService.update(id, updateDto);
  }

  @Post(':id/assign')
  async assign(
    @Param('id') id: string,
    @Body() assignDto: AssignConversationDto,
  ) {
    return this.conversationsService.assign(id, assignDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.conversationsService.updateStatus(id, status);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.conversationsService.markAsRead(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.conversationsService.delete(id);
  }
}
