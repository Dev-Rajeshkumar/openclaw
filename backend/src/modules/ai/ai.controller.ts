
import{Request,Response}from"express";import{aiService}from"./ai.service";import{catchAsync,sendSuccess}from"../../utils";import{AuthenticatedRequest}from"../../types";import{logActivity}from"../../utils/logger";
export const aiController={
  generateForm:catchAsync(async(req:Request,res:Response)=>{const r=await aiService.generateForm(req.body.prompt);await logActivity({userId:(req as AuthenticatedRequest).user!.id,action:"AI_GENERATE",entity:"ai",metadata:{prompt:req.body.prompt.slice(0,50)}});sendSuccess(res,r,200,"Form generated");}),
  analyze:catchAsync(async(req:Request,res:Response)=>{const r=await aiService.analyzeSubmissions(req.body.submissions);sendSuccess(res,r);}),
};
