-- 406 오류 완전 해결 스크립트
-- Supabase SQL Editor에서 실행하세요

-- 1단계: 기존 RLS 정책 모두 제거
DROP POLICY IF EXISTS "Users can view own customer data" ON customer;
DROP POLICY IF EXISTS "Users can insert own customer data" ON customer;
DROP POLICY IF EXISTS "Users can update own customer data" ON customer;
DROP POLICY IF EXISTS "Users can delete own customer data" ON customer;
DROP POLICY IF EXISTS "Allow all operations for now" ON customer;
DROP POLICY IF EXISTS "Enable read access for all users" ON customer;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON customer;
DROP POLICY IF EXISTS "Enable update for users based on email" ON customer;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON customer;

-- 2단계: RLS 완전 비활성화
ALTER TABLE customer DISABLE ROW LEVEL SECURITY;

-- 3단계: 테이블 구조 확인 및 수정
-- 필요한 컬럼들이 있는지 확인하고 없다면 추가
ALTER TABLE customer ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE customer ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE customer ADD COLUMN IF NOT EXISTS addr TEXT;
ALTER TABLE customer ADD COLUMN IF NOT EXISTS postcode TEXT;
ALTER TABLE customer ADD COLUMN IF NOT EXISTS detail_address TEXT;
ALTER TABLE customer ADD COLUMN IF NOT EXISTS password TEXT;

-- 4단계: 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_customer_email ON customer(email);
CREATE INDEX IF NOT EXISTS idx_customer_user_id ON customer(user_id);

-- 5단계: 테이블 권한 확인
GRANT ALL ON customer TO authenticated;
GRANT ALL ON customer TO anon;

-- 6단계: 최종 테이블 상태 확인
SELECT 
    'customer 테이블 최종 상태' as check_type,
    COUNT(*) as total_records,
    COUNT(DISTINCT email) as unique_emails
FROM customer;

-- 7단계: RLS 정책 상태 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'customer';

-- 8단계: 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'customer' 
ORDER BY ordinal_position;

-- 9단계: 테스트 데이터 삽입 (선택사항)
-- INSERT INTO customer (email, name, phone, addr) 
-- VALUES ('test@example.com', 'Test User', '010-1234-5678', 'Test Address')
-- ON CONFLICT (email) DO NOTHING; 