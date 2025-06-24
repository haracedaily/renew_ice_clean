-- 예약 테이블에 엔지니어 할당 컬럼 추가
ALTER TABLE reservation ADD COLUMN IF NOT EXISTS engineer_id TEXT;

-- 엔지니어 할당 컬럼에 대한 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_reservation_engineer_id ON reservation(engineer_id);

-- 엔지니어 할당 컬럼에 대한 RLS 정책 추가
CREATE POLICY "Engineers can view assigned reservations" ON reservation
    FOR SELECT USING (true);

-- 기존 예약 데이터에 대한 기본값 설정 (선택사항)
-- UPDATE reservation SET engineer_id = NULL WHERE engineer_id IS NULL; 