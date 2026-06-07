alter table public.growth_experiments
  drop column if exists ai_model,
  drop column if exists ai_provider;
