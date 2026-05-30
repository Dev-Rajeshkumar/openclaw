
import{prisma}from"../../config";import{PAGINATION}from"../../constants";
export class ActivityService{
  async log(data:{userId?:string;action:string;entity?:string;entityId?:string;metadata?:any;ipAddress?:string;userAgent?:string}){return prisma.activityLog.create({data});}
  async getByUser(userId:string,page=1,limit=PAGINATION.defaultLimit){
    const skip=(page-1)*limit;
    const[items,total]=await Promise.all([prisma.activityLog.findMany({where:{userId},orderBy:{createdAt:"desc"},skip,take:limit}),prisma.activityLog.count({where:{userId}})]);
    return{items,total,page,limit};
  }
  async getByEntity(entity:string,entityId:string,page=1,limit=PAGINATION.defaultLimit){
    const skip=(page-1)*limit;
    const[items,total]=await Promise.all([prisma.activityLog.findMany({where:{entity,entityId},orderBy:{createdAt:"desc"},skip,take:limit}),prisma.activityLog.count({where:{entity,entityId}})]);
    return{items,total,page,limit};
  }
  async createAlert(data:{userId?:string;type:string;severity:string;message:string;metadata?:any}){return prisma.alert.create({data});}
  async markRead(alertId:string){return prisma.alert.update({where:{id:alertId},{data:{isRead:true}});}
  async getUnread(userId:string){return prisma.alert.findMany({where:{userId,isRead:false},orderBy:{createdAt:"desc"}});}
}
export const activityService=new ActivityService();
