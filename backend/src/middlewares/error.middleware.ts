import{Request,Response,NextFunction}from"express";import{ApiError}from"../utils/ApiError";import{env}from"../config";import{logAndAlert}from"../utils/logger";
/** Centralized error handler — returns JSON error, reports 500s to Discord */
export const errorHandler=(err:Error|ApiError,_req:Request,res:Response,_next:NextFunction)=>{
  console.error("Error:",env.nodeEnv==="development"?err:err.message);
  if(err instanceof ApiError){
    if(err.statusCode>=500)logAndAlert({action:"SERVER_ERROR",entity:"system",metadata:{error:err.message,stack:err.stack}},"critical","Server Error",`${err.statusCode}: ${err.message}`);
    return res.status(err.statusCode).json({success:false,error:err.message});
  }
  logAndAlert({action:"UNHANDLED_ERROR",entity:"system",metadata:{error:err.message,stack:err.stack}},"critical","Unhandled Error",err.message);
  res.status(500).json({success:false,error:env.nodeEnv==="development"?err.message:"Internal server error"});
};
/** 404 handler for unmatched routes */
export const notFoundHandler=(req:Request,res:Response)=>{res.status(404).json({success:false,error:`Route ${req.method} ${req.originalUrl} not found`});};
