
import{Request,Response}from"express";import{formService}from"./form.service";import{catchAsync,sendSuccess}from"../../utils";import{AuthenticatedRequest}from"../../types";import{logActivity}from"../../utils/logger";
export const formController={
  create:catchAsync(async(req:Request,res:Response)=>{const f=await formService.create((req as AuthenticatedRequest).user!.id,req.body);await logActivity({userId:(req as AuthenticatedRequest).user!.id,action:"FORM_CREATE",entity:"form",entityId:f.id,metadata:{name:f.name}});sendSuccess(res,f,201,"Form created");}),
  getAll:catchAsync(async(req:Request,res:Response)=>{sendSuccess(res,await formService.getByUser((req as AuthenticatedRequest).user!.id));}),
  getById:catchAsync(async(req:Request,res:Response)=>{const f=await formService.getById(req.params.id,(req as AuthenticatedRequest).user!.id);sendSuccess(res,f);}),
  update:catchAsync(async(req:Request,res:Response)=>{const f=await formService.update(req.params.id,(req as AuthenticatedRequest).user!.id,req.body);await logActivity({userId:(req as AuthenticatedRequest).user!.id,action:"FORM_UPDATE",entity:"form",entityId:f.id});sendSuccess(res,f,200,"Form updated");}),
  delete:catchAsync(async(req:Request,res:Response)=>{await formService.delete(req.params.id,(req as AuthenticatedRequest).user!.id);sendSuccess(res,null,200,"Form deleted");}),
};
