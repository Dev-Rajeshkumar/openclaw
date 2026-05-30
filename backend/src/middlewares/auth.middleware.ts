
import{Request,Response,NextFunction}from"express";import jwt from"jsonwebtoken";import{env}from"../config";import{ApiError}from"../utils/ApiError";import{prisma}from"../config/prisma";import{AuthenticatedRequest}from"../types";import{logAndAlert}from"../utils/logger";
/** Verify Bearer JWT and attach user to request; logs failed attempts */
export const authenticate=(req:Request,_res:Response,next:NextFunction)=>{
  const auth=req.headers.authorization;
  if(!auth?.startsWith("Bearer ")){
    logAndAlert({action:"AUTH_FAILED",entity:"auth",ipAddress:req.ip,userAgent:req.get("User-Agent")||undefined,metadata:{reason:"Missing token",path:req.path}},"warning","Unauthorized Access Attempt","No Bearer token on "+req.path);
    throw ApiError.unauthorized("Missing or invalid authorization");
  }
  try{(req as AuthenticatedRequest).user=jwt.verify(auth.split(" ")[1],env.jwtSecret) as any;next();}
  catch{
    logAndAlert({action:"AUTH_FAILED",entity:"auth",ipAddress:req.ip,userAgent:req.get("User-Agent")||undefined,metadata:{reason:"Invalid token",path:req.path}},"warning","Unauthorized Access Attempt","Invalid or expired token");
    throw ApiError.unauthorized("Invalid or expired token");
  }
};
/** Verify X-API-Key header and attach user to request */
export const authenticateApiKey=async(req:Request,_res:Response,next:NextFunction)=>{
  const key=req.headers["x-api-key"] as string;
  if(!key)throw ApiError.unauthorized("Missing API key");
  const user=await prisma.user.findUnique({where:{apiKey:key}});
  if(!user)throw ApiError.unauthorized("Invalid API key");
  (req as AuthenticatedRequest).user={id:user.id,email:user.email,plan:user.plan};next();
};
