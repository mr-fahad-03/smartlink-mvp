-- Seed expert applications from current experts table
insert into expert_applications (expert_id, status, review_notes)
select e.expert_id,
  case
    when e.is_verified then 'approved'
    else 'under_review'
  end as status,
  'Seeded from experts table'
from experts e
on conflict (expert_id) do nothing;
