
import{Request,Response}from"express";import{submissionService}from"./submission.service";import{catchAsync,sendSuccess,sendPaginated}from"../../utils";import{AuthenticatedRequest}from"../../types";
export const submissionController={
  submit:catchAsync(async(req:Request,res:Response)=>{const result=await submissionService.submit(req.params.slug,req.body,req.ip,req.get("User-Agent")||undefined);if(result.submission.isSpam)return res.json({success:true});if((req.get("Accept")||"").includes("application/json"))return sendSuccess(res,{id:result.submission.id},201,"Received");if(result.form.redirectUrl)return res.redirect(result.form.redirectUrl);res.json({success:true});}),
  getByForm:catchAsync(async(req:Request,res:Response)=>{const r=await submissionService.getByForm((req as AuthenticatedRequest).user!.id,req.params.formId,parseInt(req.query.page as string)||1);sendPaginated(res,r.submissions,r.total,r.page,r.limit);}),
  export:catchAsync(async(req:Request,res:Response)=>{const csv=await submissionService.exportCSV((req as AuthenticatedRequest).user!.id,req.params.formId);res.setHeader("Content-Type","text/csv");res.setHeader("Content-Disposition",'attachment;filename="submissions-'+Date.now()+'.csv"');res.send(csv);}),
};
