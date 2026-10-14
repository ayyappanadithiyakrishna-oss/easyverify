-- EasyVerify: tenant isolation, transactional mutations, and one-use invitations.
create schema if not exists app_private;
revoke all on schema app_private from public, anon;
create table public.workspaces (id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 80), created_at timestamptz not null default now());
create table public.memberships (workspace_id uuid references public.workspaces on delete cascade, user_id uuid references auth.users on delete cascade, role text not null default 'employer' check(role='employer'), primary key(workspace_id,user_id));
create table public.businesses (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces on delete cascade, profile jsonb not null, version integer not null default 1, created_at timestamptz not null default now());
create table public.hires (id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses on delete cascade, workspace_id uuid not null references public.workspaces on delete cascade, name text not null check(length(name) between 1 and 80), email text not null check(length(email)<=254 and position('@' in email)>1), hire_date date not null, termination_date date, short_job boolean not null default false, offer_accepted boolean not null check(offer_accepted), user_id uuid references auth.users on delete set null, check(termination_date is null or termination_date>=hire_date));
create table public.invitations (id uuid primary key default gen_random_uuid(), hire_id uuid not null references public.hires on delete cascade, workspace_id uuid not null references public.workspaces on delete cascade, token_hash text not null unique check(token_hash ~ '^[a-f0-9]{64}$'), expires_at timestamptz not null default now()+interval '7 days', revoked_at timestamptz, redeemed_at timestamptz);
create table public.requirement_snapshots (hire_id uuid not null references public.hires on delete cascade, profile_version integer not null, ruleset_version text not null, requirements jsonb not null, created_at timestamptz not null default now(), primary key(hire_id,profile_version));
create table public.task_confirmations (hire_id uuid not null references public.hires on delete cascade, requirement_id text not null, completed boolean not null, profile_version integer not null, actor_id uuid not null references auth.users, updated_at timestamptz not null default now(), primary key(hire_id,requirement_id,profile_version));
create table public.activity_events (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces on delete cascade, business_id uuid references public.businesses on delete cascade, hire_id uuid references public.hires on delete cascade, actor_id uuid not null references auth.users, description text not null, created_at timestamptz not null default now());
create table public.rule_versions (version text primary key, sources jsonb not null, created_at timestamptz not null default now());
create table app_private.request_limits (user_id uuid not null, bucket timestamptz not null, count integer not null, primary key(user_id,bucket));
create index memberships_user on public.memberships(user_id);
create index business_workspace on public.businesses(workspace_id);
create index hire_business on public.hires(business_id);
create index hire_user on public.hires(user_id);
create index invite_hire on public.invitations(hire_id);
create index event_workspace on public.activity_events(workspace_id,created_at desc);

-- These helpers have fixed search paths and no caller-supplied user identity.
create function app_private.employer(wid uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.memberships where workspace_id=wid and user_id=(select auth.uid())); $$;
create function app_private.assigned(hid uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.hires where id=hid and user_id=(select auth.uid())); $$;
create function app_private.workspace_visible(wid uuid) returns boolean language sql stable security definer set search_path='' as $$ select app_private.employer(wid) or exists(select 1 from public.hires where workspace_id=wid and user_id=(select auth.uid())); $$;
create function app_private.hire_visible(hid uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.hires where id=hid and (user_id=(select auth.uid()) or app_private.employer(workspace_id))); $$;
revoke all on all functions in schema app_private from public,anon;
grant usage on schema app_private to authenticated;
grant execute on all functions in schema app_private to authenticated;

alter table public.workspaces enable row level security;
alter table public.memberships enable row level security;
alter table public.businesses enable row level security;
alter table public.hires enable row level security;
alter table public.invitations enable row level security;
alter table public.requirement_snapshots enable row level security;
alter table public.task_confirmations enable row level security;
alter table public.activity_events enable row level security;
alter table public.rule_versions enable row level security;
alter table app_private.request_limits enable row level security;
create policy workspace_read on public.workspaces for select to authenticated using(app_private.workspace_visible(id));
create policy membership_read on public.memberships for select to authenticated using(user_id=(select auth.uid()));
create policy business_read on public.businesses for select to authenticated using(app_private.employer(workspace_id) or exists(select 1 from public.hires where business_id=businesses.id and user_id=(select auth.uid())));
create policy hire_read on public.hires for select to authenticated using(user_id=(select auth.uid()) or app_private.employer(workspace_id));
create policy invite_read on public.invitations for select to authenticated using(app_private.employer(workspace_id));
create policy snapshot_read on public.requirement_snapshots for select to authenticated using(app_private.hire_visible(hire_id));
create policy confirmation_read on public.task_confirmations for select to authenticated using(app_private.hire_visible(hire_id));
create policy event_read on public.activity_events for select to authenticated using(app_private.employer(workspace_id) or app_private.assigned(hire_id));
create policy rules_read on public.rule_versions for select to authenticated using(true);
revoke all on all tables in schema public from anon,authenticated;
grant select on public.workspaces,public.memberships,public.businesses,public.hires,public.invitations,public.requirement_snapshots,public.task_confirmations,public.activity_events,public.rule_versions to authenticated;

