-- =====================================================================
-- Phase 4: CV image annotations (bbox / polygon / point)
-- =====================================================================

create table image_annotations (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references datasets(id) on delete cascade,
  image_path text not null,                       -- relative path within dataset folder
  shape_type text not null check (shape_type in ('bbox', 'polygon', 'point')),
  -- bbox:    [x, y, w, h]  (pixel coords, top-left origin)
  -- polygon: [[x1,y1], [x2,y2], ...] (≥3 points)
  -- point:   [x, y]
  coordinates jsonb not null,
  label text not null,
  color text,                                     -- hex like '#ff0000', optional
  created_by uuid references profiles(id),
  is_ground_truth boolean not null default false, -- true = teacher GT, false = student prediction
  created_at timestamptz default now()
);

create index idx_annotations_dataset_image on image_annotations(dataset_id, image_path);
create index idx_annotations_created_by on image_annotations(created_by);
create index idx_annotations_ground_truth on image_annotations(dataset_id, image_path)
  where is_ground_truth = true;

alter table image_annotations enable row level security;

-- SELECT: dataset owner, teacher of any course using the dataset, dataset is_public,
-- or dataset attached to a published assignment (transitive student access)
create policy "annotations_select" on image_annotations
  for select using (
    exists (
      select 1 from datasets d
      where d.id = image_annotations.dataset_id
        and (
          d.owner_id = auth.uid()
          or d.is_public
          or exists (
            select 1 from assignment_datasets ad
            join assignments a on a.id = ad.assignment_id
            where ad.dataset_id = d.id and a.is_published
          )
          or is_admin()
        )
    )
  );

-- INSERT/UPDATE/DELETE:
--  - teacher of any course where this dataset is attached (for ground truth)
--  - dataset owner
--  - student submissions: insert own (non-ground-truth) for their own grading
create policy "annotations_modify" on image_annotations
  for all to authenticated using (
    created_by = auth.uid()
    or exists (select 1 from datasets d where d.id = image_annotations.dataset_id and d.owner_id = auth.uid())
    or is_admin()
  ) with check (
    created_by = auth.uid()
    or exists (select 1 from datasets d where d.id = image_annotations.dataset_id and d.owner_id = auth.uid())
    or is_admin()
  );
