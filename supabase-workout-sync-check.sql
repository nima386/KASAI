-- Optional verification for the current KASAI training sync schema.
-- The app now writes daily workout data to public.training_sessions.

select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'training_sessions'
order by ordinal_position;

select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'training_sessions';
