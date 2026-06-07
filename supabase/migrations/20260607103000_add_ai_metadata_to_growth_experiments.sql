alter table public.growth_experiments
  add column if not exists ai_provider text,
  add column if not exists ai_model text;
