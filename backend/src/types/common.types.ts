import{Request}from"express";
export interface ApiResponse<T=unknown>{success:boolean;data?:T;error?:string;message?:string;}
export interface RequestUser{id:string;email:string;plan:string;}
export interface AuthenticatedRequest extends Request{user?:RequestUser;}
