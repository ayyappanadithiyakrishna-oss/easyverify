import {NextResponse} from 'next/server';
import {randomBytes,createHash} from 'node:crypto';
import {z} from 'zod';
import {serverClient} from '@/lib/server';
import {profileSchema,hireSchema,id,token} from '@/lib/validation';
import {evaluate,RULESET_VERSION} from '@/lib/engine';
import {rules} from '@/lib/rules';
import type {Hire,Profile} from '@/lib/types';
const actionSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('workspace'),name:z.string().trim().min(1).max(80)}),
 z.object({action:z.literal('business'),workspace_id:id,id:id.nullable(),profile:profileSchema,version:z.number().int().nonnegative()}),
 z.object({action:z.literal('hire'),business_id:id,hire:hireSchema}),
 z.object({action:z.literal('invite'),hire_id:id}),z.object({action:z.literal('revoke'),id}),
 z.object({action:z.literal('redeem'),token}),
 z.object({action:z.literal('confirm'),hire_id:id,requirement_id:z.string().max(80),completed:z.boolean(),version:z.number().int().positive()})
]);
export async function POST(request:Request){try{
 const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)return NextResponse.json({error:'Request origin rejected.'},{status:403});
 const raw=await request.text();if(raw.length>100000)return NextResponse.json({error:'Request too large.'},{status:413});
 const parsed=actionSchema.safeParse(JSON.parse(raw));if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||'Invalid input.'},{status:400});const input=parsed.data;
 const db=await serverClient();const {data:{user},error:authError}=await db.auth.getUser();if(authError||!user)return NextResponse.json({error:'Sign in to continue.'},{status:401});
 const rate=await db.rpc('consume_request');if(rate.error)return NextResponse.json({error:'Too many requests. Try again shortly.'},{status:429});
 let result;let inviteToken:string|undefined;
 if(input.action==='workspace')result=await db.rpc('create_workspace',{p_name:input.name});
 if(input.action==='business'){const {data:hires,error}=input.id?await db.from('hires').select('*').eq('business_id',input.id):{data:[],error:null};if(error)throw new Error('Could not load hires.');const snapshots=(hires||[]).map((h:Hire)=>({hire_id:h.id,requirements:evaluate(input.profile,h,rules)}));result=await db.rpc('save_business',{p_id:input.id,p_workspace:input.workspace_id,p_profile:input.profile,p_expected:input.version,p_snapshots:snapshots,p_ruleset:RULESET_VERSION});}
 if(input.action==='hire'){const {data:b,error}=await db.from('businesses').select('*').eq('id',input.business_id).single();if(error||!b)throw new Error('Business access denied.');result=await db.rpc('add_hire',{p_business:input.business_id,p_hire:input.hire,p_requirements:evaluate(b.profile as Profile,input.hire,rules),p_ruleset:RULESET_VERSION});}
 if(input.action==='invite'){inviteToken=randomBytes(32).toString('hex');result=await db.rpc('create_invitation',{p_hire:input.hire_id,p_hash:createHash('sha256').update(inviteToken).digest('hex')});}
 if(input.action==='revoke')result=await db.rpc('revoke_invitation',{p_id:input.id});
 if(input.action==='redeem')result=await db.rpc('redeem_invitation',{p_hash:createHash('sha256').update(input.token).digest('hex')});
 if(input.action==='confirm'){const {data:h,error:he}=await db.from('hires').select('*').eq('id',input.hire_id).single();if(he||!h)throw new Error('Hire access denied.');const {data:b,error:be}=await db.from('businesses').select('*').eq('id',h.business_id).single();if(be||!b)throw new Error('Business access denied.');const current=evaluate(b.profile as Profile,h,rules).find(r=>r.id===input.requirement_id);if(!current||current.result!=='matched'||current.needsReview)throw new Error('This requirement needs review before completion can be recorded.');const {data:s,error}=await db.from('requirement_snapshots').select('ruleset_version').eq('hire_id',input.hire_id).eq('profile_version',input.version).single();if(error||s?.ruleset_version!==RULESET_VERSION)throw new Error('Requirements changed. Ask the employer to save the profile again.');result=await db.rpc('confirm_task',{p_hire:input.hire_id,p_requirement:input.requirement_id,p_completed:input.completed,p_version:input.version});}
 if(!result||result.error)throw new Error(result?.error?.message||'The change could not be saved.');return NextResponse.json({ok:true,id:result.data,inviteToken},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'The change could not be saved.'},{status:400});}}
