
import{Request,Response}from"express";import{webhookService}from"./webhook.service";import{catchAsync,sendSuccess}from"../../utils";import{AuthenticatedRequest}from"../../types";
export const webhookController={
  create:catchAsync(async(req:Request,res:Response)=>{sendSuccess(res,await webhookService.create(req.params.formId,(req as AuthenticatedRequest).user!.id,req.body),201,"Webhook created");}),
  getByForm:catchAsync(async(req:Request,res:Response)=>{sendSuccess(res,await webhookService.getByForm(req.params.formId,(req as AuthenticatedRequest).user!.id));}),
  delete:catchAsync(async(req:Request,res:Response)=>{await webhookService.delete(req.params.id,(req as AuthenticatedRequest).user!.id);sendSuccess(res,null,200,"Webhook deleted");}),
};
