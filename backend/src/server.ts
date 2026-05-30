
import app from"./app";import{env,prisma}from"./config";
const start=async()=>{try{await prisma.$connect();console.log("✅ MongoDB connected");app.listen(env.port,()=>console.log("🚀 FormFlow API on port "+env.port+" ["+env.nodeEnv+"]"));}catch(e){console.error("❌ Failed:",e);process.exit(1);}};
process.on("SIGTERM",async()=>{await prisma.$disconnect();process.exit(0);});start();
