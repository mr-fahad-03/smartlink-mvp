-- SmartLink MVP backend schema bootstrap
-- Apply this in Supabase SQL Editor for project:
-- https://lyhyrpnzybqhxpjenjpx.supabase.co

create extension if not exists pgcrypto;

create table if not exists experts (
  expert_id text primary key,
  name text not null,
  role text,
  organization text,
  category_tags text[] not null default '{}',
  service_tags text[] not null default '{}',
  location text,
  remote_available boolean not null default true,
  budget_range jsonb not null default '{"min":0,"max":1000000}'::jsonb,
  availability_status text not null default 'within_48h',
  average_response_time integer not null default 48,
  rating numeric(2,1) not null default 4.5,
  review_count integer not null default 0,
  is_featured boolean not null default false,
  is_verified boolean not null default false,
  tier text not null default 'registered',
  matching_visibility text not null default 'visible',
  hourly_rate_usd numeric(10,2) not null default 150,
  years_experience integer not null default 5,
  next_available_at timestamptz default now(),
  profile_views_7d integer not null default 0,
  clicks_7d integer not null default 0,
  impressions_7d integer not null default 0,
  top3_shown_24h_count integer not null default 0,
  lead_acceptance_rate numeric(5,4) not null default 0,
  successful_connection_rate numeric(5,4) not null default 0,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  last_shown_timestamp timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists lead_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  work_email text not null,
  phone_number text,
  audience_segment text,
  company_name text,
  role text,
  business_type text,
  location text not null,
  location_scope text,
  island text,
  website text,
  team_size text,
  budget_preference text,
  urgency_preference text,
  prior_consulting_experience text,
  lead_tier text not null default 'standard',
  assessment_id text,
  normalized_score integer,
  highest_risk_category text,
  selected_category text,
  primary_issue text,
  preferred_support_type text,
  intent_type text,
  lead_quality_tag text,
  lead_price_usd numeric(10,2),
  pricing_band text,
  source text not null default 'web',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists ranking_config (
  id uuid primary key default gen_random_uuid(),
  is_active boolean not null default true,
  minimum_base_match_score integer not null default 70,
  featured_boost_value integer not null default 5,
  new_expert_boost_days integer not null default 14,
  new_expert_boost_value integer not null default 15,
  fairness_boost_max integer not null default 20,
  cooldown_threshold integer not null default 5,
  new_expert_boost_enabled boolean not null default true,
  exposure_boost_strength text not null default 'high',
  rotation_frequency text not null default 'balanced',
  number_of_experts_displayed integer not null default 5,
  weight_category integer not null default 30,
  weight_urgency integer not null default 20,
  weight_budget integer not null default 20,
  weight_reputation integer not null default 15,
  weight_location integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ranking_config
  add column if not exists new_expert_boost_enabled boolean not null default true;
alter table ranking_config
  add column if not exists exposure_boost_strength text not null default 'high';
alter table ranking_config
  add column if not exists rotation_frequency text not null default 'balanced';

create table if not exists introduction_requests (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references lead_submissions(id) on delete set null,
  assessment_id text,
  expert_id text not null references experts(expert_id) on delete cascade,
  expert_name text not null,
  lead_name text not null,
  lead_email text not null,
  lead_phone text,
  service_ids text[] not null default '{}',
  service_names text[] not null default '{}',
  category text,
  urgency_level text,
  budget_preference text,
  billable boolean not null default false,
  lead_tier text,
  expert_tier text,
  status text not null default 'submitted',
  created_at timestamptz not null default now()
);

create table if not exists review_tokens (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references lead_submissions(id) on delete set null,
  expert_id text references experts(expert_id) on delete cascade,
  introduction_request_id uuid references introduction_requests(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists private_match_feedback (
  feedback_id uuid primary key default gen_random_uuid(),
  lead_id uuid references lead_submissions(id) on delete cascade,
  assessment_id text,
  expert_id text references experts(expert_id) on delete set null,
  match_helpful_rating text,
  feedback_reason text[] not null default '{}',
  feedback_text text,
  created_at timestamptz not null default now()
);

create table if not exists expert_reviews (
  feedback_id uuid primary key default gen_random_uuid(),
  lead_id uuid references lead_submissions(id) on delete set null,
  expert_id text references experts(expert_id) on delete cascade,
  user_id text,
  match_helpful_rating text,
  feedback_reason text[] not null default '{}',
  public_star_rating numeric(2,1) check (public_star_rating >= 1 and public_star_rating <= 5),
  public_review_comment text,
  would_recommend boolean,
  expert_response_rating text,
  expert_response_comment text,
  is_suspicious boolean not null default false,
  suspicious_notes text,
  suspicious_flagged_by_user_id uuid,
  review_status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table expert_reviews
  add column if not exists is_suspicious boolean not null default false;
alter table expert_reviews
  add column if not exists suspicious_notes text;
alter table expert_reviews
  add column if not exists suspicious_flagged_by_user_id uuid;

create table if not exists expert_impression_events (
  id uuid primary key default gen_random_uuid(),
  expert_id text references experts(expert_id) on delete cascade,
  lead_id uuid references lead_submissions(id) on delete set null,
  match_request_id text,
  slot_label text,
  shown_at timestamptz not null default now()
);

create table if not exists expert_profile_optimizer_drafts (
  id uuid primary key default gen_random_uuid(),
  expert_id text not null references experts(expert_id) on delete cascade,
  suggested_headline text,
  suggested_service_description text,
  suggested_category_tags text[] not null default '{}',
  suggested_service_tags text[] not null default '{}',
  suggested_short_bio text,
  suggested_why_choose_me text,
  status text not null default 'draft',
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists platform_metrics_events (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists admin_user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role text not null check (role in ('super_admin', 'admin', 'moderator', 'auditor')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists admin_audit_logs (
  audit_id uuid primary key default gen_random_uuid(),
  user_id uuid,
  role text,
  action_type text not null,
  target_type text,
  target_id text,
  previous_value jsonb,
  new_value jsonb,
  timestamp timestamptz not null default now(),
  ip_address text,
  notes text
);

create or replace function prevent_admin_audit_logs_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'admin_audit_logs is immutable';
end;
$$;

drop trigger if exists trg_block_admin_audit_logs_update on admin_audit_logs;
create trigger trg_block_admin_audit_logs_update
before update on admin_audit_logs
for each row
execute function prevent_admin_audit_logs_mutation();

drop trigger if exists trg_block_admin_audit_logs_delete on admin_audit_logs;
create trigger trg_block_admin_audit_logs_delete
before delete on admin_audit_logs
for each row
execute function prevent_admin_audit_logs_mutation();

create table if not exists expert_applications (
  application_id uuid primary key default gen_random_uuid(),
  expert_id text not null references experts(expert_id) on delete cascade,
  status text not null default 'under_review' check (status in ('under_review', 'needs_info', 'approved', 'rejected', 'flagged')),
  submitted_by_user_id uuid,
  reviewed_by_user_id uuid,
  approved_by_user_id uuid,
  rejected_by_user_id uuid,
  recommendation text,
  requested_info_notes text,
  review_notes text,
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (expert_id)
);

create table if not exists lead_assignments (
  assignment_id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references lead_submissions(id) on delete cascade,
  expert_id text not null references experts(expert_id) on delete cascade,
  assigned_by_user_id uuid not null,
  assigned_by_role text not null,
  assignment_reason text not null,
  is_high_value_lead boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists platform_settings (
  id uuid primary key default gen_random_uuid(),
  is_active boolean not null default true,
  lead_price_low numeric(10,2) not null default 8,
  lead_price_medium numeric(10,2) not null default 20,
  lead_price_high numeric(10,2) not null default 45,
  pricing_band_low text not null default '$5-$10',
  pricing_band_medium text not null default '$15-$25',
  pricing_band_high text not null default '$30-$75',
  high_value_criteria jsonb not null default '{"requireUrgent":true,"requireBudget":true,"requireIntent":true,"budgetLevels":["medium","high"],"intentTypes":["do_it_for_me"]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table platform_settings
  add column if not exists high_value_criteria jsonb not null default '{"requireUrgent":true,"requireBudget":true,"requireIntent":true,"budgetLevels":["medium","high"],"intentTypes":["do_it_for_me"]}'::jsonb;

create table if not exists admin_match_overrides (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references lead_submissions(id) on delete cascade,
  assessment_id text,
  ordered_expert_ids text[] not null default '{}',
  allow_hidden_experts boolean not null default false,
  is_active boolean not null default true,
  created_by_user_id uuid,
  updated_by_user_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (lead_id is not null or (assessment_id is not null and assessment_id <> ''))
);

create table if not exists review_moderation_recommendations (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references expert_reviews(feedback_id) on delete cascade,
  moderator_user_id uuid not null,
  recommendation text not null check (recommendation in ('approve', 'reject')),
  notes text,
  status text not null default 'pending' check (status in ('pending', 'resolved')),
  resolved_by_user_id uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_experts_category_visibility
  on experts using gin (category_tags);

create index if not exists idx_experts_visibility
  on experts (matching_visibility);

create index if not exists idx_experts_impressions_top3
  on experts (impressions_7d, top3_shown_24h_count);

create index if not exists idx_review_tokens_hash_used_exp
  on review_tokens (token_hash, used_at, expires_at);

create index if not exists idx_leads_assessment
  on lead_submissions (assessment_id, created_at desc);

create index if not exists idx_intro_lead_expert
  on introduction_requests (lead_id, expert_id, created_at desc);

create index if not exists idx_private_feedback_expert
  on private_match_feedback (expert_id, created_at desc);

create index if not exists idx_reviews_expert_status
  on expert_reviews (expert_id, review_status, created_at desc);

create index if not exists idx_reviews_suspicious
  on expert_reviews (is_suspicious, review_status, created_at desc);

create index if not exists idx_metrics_name_time
  on platform_metrics_events (metric_name, created_at desc);

create index if not exists idx_admin_roles_user_active
  on admin_user_roles (user_id, is_active);

create index if not exists idx_admin_audit_time
  on admin_audit_logs (timestamp desc);

create index if not exists idx_expert_app_status
  on expert_applications (status, created_at desc);

create index if not exists idx_lead_assignments_lead_time
  on lead_assignments (lead_id, created_at desc);

create index if not exists idx_match_overrides_lead_active
  on admin_match_overrides (lead_id, assessment_id, is_active, updated_at desc);

create index if not exists idx_review_recommendations_status
  on review_moderation_recommendations (status, created_at desc);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum ('super_admin', 'admin', 'moderator', 'auditor', 'expert', 'client');
  end if;
end $$;

create table if not exists user_profiles (
  user_id uuid primary key,
  email text not null unique,
  role app_role not null default 'client',
  full_name text,
  status text not null default 'active',
  email_verified boolean not null default false,
  mfa_preferred_method text not null default 'email_otp',
  mfa_required_override boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists expert_user_links (
  id uuid primary key default gen_random_uuid(),
  expert_id text not null references experts(expert_id) on delete cascade,
  user_id uuid not null,
  status text not null default 'linked',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (expert_id),
  unique (user_id)
);

create table if not exists auth_login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid,
  role text,
  ip_address text,
  user_agent text,
  success boolean not null default false,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists auth_security_state (
  user_id uuid primary key,
  failed_count integer not null default 0,
  suspicious_score integer not null default 0,
  lock_until timestamptz,
  captcha_required_until timestamptz,
  mfa_pending boolean not null default false,
  mfa_verified_at timestamptz,
  preferred_mfa_method text,
  last_success_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists password_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists mfa_totp_factors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  secret_encrypted text not null,
  secret_hint text,
  is_active boolean not null default true,
  is_verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists auth_login_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role text not null,
  email text not null,
  token_hash text not null unique,
  encrypted_payload text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists mfa_email_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text not null,
  login_ticket_hash text not null,
  code_hash text not null,
  attempt_count integer not null default 0,
  max_attempts integer not null default 5,
  delivery_state text not null default 'queued',
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role text not null,
  refresh_token_hash text not null unique,
  mfa_verified boolean not null default false,
  session_source text not null default 'password',
  idle_timeout_minutes integer not null default 20,
  last_activity_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_profiles_role_status
  on user_profiles (role, status);

create index if not exists idx_auth_login_attempts_email_created
  on auth_login_attempts (email, created_at desc);

create index if not exists idx_auth_login_attempts_user_created
  on auth_login_attempts (user_id, created_at desc);

create index if not exists idx_password_history_user_created
  on password_history (user_id, created_at desc);

create index if not exists idx_user_sessions_user_active
  on user_sessions (user_id, revoked_at, expires_at);

create index if not exists idx_mfa_email_challenge_ticket
  on mfa_email_challenges (login_ticket_hash, created_at desc);
