
import{prisma}from"../../config";import{ApiError}from"../../utils/ApiError";import{formService}from"../form/form.service";import{PAGINATION}from"../../constants";
export class SubmissionService{
  async submit(slug:string,data:Record<string,string>,ip?:string,ua?:string){
    const form=await formService.getBySlug(slug);if(!form||!form.isActive)throw ApiError.notFound("Form not found or inactive");
    const{_honeypot,...cleanData}=data;const isSpam=!!_honeypot;
    const sub=await prisma.submission.create({data:{formId:form.id,data:cleanData,ipAddress:ip,userAgent:ua,isSpam}});
    formService.incrementCount(form.id).catch(console.error);return{submission:sub,form};
  }
  async getByForm(userId:string,formId:string,page=1,limit=PAGINATION.defaultLimit){
    const form=await prisma.form.findFirst({where:{id:formId,userId}});if(!form)throw ApiError.notFound("Form");
    const skip=(page-1)*limit;
    const[submissions,total]=await Promise.all([prisma.submission.findMany({where:{formId},orderBy:{createdAt:"desc"},skip,take:limit}),prisma.submission.count({where:{formId}})]);
    return{submissions,total,page,limit};
  }
  async exportCSV(userId:string,formId:string){
    const form=await prisma.form.findFirst({where:{id:formId,userId}});if(!form)throw ApiError.notFound("Form");
    const subs=await prisma.submission.findMany({where:{formId,isSpam:false},orderBy:{createdAt:"desc"}});
    if(!subs.length)return"id,ip_address,is_spam,created_at
";
    const keys=Array.from(new Set(subs.flatMap(s=>Object.keys(s.data as any))));
    return[["id","ip_address","is_spam","created_at",...keys],...subs.map(s=>[s.id,s.ipAddress||"",s.isSpam+"",s.createdAt.toISOString(),...keys.map(k=>"\""+((s.data as any)[k]||"").replace(/"/g,'\"')+"\"')].join(","))].join("\n");
  }
}
export const submissionService=new SubmissionService();
