import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';

@Injectable()
export class TeamService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(businessId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        user:users(
          id,
          email,
          full_name,
          avatar_url,
          status,
          last_seen_at
        )
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        user:users(
          id,
          email,
          full_name,
          avatar_url,
          status,
          last_seen_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw new NotFoundException('Team member not found');
    return data;
  }

  async invite(inviteDto: InviteTeamMemberDto, businessId: string) {
    const supabase = this.supabaseService.getClient();

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', inviteDto.email)
      .single();

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('business_id', businessId)
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        throw new Error('User is already a team member');
      }
    } else {
      // Create placeholder user (will be completed on signup)
      // Note: In production, use Supabase Auth invites
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: inviteDto.email,
          full_name: inviteDto.full_name,
        })
        .select()
        .single();

      if (userError) throw userError;
      userId = newUser.id;
    }

    // Create team member
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        business_id: businessId,
        user_id: userId,
        role: inviteDto.role,
        department: inviteDto.department,
        title: inviteDto.title,
        permissions: this.getDefaultPermissions(inviteDto.role),
      })
      .select(`
        *,
        user:users(*)
      `)
      .single();

    if (error) throw error;

    // TODO: Send invitation email
    return data;
  }

  async update(id: string, updateDto: UpdateTeamMemberDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('team_members')
      .update(updateDto)
      .eq('id', id)
      .select(`
        *,
        user:users(*)
      `)
      .single();

    if (error) throw new NotFoundException('Team member not found');
    return data;
  }

  async updateRole(id: string, role: string) {
    const permissions = this.getDefaultPermissions(role);

    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('team_members')
      .update({ role, permissions })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new NotFoundException('Team member not found');
    return data;
  }

  async remove(id: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) throw new NotFoundException('Team member not found');
    return { message: 'Team member removed successfully' };
  }

  async deactivate(id: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('team_members')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw new NotFoundException('Team member not found');
    return { message: 'Team member deactivated successfully' };
  }

  async activate(id: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('team_members')
      .update({ is_active: true })
      .eq('id', id);

    if (error) throw new NotFoundException('Team member not found');
    return { message: 'Team member activated successfully' };
  }

  private getDefaultPermissions(role: string) {
    const permissionsMap = {
      owner: {
        conversations: {
          view_all: true,
          view_assigned: true,
          reply: true,
          assign: true,
          close: true,
        },
        customers: { view: true, edit: true, delete: true },
        team: { view: true, invite: true, edit: true, remove: true },
        settings: { view: true, edit: true },
        billing: { view: true, edit: true },
      },
      admin: {
        conversations: {
          view_all: true,
          view_assigned: true,
          reply: true,
          assign: true,
          close: true,
        },
        customers: { view: true, edit: true, delete: true },
        team: { view: true, invite: true, edit: true, remove: true },
        settings: { view: true, edit: true },
        billing: { view: true, edit: false },
      },
      manager: {
        conversations: {
          view_all: true,
          view_assigned: true,
          reply: true,
          assign: true,
          close: true,
        },
        customers: { view: true, edit: true, delete: false },
        team: { view: true, invite: true, edit: false, remove: false },
        settings: { view: true, edit: false },
        billing: { view: false, edit: false },
      },
      agent: {
        conversations: {
          view_all: true,
          view_assigned: true,
          reply: true,
          assign: false,
          close: true,
        },
        customers: { view: true, edit: true, delete: false },
        team: { view: true, invite: false, edit: false, remove: false },
        settings: { view: false, edit: false },
        billing: { view: false, edit: false },
      },
      limited_agent: {
        conversations: {
          view_all: false,
          view_assigned: true,
          reply: true,
          assign: false,
          close: true,
        },
        customers: { view: true, edit: false, delete: false },
        team: { view: true, invite: false, edit: false, remove: false },
        settings: { view: false, edit: false },
        billing: { view: false, edit: false },
      },
    };

    return permissionsMap[role] || permissionsMap.agent;
  }
}
