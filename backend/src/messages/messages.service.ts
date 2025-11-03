import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findByConversation(conversationId: string, limit = 50, offset = 0) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new NotFoundException('Message not found');
    return data;
  }

  async create(createDto: CreateMessageDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('messages')
      .insert(createDto)
      .select()
      .single();

    if (error) throw error;

    // Auto-mark as delivered after sending
    if (createDto.sender_type === 'agent' || createDto.sender_type === 'ai_bot') {
      await this.markAsDelivered(data.id);
    }

    return data;
  }

  async markAsRead(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('messages')
      .update({
        status: 'read',
        read_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new NotFoundException('Message not found');
    return data;
  }

  async markAsDelivered(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('messages')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new NotFoundException('Message not found');
    return data;
  }

  async delete(id: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase.from('messages').delete().eq('id', id);

    if (error) throw new NotFoundException('Message not found');
    return { message: 'Message deleted successfully' };
  }
}
