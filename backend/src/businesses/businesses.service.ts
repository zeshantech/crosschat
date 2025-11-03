import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findByUser(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('team_members')
      .select(`
        business:businesses(
          *
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
    return data.map((item) => item.business);
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw new NotFoundException('Business not found');
    return data;
  }

  async create(createDto: CreateBusinessDto, userId: string) {
    const supabase = this.supabaseService.getClient();

    // Generate slug from name
    const slug = this.generateSlug(createDto.name);

    // Create business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        ...createDto,
        slug,
      })
      .select()
      .single();

    if (businessError) throw businessError;

    // Add creator as owner
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        business_id: business.id,
        user_id: userId,
        role: 'owner',
        is_active: true,
        joined_at: new Date().toISOString(),
      });

    if (memberError) throw memberError;

    return business;
  }

  async update(id: string, updateDto: UpdateBusinessDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('businesses')
      .update(updateDto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new NotFoundException('Business not found');
    return data;
  }

  async updateSettings(id: string, settings: any) {
    const supabase = this.supabaseService.getClient();

    const business = await this.findOne(id);
    const mergedSettings = { ...business.settings, ...settings };

    const { data, error } = await supabase
      .from('businesses')
      .update({ settings: mergedSettings })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new NotFoundException('Business not found');
    return data;
  }

  async delete(id: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('businesses')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new NotFoundException('Business not found');
    return { message: 'Business deleted successfully' };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }
}
