-- 406 오류 빠른 해결 스크립트
-- Supabase Dashboard → SQL Editor에서 실행하세요

-- 1. 모든 RLS 정책 제거
DROP POLICY IF EXISTS "Users can view own customer data" ON customer;
DROP POLICY IF EXISTS "Users can insert own customer data" ON customer;
DROP POLICY IF EXISTS "Users can update own customer data" ON customer;
DROP POLICY IF EXISTS "Users can delete own customer data" ON customer;
DROP POLICY IF EXISTS "Allow all operations for now" ON customer;
DROP POLICY IF EXISTS "Enable read access for all users" ON customer;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON customer;
DROP POLICY IF EXISTS "Enable update for users based on email" ON customer;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON customer;

-- 2. RLS 완전 비활성화
ALTER TABLE customer DISABLE ROW LEVEL SECURITY;

-- 3. 테이블 권한 설정
GRANT ALL ON customer TO authenticated;
GRANT ALL ON customer TO anon;

-- 4. 확인
SELECT 'RLS 비활성화 완료' as status; 