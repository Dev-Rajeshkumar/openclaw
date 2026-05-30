
import jwt from"jsonwebtoken";import crypto from"crypto";import{prisma,env}from"../../config";import{ApiError}from"../../utils/ApiError";import{logActivity}from"../../utils/logger";
export class AuthService{
  async signup(data:{email:string;name?:string;avatar?:string}){
    const exists=await prisma.user.findUnique({where:{email:data.email}});
    if(exists)throw ApiError.badRequest("User with this email already exists");
    const apiKey=crypto.randomUUID().replace(/-/g,"");
    const user=await prisma.user.create({data:{...data,apiKey}});
    return{user,token:this.generateToken(user),apiKey};
  }
  async login(email:string){
    const user=await prisma.user.findUnique({where:{email}});
    if(!user)throw ApiError.unauthorized("Invalid email or credentials");
    return{user,token:this.generateToken(user)};
  }
  generateToken(user:{id:string;email:string;plan:string}){return jwt.sign({id:user.id,email:user.email,plan:user.plan},env.jwtSecret,{expiresIn:"30d"});}
  async getProfile(userId:string){const u=await prisma.user.findUnique({where:{id:userId},select:{id:true,email:true,name:true,avatar:true,plan:true,formLimit:true,apiKey:true,createdAt:true,updatedAt:true}});if(!u)throw ApiError.notFound("User not found");return u;}
  async regenerateApiKey(userId:string){const apiKey=crypto.randomUUID().replace(/-/g,"");await prisma.user.update({where:{id:userId},{data:{apiKey}});return apiKey;}
}
export const authService=new AuthService();
