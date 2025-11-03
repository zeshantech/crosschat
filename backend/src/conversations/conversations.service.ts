import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { AssignConversationDto } from './dto/assign-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(businessId: string, filters?: {
    status?: string;
    platform?: string;
    assignedTo?: string;
    unassignedOnly?: boolean;
  }) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('conversations')
      .select(`
        *,
        customer:customers(*),
        assigned_member:team_members(
          id,
          user:users(
            id,
            full_name,
            avatar_url,
            email
          ),
          role
        )
      `)
      .eq('business_id', businessId)
      .is('deleted_at', null)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.platform) {
      query = query.eq('platform', filters.platform);
    }

    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    if (filters?.unassignedOnly) {
      query = query.is('assigned_to', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        customer:customers(*),
        assigned_member:team_members(
          id,
          user:users(
            id,
            full_name,
            avatar_url,
            email
          ),
          role
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw new NotFoundException('Conversation not found');
    return data;
  }

  async create(createDto: CreateConversationDto, businessId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        ...createDto,
        business_id: businessId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updateDto: UpdateConversationDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('conversations')
      .update(updateDto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new NotFoundException('Conversation not found');
    return data;
  }

  async assign(id: string, assignDto: AssignConversationDto) {
    const supabase = this.supabaseService.getClient();

    const updateData: any = {
      assigned_to: assignDto.teamMemberId || null,
      assigned_type: assignDto.assignmentType,
    };

    const { data, error } = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new NotFoundException('Conversation not found');

    // Create notification for assigned team member
    if (assignDto.teamMemberId) {
      await this.createAssignmentNotification(id, assignDto.teamMemberId);
    }

    return data;
  }

  async updateStatus(id: string, status: string) {
    const supabase = this.supabaseService.getClient();

    const updateData: any = { status };

    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new NotFoundException('Conversation not found');
    return data;
  }

  async delete(id: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('conversations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new NotFoundException('Conversation not found');
    return { message: 'Conversation deleted successfully' };
  }

  async markAsRead(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('conversations')
      .update({ unread_count: 0 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new NotFoundException('Conversation not found');
    return data;
  }

  private async createAssignmentNotification(conversationId: string, teamMemberId: string) {
    const supabase = this.supabaseService.getClient();

    // Get team member's user_id
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('user_id, business_id')
      .eq('id', teamMemberId)
      .single();

    if (teamMember) {
      await supabase.from('notifications').insert({
        user_id: teamMember.user_id,
        business_id: teamMember.business_id,
        type: 'conversation_assigned',
        title: 'New conversation assigned',
        message: 'A new conversation has been assigned to you',
        action_url: `/conversations/${conversationId}`,
        action_label: 'View Conversation',
      });
    }
  }
}
