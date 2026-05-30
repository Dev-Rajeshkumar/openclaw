import{prisma}from"../../config";import{ApiError}from"../../utils/ApiError";
/** Supported integration types */
const TYPES=["zapier","make","google_sheets","salesforce","slack","notion","airtable"];
export class IntegrationService{
  async create(formId:string,userId:string,data:{type:string;config:any}){
    const form=await prisma.form.findFirst({where:{id:formId,userId}});
    if(!form)throw ApiError.notFound("Form");
    if(!TYPES.includes(data.type))throw ApiError.badRequest("Supported types: "+TYPES.join(", "));
    return prisma.integration.create({data:{formId,type:data.type,config:data.config}});
  }
  async getByForm(formId:string,userId:string){
    const form=await prisma.form.findFirst({where:{id:formId,userId}});
    if(!form)throw ApiError.notFound("Form");
    return prisma.integration.findMany({where:{formId}});
  }
  async delete(id:string,userId:string){
    const int=await prisma.integration.findUnique({where:{id},include:{form:true}});
    if(!int||int.form.userId!==userId)throw ApiError.notFound("Integration");
    return prisma.integration.delete({where:{id}});
  }
}
export const integrationService=new IntegrationService();
