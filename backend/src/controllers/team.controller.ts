import { Response, NextFunction } from 'express';
import * as teamService from '../services/team.service.js';
import { AuthenticatedRequest, TeamRole } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

export const getMembers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params;
    const members = await teamService.getTeamMembers(businessId);
    res.status(200).json(ApiResponse.success(members));
  } catch (error) {
    next(error);
  }
};

export const invite = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId } = req.params;
    const { email, role } = req.body;

    const invitation = await teamService.inviteTeamMember(businessId, userId, {
      email,
      role: role || TeamRole.Employee,
    });
    res.status(201).json(ApiResponse.created(invitation, 'Invitation sent'));
  } catch (error) {
    next(error);
  }
};

export const acceptInvite = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { token } = req.body;
    const member = await teamService.acceptInvitation(token, userId);
    res.status(200).json(ApiResponse.success(member, 'Invitation accepted'));
  } catch (error) {
    next(error);
  }
};

export const rejectInvite = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.body;
    const result = await teamService.rejectInvitation(token);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId, memberId } = req.params;
    const { role } = req.body;

    const member = await teamService.updateTeamMemberRole(
      memberId,
      businessId,
      role as TeamRole,
      userId
    );
    res.status(200).json(ApiResponse.success(member, 'Role updated'));
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId, memberId } = req.params;
    const result = await teamService.removeTeamMember(memberId, businessId, userId);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

export const getInvitations = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params;
    const invitations = await teamService.getInvitations(businessId);
    res.status(200).json(ApiResponse.success(invitations));
  } catch (error) {
    next(error);
  }
};

export const cancelInvitation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId, invitationId } = req.params;
    const result = await teamService.cancelInvitation(invitationId, businessId);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};
