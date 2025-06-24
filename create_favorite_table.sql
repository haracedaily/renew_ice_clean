-- 즐겨찾기 예약 테이블 생성
CREATE TABLE IF NOT EXISTS favorite_reservations (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    reservation_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_email, reservation_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_favorite_reservations_user_email ON favorite_reservations(user_email);
CREATE INDEX IF NOT EXISTS idx_favorite_reservations_reservation_id ON favorite_reservations(reservation_id);

-- RLS 정책 설정 (모든 사용자에게 읽기/쓰기 권한 부여)
ALTER TABLE favorite_reservations ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 즐겨찾기를 볼 수 있음 (실제로는 애플리케이션에서 필터링)
CREATE POLICY "Allow all users to view favorites" ON favorite_reservations
    FOR SELECT USING (true);

-- 모든 사용자가 즐겨찾기를 추가할 수 있음 (실제로는 애플리케이션에서 필터링)
CREATE POLICY "Allow all users to insert favorites" ON favorite_reservations
    FOR INSERT WITH CHECK (true);

-- 모든 사용자가 즐겨찾기를 삭제할 수 있음 (실제로는 애플리케이션에서 필터링)
CREATE POLICY "Allow all users to delete favorites" ON favorite_reservations
    FOR DELETE USING (true); 