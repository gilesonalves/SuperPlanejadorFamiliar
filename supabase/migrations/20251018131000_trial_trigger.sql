-- Desabilita o gatilho antigo (se existir)
drop trigger if exists trg_give_trial_on_signup on auth.users;

-- Recria a função de TRIGGER corretamente
create or replace function public.give_trial_on_signup()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Em triggers de auth.users, use SEMPRE NEW.id (UUID do usuário recém-criado)
  perform public.ensure_trial(NEW.id, 15);
  return NEW;
end;
$$;

-- Recria o gatilho AFTER INSERT
create trigger trg_give_trial_on_signup
after insert on auth.users
for each row execute function public.give_trial_on_signup();
