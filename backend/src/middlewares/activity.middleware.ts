import{Request,Response,NextFunction}from"express";import{AuthenticatedRequest}from"../types";import{prisma}from"../config/prisma";
/** Log every authenticated request to ActivityLog for complete audit trail */
export const activityLogger=(req:Request,res:Response,next:NextFunction)=>{
  const start=Date.now();
  res.on("finish",()=>{
    const user=(req as AuthenticatedRequest).user;
    if(user){
      prisma.activityLog.create({data:{userId:user.id,action:req.method+" "+req.path,entity:req.params.id?req.path.split("/")[3]:undefined,entityId:req.params.id||undefined,metadata:{statusCode:res.statusCode,duration:Date.now()-start},ipAddress:req.ip||undefined,userAgent:req.get("User-Agent")||undefined}}).catch(()=>{});
    }
  });
  next();
};
