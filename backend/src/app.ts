
import express from"express";import cors from"cors";import helmet from"helmet";import morgan from"morgan";import{env}from"./config";import routes from"./routes";import{errorHandler,notFoundHandler}from"./middlewares";import{paymentController}from"./modules/payment/payment.controller";
const app=express();app.use(helmet());app.use(cors({origin:env.corsOrigins,methods:["GET","POST","PUT","PATCH","DELETE"],allowedHeaders:["Content-Type","Authorization","X-API-Key"],credentials:true}));
if(env.nodeEnv==="development")app.use(morgan("dev"));
app.post("/api/v1/webhooks/stripe",express.raw({type:"application/json"}),paymentController.webhook);
app.use(express.json({limit:"10mb"}));app.use(express.urlencoded({extended:true}));
app.get("/health",(_req,res)=>res.json({status:"ok",ts:new Date().toISOString()}));
app.use(routes);app.use(notFoundHandler);app.use(errorHandler);
export default app;
