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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('customers')
@UseGuards(AuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll(
    @Query('businessId') businessId: string,
    @Query('search') search?: string,
    @Query('tags') tags?: string,
  ) {
    return this.customersService.findAll(businessId, {
      search,
      tags: tags ? tags.split(',') : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  async create(
    @Body() createDto: CreateCustomerDto,
    @Query('businessId') businessId: string,
  ) {
    return this.customersService.create(createDto, businessId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, updateDto);
  }

  @Post(':id/notes')
  async addNote(@Param('id') id: string, @Body('note') note: string) {
    return this.customersService.addNote(id, note);
  }

  @Post(':id/tags')
  async addTags(@Param('id') id: string, @Body('tags') tags: string[]) {
    return this.customersService.addTags(id, tags);
  }

  @Delete(':id/tags')
  async removeTags(@Param('id') id: string, @Body('tags') tags: string[]) {
    return this.customersService.removeTags(id, tags);
  }

  @Get(':id/conversations')
  async getConversations(@Param('id') id: string) {
    return this.customersService.getConversations(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.customersService.delete(id);
  }
}
