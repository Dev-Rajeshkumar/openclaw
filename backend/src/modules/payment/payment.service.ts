import Stripe from"stripe";import{prisma}from"../../config";import{ApiError}from"../../utils/ApiError";import{env}from"../../config/env";
/** Stripe payment service — creates checkout sessions and handles webhooks */
const stripe=env.stripeSecretKey?new Stripe(env.stripeSecretKey,{apiVersion:"2024-04-10" as any}):null;
export class PaymentService{
  async createCheckoutSession(formId:string,userId:string,data:{amount:number;currency?:string;successUrl:string;cancelUrl:string}){
    if(!stripe)throw ApiError.badRequest("Stripe not configured");
    const form=await prisma.form.findFirst({where:{id:formId,userId}});
    if(!form)throw ApiError.notFound("Form");
    const user=await prisma.user.findUnique({where:{id:userId}});
    if(!user)throw ApiError.notFound("User");
    let customerId=user.stripeCustomerId;
    if(!customerId){
      const customer=await stripe.customers.create({email:user.email});
      await prisma.user.update({where:{id:userId},{data:{stripeCustomerId:customer.id}}});
      customerId=customer.id;
    }
    const session=await stripe.checkout.sessions.create({customer:customerId,mode:"payment",line_items:[{price_data:{currency:data.currency||"usd",product_data:{name:form.name+" Payment"},unit_amount:data.amount},quantity:1}],success_url:data.successUrl,cancel_url:data.cancelUrl,metadata:{formId,userId}});
    return{url:session.url,sessionId:session.id};
  }
  async handleWebhook(payload:string,sig:string){
    if(!stripe||!env.stripeWebhookSecret)throw ApiError.badRequest("Stripe not configured");
    const event=stripe.webhooks.constructEvent(payload,sig,env.stripeWebhookSecret);
    if(event.type==="checkout.session.completed"){
      const s=event.data.object as any;
      await prisma.payment.create({data:{formId:s.metadata.formId,amount:s.amount_total,currency:s.currency,status:"COMPLETED",gateway:"stripe",gatewayPaymentId:s.payment_intent}});
    }
    return event;
  }
}
export const paymentService=new PaymentService();
