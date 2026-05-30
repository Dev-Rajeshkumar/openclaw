import{prisma}from"../../config";import{ApiError}from"../../utils/ApiError";
/** Form service — CRUD operations with plan limit enforcement */
export class FormService{
  async create(userId:string,data:any){
    const user=await prisma.user.findUnique({where:{id:userId}});
    if(!user)throw ApiError.notFound("User");
    const count=await prisma.form.count({where:{userId}});
    const limit=user.plan==="FREE"?3:Infinity;
    if(count>=limit)throw ApiError.badRequest("Form limit reached ("+limit+")");
    const slug=data.slug||data.name.toLowerCase().replace(/[^a-z0-9]+/g,"-");
    if(await prisma.form.findUnique({where:{slug}}))throw ApiError.badRequest("Slug already taken");
    return prisma.form.create({data:{userId,name:data.name,slug,fields:data.fields||[],description:data.description,aiPrompt:data.aiPrompt||undefined,spamFilters:data.spamFilters||{}}});
  }
  async getByUser(userId:string){return prisma.form.findMany({where:{userId},orderBy:{createdAt:"desc"},include:{_count:{select:{submissions:true}}}});}
  async getById(id:string,userId:string){const f=await prisma.form.findFirst({where:{id,userId},include:{_count:{select:{submissions:true}},webhooks:true,integrations:true}});if(!f)throw ApiError.notFound("Form");return f;}
  async getBySlug(slug:string){return prisma.form.findUnique({where:{slug}});}
  async update(id:string,userId:string,data:any){await this.getById(id,userId);return prisma.form.update({where:{id},data});}
  async delete(id:string,userId:string){await this.getById(id,userId);return prisma.form.delete({where:{id}});}
  async incrementCount(formId:string){return prisma.form.update({where:{id:formId},{data:{submitCount:{increment:1}}});}
}
export const formService=new FormService();
