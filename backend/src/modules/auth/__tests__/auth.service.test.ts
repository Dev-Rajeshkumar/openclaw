
import{AuthService}from"../auth.service";import{ApiError}from"../../../utils";
jest.mock("../../../config",()=>({prisma:{user:{findUnique:jest.fn(),create:jest.fn(),update:jest.fn()}},env:{jwtSecret:"test"}}));
import{prisma}from"../../../config";
describe("AuthService",()=>{let svc:AuthService;beforeEach(()=>{svc=new AuthService();jest.clearAllMocks();});
it("signup creates user with token",async()=>{(prisma.user.findUnique as jest.Mock).mockResolvedValue(null);(prisma.user.create as jest.Mock).mockResolvedValue({id:"u1",email:"a@b.com",plan:"FREE"});const r=await svc.signup({email:"a@b.com",name:"Test"});expect(r.token).toBeDefined();expect(r.apiKey).toBeDefined();});
it("signup throws on duplicate email",async()=>{(prisma.user.findUnique as jest.Mock).mockResolvedValue({id:"x"});await expect(svc.signup({email:"a@b.com"})).rejects.toThrow(ApiError);});
it("login succeeds",async()=>{(prisma.user.findUnique as jest.Mock).mockResolvedValue({id:"u1",email:"a@b.com",plan:"FREE"});const r=await svc.login("a@b.com");expect(r.token).toBeDefined();});
it("login throws for missing user",async()=>{(prisma.user.findUnique as jest.Mock).mockResolvedValue(null);await expect(svc.login("x@y.com")).rejects.toThrow("Invalid");});
});
