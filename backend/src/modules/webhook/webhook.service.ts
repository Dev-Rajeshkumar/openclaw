
import crypto from"crypto";import{prisma}from"../../config";import{ApiError}from"../../utils/ApiError";
export class WebhookService{
  async create(formId:string,userId:string,data:{url:string;events?:string[]}){const form=await prisma.form.findFirst({where:{id:formId,userId}});if(!form)throw ApiError.notFound("Form");return prisma.webhook.create({data:{formId,url:data.url,secret:crypto.randomBytes(32).toString("hex"),events:data.events||["form.submitted"]}});}
  async getByForm(formId:string,userId:string){const form=await prisma.form.findFirst({where:{id:formId,userId}});if(!form)throw ApiError.notFound("Form");return prisma.webhook.findMany({where:{formId}});}
  async delete(webhookId:string,userId:string){const wh=await prisma.webhook.findUnique({where:{id:webhookId},include:{form:true}});if(!wh||wh.form.userId!==userId)throw ApiError.notFound("Webhook");return prisma.webhook.delete({where:{id:webhookId}});}
  signPayload(payload:string,secret:string):string{return crypto.createHmac("sha256",secret).update(payload).digest("hex");}
}
export const webhookService=new WebhookService();
