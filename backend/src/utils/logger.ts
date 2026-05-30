import fetch from "node-fetch";import{env}from"../config";import{prisma}from"../config/prisma";
/** Log user activity to ActivityLog collection for audit trail */
export async function logActivity(data:{userId?:string;action:string;entity?:string;entityId?:string;metadata?:any;ipAddress?:string;userAgent?:string}){
  try{await prisma.activityLog.create({data});}catch(e){console.error("ActivityLog error:",e);}
}
/** Send critical alert to Discord webhook with embed formatting */
export async function sendDiscordAlert(title:string,description:string,fields?:{name:string;value:string}[]){
  if(!env.discordWebhookUrl)return;
  try{await fetch(env.discordWebhookUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({embeds:[{title,description,fields,color:0xff0000,timestamp:new Date().toISOString()}]})});}catch{}
}
/** Send alert to external webhook (PagerDuty, Slack, etc.) for security events */
export async function sendAlertWebhook(payload:any){
  if(!env.alertWebhookUrl)return;
  try{await fetch(env.alertWebhookUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});}catch{}
}
/** Log activity AND send alerts for critical security events */
export async function logAndAlert(activityData:Parameters<typeof logActivity>[0],severity:"warning"|"critical",alertTitle:string,alertDesc:string){
  await logActivity(activityData);
  if(severity==="critical")await sendDiscordAlert(alertTitle,alertDesc);
  await sendAlertWebhook({severity,title:alertTitle,description:alertDesc,...activityData,timestamp:new Date().toISOString()});
}
