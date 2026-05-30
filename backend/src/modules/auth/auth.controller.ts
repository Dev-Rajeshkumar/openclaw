
import{Request,Response}from"express";import{authService}from"./auth.service";import{catchAsync,sendSuccess}from"../../utils";import{AuthenticatedRequest}from"../../types";import{logActivity}from"../../utils/logger";
export const authController={
  signup:catchAsync(async(req:Request,res:Response)=>{const result=await authService.signup(req.body);await logActivity({action:"USER_SIGNUP",entity:"user",entityId:result.user.id,metadata:{email:result.user.email},ipAddress:req.ip,userAgent:req.get("User-Agent")||undefined});sendSuccess(res,result,201,"Account created");}),
  login:catchAsync(async(req:Request,res:Response)=>{const result=await authService.login(req.body.email);await logActivity({userId:result.user.id,action:"USER_LOGIN",entity:"user",entityId:result.user.id,ipAddress:req.ip,userAgent:req.get("User-Agent")||undefined});sendSuccess(res,result,200,"Login successful");}),
  me:catchAsync(async(req:Request,res:Response)=>{const user=await authService.getProfile((req as AuthenticatedRequest).user!.id);sendSuccess(res,user);}),
  regenerateApiKey:catchAsync(async(req:Request,res:Response)=>{const key=await authService.regenerateApiKey((req as AuthenticatedRequest).user!.id);await logActivity({userId:(req as AuthenticatedRequest).user!.id,action:"API_KEY_REGENERATED",entity:"user",metadata:{}});sendSuccess(res,{apiKey:key},200,"API key regenerated");}),
};
