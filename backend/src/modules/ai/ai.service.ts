
import OpenAI from"openai";import{env}from"../../config";import{ApiError}from"../../utils/ApiError";
const openai=env.openaiApiKey?new OpenAI({apiKey:env.openaiApiKey}):null;
export class AiService{
  async generateForm(prompt:string){
    if(!openai)throw ApiError.badRequest("AI not configured");
    const c=await openai.chat.completions.create({model:"gpt-4o-mini",messages:[{role:"system",content:"Generate JSON form: {name,description,fields:[{name,label,type,required,placeholder,options?}]}. 3-8 fields."},{role:"user",content:prompt}],response_format:{type:"json_object"},max_tokens:2000});
    const content=c.choices[0]?.message?.content;if(!content)throw ApiError.internal("AI empty response");try{return JSON.parse(content);}catch{throw ApiError.internal("AI invalid JSON");}
  }
  async analyzeSubmissions(submissions:any[]){
    if(!openai)throw ApiError.badRequest("AI not configured");
    const c=await openai.chat.completions.create({model:"gpt-4o-mini",messages:[{role:"system",content:"Analyze submissions. Return JSON: {summary,suggestions:[],sentiment}"},{role:"user",content:JSON.stringify(submissions.slice(0,50).map(s=>s.data))}],response_format:{type:"json_object"}});
    return JSON.parse(c.choices[0]?.message?.content||"{}");
  }
}
export const aiService=new AiService();
