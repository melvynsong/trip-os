begin;

update members
set
  tier = 'friend',
  is_active = true
where lower(trim(email)) = 'song.kg@gmail.com';

select id, email, tier, is_active
from members
where lower(trim(email)) = 'song.kg@gmail.com';

commit;
