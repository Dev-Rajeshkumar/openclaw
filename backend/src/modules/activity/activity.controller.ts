
import{Request,Response}from"express";import{activityService}from"./activity.service";import{catchAsync,sendSuccess,sendPaginated}from"../../utils";import{AuthenticatedRequest}from"../../types";
export const activityController={
  getMy:catchAsync(async(req:Request,res:Response)=>{const r=await activityService.getByUser((req as AuthenticatedRequest).user!.id,parseInt(req.query.page as string)||1);sendPaginated(res,r.items,r.total,r.page,r.limit);}),
  getByForm:catchAsync(async(req:Request,res:Response)=>{const r=await activityService.getByEntity("form",req.params.formId,parseInt(req.query.page as string)||1);sendPaginated(res,r.items,r.total,r.page,r.limit);}),
  markRead:catchAsync(async(req:Request,res:Response)=>{await activityService.markRead(req.params.id);sendSuccess(res,null,200,"Alert marked read");}),
  getUnread:catchAsync(async(req:Request,res:Response)=>{const alerts=await activityService.getUnread((req as AuthenticatedRequest).user!.id);sendSuccess(res,alerts);}),
};
