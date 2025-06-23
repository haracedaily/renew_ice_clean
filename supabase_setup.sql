-- Supabase 마이페이지 설정 SQL 스크립트

-- 1. customer 테이블 생성 (회원가입 시 사용) - 패스워드 컬럼 제거
CREATE TABLE IF NOT EXISTS customer (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    tel TEXT,
    postcode TEXT,
    addr TEXT,
    address TEXT,
    detail_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. reservation 테이블 생성 (예약 정보 저장)
CREATE TABLE IF NOT EXISTS reservation (
    res_no SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    addr TEXT,
    model TEXT,
    remark TEXT,
    agree INTEGER DEFAULT 1,
    user_email TEXT NOT NULL,
    state INTEGER DEFAULT 0, -- 0: 대기, 1: 확정, 2: 완료, 3: 취소
    price TEXT DEFAULT '50000',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. customer 테이블 RLS (Row Level Security) 활성화
ALTER TABLE customer ENABLE ROW LEVEL SECURITY;

-- 4. reservation 테이블 RLS 활성화
ALTER TABLE reservation ENABLE ROW LEVEL SECURITY;

-- 5. customer 테이블 RLS 정책 설정
-- 사용자는 자신의 정보만 읽고 수정할 수 있음
CREATE POLICY "Users can view own customer data" ON customer
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customer data" ON customer
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customer data" ON customer
    FOR UPDATE USING (auth.uid() = user_id);

-- 6. reservation 테이블 RLS 정책 설정
-- 모든 사용자가 예약을 생성할 수 있음
CREATE POLICY "Anyone can insert reservations" ON reservation
    FOR INSERT WITH CHECK (true);

-- 모든 사용자가 예약을 조회할 수 있음 (이메일로 필터링)
CREATE POLICY "Anyone can view reservations" ON reservation
    FOR SELECT USING (true);

-- 모든 사용자가 예약을 수정할 수 있음 (이메일로 필터링)
CREATE POLICY "Anyone can update reservations" ON reservation
    FOR UPDATE USING (true);

-- 7. 사용자 프로필 테이블 생성 (기존 호환성을 위해 유지)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    tel TEXT,
    postcode TEXT,
    address TEXT,
    detail_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. RLS (Row Level Security) 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 9. RLS 정책 설정
-- 사용자는 자신의 프로필만 읽고 수정할 수 있음
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 10. 함수 생성 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. 트리거 생성
CREATE TRIGGER update_customer_updated_at
    BEFORE UPDATE ON customer
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservation_updated_at
    BEFORE UPDATE ON reservation
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 12. 기존 예약 테이블에 사용자 ID 컬럼 추가 (선택사항)
-- ALTER TABLE ice_res ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 13. 예약 테이블 RLS 정책 (선택사항)
-- ALTER TABLE ice_res ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own reservations" ON ice_res
--     FOR SELECT USING (auth.uid() = user_id);

-- 14. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_customer_email ON customer(email);
CREATE INDEX IF NOT EXISTS idx_customer_user_id ON customer(user_id);
CREATE INDEX IF NOT EXISTS idx_reservation_user_email ON reservation(user_email);
CREATE INDEX IF NOT EXISTS idx_reservation_date ON reservation(date);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 15. 뷰 생성 (고객 정보와 예약 정보 조인)
CREATE OR REPLACE VIEW customer_reservations_view AS
SELECT 
    c.id as customer_id,
    c.user_id,
    c.email,
    c.name,
    c.tel,
    c.postcode,
    c.address,
    c.detail_address,
    r.res_no as reservation_id,
    r.date,
    r.time,
    r.state,
    r.created_at as reservation_created_at
FROM customer c
LEFT JOIN reservation r ON c.email = r.user_email
ORDER BY r.date DESC, r.time DESC;

-- 16. 함수 생성 (고객 예약 통계)
CREATE OR REPLACE FUNCTION get_customer_reservation_stats(customer_email TEXT)
RETURNS TABLE(
    total_reservations BIGINT,
    pending_reservations BIGINT,
    completed_reservations BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_reservations,
        COUNT(*) FILTER (WHERE state = 0) as pending_reservations,
        COUNT(*) FILTER (WHERE state = 1) as completed_reservations
    FROM reservation
    WHERE user_email = customer_email;
END;
$$ LANGUAGE plpgsql; 