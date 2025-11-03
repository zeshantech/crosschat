import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(businessId: string, filters?: {
    search?: string;
    tags?: string[];
  }) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`,
      );
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw new NotFoundException('Customer not found');
    return data;
  }

  async findOrCreateByPlatform(
    businessId: string,
    platform: string,
    platformId: string,
    customerData?: Partial<CreateCustomerDto>,
  ) {
    const supabase = this.supabaseService.getClient();

    // Try to find existing customer by platform identifier
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .contains('platform_identifiers', { [platform]: platformId })
      .is('deleted_at', null)
      .single();

    if (existingCustomer) {
      return existingCustomer;
    }

    // Create new customer
    const platformIdentifiers = {
      whatsapp: null,
      instagram: null,
      facebook: null,
      twitter: null,
      telegram: null,
      email: null,
      widget: null,
      [platform]: platformId,
    };

    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        business_id: businessId,
        platform_identifiers: platformIdentifiers,
        ...customerData,
      })
      .select()
      .single();

    if (error) throw error;
    return newCustomer;
  }

  async create(createDto: CreateCustomerDto, businessId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('customers')
      .insert({
        ...createDto,
        business_id: businessId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updateDto: UpdateCustomerDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('customers')
      .update(updateDto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new NotFoundException('Customer not found');
    return data;
  }

  async addNote(id: string, note: string) {
    const supabase = this.supabaseService.getClient();

    const customer = await this.findOne(id);
    const existingNotes = customer.notes || '';
    const updatedNotes = existingNotes
      ? `${existingNotes}\n\n---\n\n${note}`
      : note;

    const { data, error } = await supabase
      .from('customers')
      .update({ notes: updatedNotes })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new NotFoundException('Customer not found');
    return data;
  }

  async addTags(id: string, tags: string[]) {
    const supabase = this.supabaseService.getClient();

    const customer = await this.findOne(id);
    const existingTags = customer.tags || [];
    const uniqueTags = Array.from(new Set([...existingTags, ...tags]));

    const { data, error } = await supabase
      .from('customers')
      .update({ tags: uniqueTags })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new NotFoundException('Customer not found');
    return data;
  }

  async removeTags(id: string, tags: string[]) {
    const supabase = this.supabaseService.getClient();

    const customer = await this.findOne(id);
    const existingTags = customer.tags || [];
    const updatedTags = existingTags.filter((tag) => !tags.includes(tag));

    const { data, error } = await supabase
      .from('customers')
      .update({ tags: updatedTags })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new NotFoundException('Customer not found');
    return data;
  }

  async delete(id: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('customers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new NotFoundException('Customer not found');
    return { message: 'Customer deleted successfully' };
  }

  async getConversations(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('customer_id', id)
      .is('deleted_at', null)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}
