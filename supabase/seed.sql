-- =====================================================================
-- Seed data — demo course "ML Cơ bản"
-- Run after db reset for development.
-- =====================================================================

-- NOTE: create a teacher user first via Supabase Studio, then update teacher_id below.
-- Or seed from app once auth.users is populated.

-- Example: assumes teacher uuid is '00000000-0000-0000-0000-000000000001'
do $$
declare
  teacher_uuid uuid := '00000000-0000-0000-0000-000000000001';
  course_uuid uuid;
  lesson_uuid uuid;
begin
  -- Skip seed if user doesn't exist
  if not exists (select 1 from auth.users where id = teacher_uuid) then
    raise notice 'Skipping seed: teacher user % does not exist yet.', teacher_uuid;
    return;
  end if;

  insert into courses (slug, title, description, category, difficulty, teacher_id, is_published, estimated_hours)
  values (
    'ml-co-ban',
    'ML Cơ bản',
    'Khởi đầu với Machine Learning: regression, classification, đánh giá mô hình.',
    'ml', 1, teacher_uuid, true, 12
  ) returning id into course_uuid;

  insert into lessons (course_id, order_index, title, content_mdx, estimated_minutes)
  values (
    course_uuid, 1,
    'Hello Machine Learning',
    '# Hello Machine Learning

Bài đầu tiên: bạn sẽ chạy mô hình **Linear Regression** đầu tiên với scikit-learn.

## Mục tiêu
- Hiểu workflow `fit` → `predict` → `evaluate`
- Quan sát MSE và R²

## Code mẫu
```python
from sklearn.linear_model import LinearRegression
import numpy as np

X = np.array([[1],[2],[3],[4],[5]])
y = np.array([2.1, 4.0, 6.1, 7.9, 10.2])

model = LinearRegression()
model.fit(X, y)
print(model.predict([[6]]))
```',
    20
  ) returning id into lesson_uuid;

  insert into assignments (
    course_id, lesson_id, title, description_mdx,
    starter_code, visible_tests, evaluation_type, max_score, is_published
  )
  values (
    course_uuid, lesson_uuid,
    'Bài tập 1: Dự đoán giá nhà đơn giản',
    'Hoàn thành hàm `predict_price(area)` trả về giá dự đoán bằng linear regression đã train.',
    'from sklearn.linear_model import LinearRegression
import numpy as np

def predict_price(area):
    # TODO: train and return prediction for given area
    pass',
    'def test_returns_number():
    result = predict_price(50)
    assert isinstance(result, (int, float))

def test_positive():
    assert predict_price(100) > 0',
    'unittest',
    100, true
  );

  raise notice 'Seeded course "ML Cơ bản" with 1 lesson and 1 assignment.';
end $$;
