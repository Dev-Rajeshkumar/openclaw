import prisma from '../prisma/index.js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/response.js';
import { logStatusChange } from './statusLog.service.js';
import { TeamRole, InvitationStatus } from '../types/index.js';
import { sendInvitationEmail } from '../utils/email.js';
import { config } from '../config/index.js';

export async function inviteTeamMember(
  businessId: string,
  invitedBy: string,
  data: {
    email: string;
    role: TeamRole;
  }
) {
  // Check if user is already a member
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    const existingMember = await prisma.teamMember.findFirst({
      where: { businessId, userId: existingUser.id, deletedAt: null },
    });

    if (existingMember) {
      throw new AppError('User is already a member of this business', 409);
    }
  }

  // Check for existing pending invitation
  const existingInvite = await prisma.invitation.findFirst({
    where: {
      businessId,
      email: data.email,
      status: InvitationStatus.Pending,
      expiresAt: { gt: new Date() },
    },
  });

  if (existingInvite) {
    throw new AppError('An invitation is already pending for this email', 409);
  }

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.invitation.create({
    data: {
      businessId,
      email: data.email,
      role: data.role,
      invitedBy,
      token,
      expiresAt,
      status: InvitationStatus.Pending,
    },
  });

  // Send invitation email
  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });

  const inviter = await prisma.user.findUnique({
    where: { id: invitedBy },
  });

  if (business && inviter) {
    const inviteLink = `${config.frontendUrl}/invite?token=${token}`;
    sendInvitationEmail(
      data.email,
      business.name,
      inviter.fullName,
      data.role,
      inviteLink
    ).catch(() => {});
  }

  await logStatusChange({
    entity: 'Invitation',
    entityId: invitation.id,
    action: 'CREATE',
    newValue: InvitationStatus.Pending,
    description: `Invitation sent to ${data.email} as ${data.role}`,
    changedBy: invitedBy,
  });

  return invitation;
}

export async function acceptInvitation(token: string, userId: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    throw new AppError('Invalid invitation token', 404);
  }

  if (invitation.status !== InvitationStatus.Pending) {
    throw new AppError(`Invitation has already been ${invitation.status.toLowerCase()}`, 400);
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.Expired },
    });
    throw new AppError('Invitation has expired', 400);
  }

  // Create team member
  const teamMember = await prisma.$transaction(async (tx) => {
    const member = await tx.teamMember.create({
      data: {
        businessId: invitation.businessId,
        userId,
        role: invitation.role,
        permissions: getDefaultPermissions(invitation.role),
        invitedBy: invitation.invitedBy,
      },
    });

    await tx.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.Accepted },
    });

    return member;
  });

  await logStatusChange({
    entity: 'TeamMember',
    entityId: teamMember.id,
    action: 'ACCEPT_INVITATION',
    newValue: invitation.role,
    description: `User accepted invitation as ${invitation.role}`,
    changedBy: userId,
  });

  return teamMember;
}

export async function rejectInvitation(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    throw new AppError('Invalid invitation token', 404);
  }

  if (invitation.status !== InvitationStatus.Pending) {
    throw new AppError('Invitation is no longer pending', 400);
  }

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: InvitationStatus.Rejected },
  });

  return { message: 'Invitation rejected' };
}

export async function getTeamMembers(businessId: string) {
  return prisma.teamMember.findMany({
    where: { businessId, deletedAt: null },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          avatar: true,
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });
}

export async function getInvitations(businessId: string) {
  return prisma.invitation.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateTeamMemberRole(
  teamMemberId: string,
  businessId: string,
  newRole: TeamRole,
  changedBy: string
) {
  const member = await prisma.teamMember.findFirst({
    where: { id: teamMemberId, businessId, deletedAt: null },
  });

  if (!member) {
    throw new AppError('Team member not found', 404);
  }

  if (member.role === TeamRole.Owner) {
    throw new AppError('Cannot change the role of the business owner', 400);
  }

  const updated = await prisma.teamMember.update({
    where: { id: teamMemberId },
    data: {
      role: newRole,
      permissions: getDefaultPermissions(newRole),
    },
  });

  await logStatusChange({
    entity: 'TeamMember',
    entityId: teamMemberId,
    action: 'UPDATE_ROLE',
    oldValue: member.role,
    newValue: newRole,
    description: `Team member role changed from ${member.role} to ${newRole}`,
    changedBy,
  });

  return updated;
}

export async function removeTeamMember(
  teamMemberId: string,
  businessId: string,
  removedBy: string
) {
  const member = await prisma.teamMember.findFirst({
    where: { id: teamMemberId, businessId, deletedAt: null },
  });

  if (!member) {
    throw new AppError('Team member not found', 404);
  }

  if (member.role === TeamRole.Owner) {
    throw new AppError('Cannot remove the business owner', 400);
  }

  await prisma.teamMember.update({
    where: { id: teamMemberId },
    data: { deletedAt: new Date() },
  });

  await logStatusChange({
    entity: 'TeamMember',
    entityId: teamMemberId,
    action: 'REMOVE',
    oldValue: member.role,
    newValue: 'Removed',
    description: `Team member removed`,
    changedBy: removedBy,
  });

  return { message: 'Team member removed successfully' };
}

export async function cancelInvitation(
  invitationId: string,
  businessId: string
) {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, businessId },
  });

  if (!invitation) {
    throw new AppError('Invitation not found', 404);
  }

  if (invitation.status !== InvitationStatus.Pending) {
    throw new AppError('Can only cancel pending invitations', 400);
  }

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: InvitationStatus.Expired },
  });

  return { message: 'Invitation cancelled' };
}

function getDefaultPermissions(role: TeamRole): string[] {
  switch (role) {
    case TeamRole.Owner:
      return ['*'];
    case TeamRole.Admin:
      return [
        'business:read', 'business:write',
        'client:read', 'client:write', 'client:delete',
        'invoice:read', 'invoice:write', 'invoice:delete',
        'estimate:read', 'estimate:write', 'estimate:delete',
        'payment:read', 'payment:write',
        'expense:read', 'expense:write', 'expense:delete',
        'team:read', 'team:write',
        'report:read',
      ];
    case TeamRole.Accountant:
      return [
        'business:read',
        'client:read', 'client:write',
        'invoice:read', 'invoice:write',
        'payment:read', 'payment:write',
        'expense:read', 'expense:write',
        'report:read',
      ];
    case TeamRole.Manager:
      return [
        'business:read',
        'client:read', 'client:write',
        'invoice:read', 'invoice:write',
        'estimate:read', 'estimate:write',
        'payment:read',
        'expense:read', 'expense:write',
        'report:read',
      ];
    case TeamRole.Employee:
      return [
        'business:read',
        'client:read',
        'invoice:read',
        'estimate:read',
        'expense:read',
      ];
    case TeamRole.Viewer:
      return [
        'business:read',
        'client:read',
        'invoice:read',
        'estimate:read',
        'payment:read',
        'expense:read',
      ];
    default:
      return ['business:read'];
  }
}