create function public.consume_request() returns void language plpgsql security definer set search_path='' as $$
declare n integer; b timestamptz:=date_trunc('hour',now())+floor(extract(minute from now())/10)*interval '10 minutes';
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 insert into app_private.request_limits values(auth.uid(),b,1) on conflict(user_id,bucket) do update set count=request_limits.count+1 returning count into n;
 if n>60 then raise exception 'Too many requests. Try again shortly.'; end if;
 delete from app_private.request_limits where bucket<now()-interval '1 day';
end; $$;
create function app_private.valid_profile(p jsonb) returns boolean language sql immutable set search_path='' as $$
 select jsonb_typeof(p)='object' and length(p->>'name') between 1 and 80 and (p->>'headcount')::numeric between 1 and 1000000 and (p->>'headcount')::numeric=trunc((p->>'headcount')::numeric) and length(p->>'state')=2 and p->>'far' in ('yes','no','unknown') and p->>'participation' in ('yes','no','unknown') and p->>'contractor' in ('none','prime','subcontractor','unknown') and p->>'calendar' in ('weekdays','sixDays','everyDay') and jsonb_typeof(p->'closures')='array' and jsonb_array_length(p->'closures')<=50;
$$;
create function public.create_workspace(p_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare wid uuid;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if exists(select 1 from public.memberships where user_id=auth.uid()) then raise exception 'Workspace already exists'; end if;
 insert into public.workspaces(name) values(p_name) returning id into wid;
 insert into public.memberships values(wid,auth.uid(),'employer');
 insert into public.activity_events(workspace_id,actor_id,description) values(wid,auth.uid(),'Workspace created');
 return wid;
end; $$;
create function public.save_business(p_id uuid,p_workspace uuid,p_profile jsonb,p_expected integer,p_snapshots jsonb,p_ruleset text) returns uuid language plpgsql security definer set search_path='' as $$
declare bid uuid; ver integer; item jsonb;
begin
 if auth.uid() is null or not app_private.employer(p_workspace) then raise exception 'Workspace access denied'; end if;
 if not coalesce(app_private.valid_profile(p_profile),false) then raise exception 'Invalid business profile'; end if;
 if p_id is null then insert into public.businesses(workspace_id,profile) values(p_workspace,p_profile) returning id,version into bid,ver;
 else
  update public.businesses set profile=p_profile,version=version+1 where id=p_id and workspace_id=p_workspace and version=p_expected returning id,version into bid,ver;
  if bid is null then raise exception 'Profile changed. Reload and try again.'; end if;
  for item in select value from jsonb_array_elements(p_snapshots) loop
   if not exists(select 1 from public.hires where id=(item->>'hire_id')::uuid and business_id=bid) then raise exception 'Invalid hire snapshot'; end if;
   insert into public.requirement_snapshots values((item->>'hire_id')::uuid,ver,p_ruleset,item->'requirements',now());
  end loop;
  if (select count(*) from public.hires where business_id=bid)<>jsonb_array_length(p_snapshots) then raise exception 'Snapshot count mismatch'; end if;
 end if;
 insert into public.activity_events(workspace_id,business_id,actor_id,description) values(p_workspace,bid,auth.uid(),case when p_id is null then 'Business profile created' else 'Profile updated; previous confirmations retained as history' end);
 return bid;
end; $$;
create function public.add_hire(p_business uuid,p_hire jsonb,p_requirements jsonb,p_ruleset text) returns uuid language plpgsql security definer set search_path='' as $$
declare b public.businesses; hid uuid;
begin
 select * into b from public.businesses where id=p_business for update;
 if b.id is null or auth.uid() is null or not app_private.employer(b.workspace_id) then raise exception 'Business access denied'; end if;
 if p_hire->>'offer_accepted'<>'true' then raise exception 'Offer acceptance is required'; end if;
 insert into public.hires(business_id,workspace_id,name,email,hire_date,termination_date,short_job,offer_accepted) values(b.id,b.workspace_id,p_hire->>'name',lower(p_hire->>'email'),(p_hire->>'hire_date')::date,(p_hire->>'termination_date')::date,(p_hire->>'short_job')::boolean,true) returning id into hid;
 insert into public.requirement_snapshots values(hid,b.version,p_ruleset,p_requirements,now());
 insert into public.activity_events(workspace_id,business_id,hire_id,actor_id,description) values(b.workspace_id,b.id,hid,auth.uid(),'New hire added after offer acceptance');
 return hid;
end; $$;
create function public.create_invitation(p_hire uuid,p_hash text) returns uuid language plpgsql security definer set search_path='' as $$
declare h public.hires; iid uuid;
begin
 select * into h from public.hires where id=p_hire for update;
 if h.id is null or auth.uid() is null or not app_private.employer(h.workspace_id) then raise exception 'Hire access denied'; end if;
 if h.user_id is not null then raise exception 'This hire has already joined'; end if;
 update public.invitations set revoked_at=now() where hire_id=h.id and redeemed_at is null and revoked_at is null;
 insert into public.invitations(hire_id,workspace_id,token_hash) values(h.id,h.workspace_id,p_hash) returning id into iid;
 insert into public.activity_events(workspace_id,business_id,hire_id,actor_id,description) values(h.workspace_id,h.business_id,h.id,auth.uid(),'Invitation created; expires in seven days');
 return iid;
end; $$;
create function public.revoke_invitation(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare i public.invitations;
begin
 select * into i from public.invitations where id=p_id for update;
 if i.id is null or auth.uid() is null or not app_private.employer(i.workspace_id) then raise exception 'Invitation access denied'; end if;
 update public.invitations set revoked_at=now() where id=p_id;
 insert into public.activity_events(workspace_id,hire_id,actor_id,description) values(i.workspace_id,i.hire_id,auth.uid(),'Invitation revoked');
end; $$;
create function public.redeem_invitation(p_hash text) returns uuid language plpgsql security definer set search_path='' as $$
declare i public.invitations; h public.hires; mail text;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 select lower(email) into mail from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if mail is null then raise exception 'Verify your email first'; end if;
 select * into i from public.invitations where token_hash=p_hash for update;
 if i.id is null or i.expires_at<=now() or i.revoked_at is not null or i.redeemed_at is not null then raise exception 'This invitation is expired, revoked, or already used'; end if;
 select * into h from public.hires where id=i.hire_id for update;
 if h.email<>mail or h.user_id is not null then raise exception 'This invitation is not available for this account'; end if;
 update public.hires set user_id=auth.uid() where id=h.id;
 update public.invitations set redeemed_at=now() where id=i.id;
 insert into public.activity_events(workspace_id,business_id,hire_id,actor_id,description) values(h.workspace_id,h.business_id,h.id,auth.uid(),'New hire joined through invitation');
 return h.id;
end; $$;
create function public.confirm_task(p_hire uuid,p_requirement text,p_completed boolean,p_version integer) returns void language plpgsql security definer set search_path='' as $$
declare h public.hires; b public.businesses; r jsonb;
begin
 select * into h from public.hires where id=p_hire for update;
 if h.id is null or auth.uid() is null or not app_private.hire_visible(h.id) then raise exception 'Hire access denied'; end if;
 select * into b from public.businesses where id=h.business_id;
 if b.version<>p_version then raise exception 'Profile changed. Reload before confirming.'; end if;
 select item into r from public.requirement_snapshots s, jsonb_array_elements(s.requirements) item where s.hire_id=h.id and s.profile_version=b.version and item->>'id'=p_requirement;
 if r is null or r->>'result'<>'matched' or (r->>'needsReview')::boolean then raise exception 'This requirement cannot be confirmed'; end if;
 if not app_private.employer(h.workspace_id) and r->>'role'<>'hire' then raise exception 'Only the employer can confirm this step'; end if;
 insert into public.task_confirmations values(h.id,p_requirement,p_completed,b.version,auth.uid(),now()) on conflict(hire_id,requirement_id,profile_version) do update set completed=excluded.completed,actor_id=excluded.actor_id,updated_at=now();
 insert into public.activity_events(workspace_id,business_id,hire_id,actor_id,description) values(h.workspace_id,b.id,h.id,auth.uid(),case when p_completed then 'Completion reported: ' else 'Completion reopened: ' end||p_requirement);
end; $$;
-- Public RPCs are deliberately privileged for atomic operations; every operation
-- checks verified auth.uid(), tenant/recipient ownership, and fixed search_path.
revoke all on function public.consume_request(),public.create_workspace(text),public.save_business(uuid,uuid,jsonb,integer,jsonb,text),public.add_hire(uuid,jsonb,jsonb,text),public.create_invitation(uuid,text),public.revoke_invitation(uuid),public.redeem_invitation(text),public.confirm_task(uuid,text,boolean,integer) from public,anon;
grant execute on function public.consume_request(),public.create_workspace(text),public.save_business(uuid,uuid,jsonb,integer,jsonb,text),public.add_hire(uuid,jsonb,jsonb,text),public.create_invitation(uuid,text),public.revoke_invitation(uuid),public.redeem_invitation(text),public.confirm_task(uuid,text,boolean,integer) to authenticated;
revoke all on function app_private.valid_profile(jsonb) from public,anon,authenticated;
