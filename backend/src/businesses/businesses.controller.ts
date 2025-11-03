import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('businesses')
@UseGuards(AuthGuard)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get()
  async findByUser(@CurrentUser() user: any) {
    return this.businessesService.findByUser(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.businessesService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateBusinessDto, @CurrentUser() user: any) {
    return this.businessesService.create(createDto, user.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateBusinessDto,
  ) {
    return this.businessesService.update(id, updateDto);
  }

  @Patch(':id/settings')
  async updateSettings(
    @Param('id') id: string,
    @Body('settings') settings: any,
  ) {
    return this.businessesService.updateSettings(id, settings);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.businessesService.delete(id);
  }
}
