import{Response}from"express";
export const sendSuccess=<T>(res:Response,data:T,code=200,msg?:string)=>res.status(code).json({success:true,data,message:msg});
export const sendPaginated=<T>(res:Response,data:T[],total:number,page:number,limit:number)=>res.status(200).json({success:true,data,total,page,limit,totalPages:Math.ceil(total/limit)});
