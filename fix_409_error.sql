-- 409 오류 해결 스크립트 (중복 이메일 및 UNIQUE 제약조건 관리)
-- Supabase SQL Editor에서 실행하세요

-- 1단계: 중복 이메일 확인
SELECT 
    email,
    COUNT(*) as duplicate_count,
    array_agg(id) as duplicate_ids
FROM customer 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 2단계: 중복 이메일 정리 (가장 최근 데이터만 유지)
WITH duplicates AS (
    SELECT 
        email,
        id,
        created_at,
        ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM customer
    WHERE email IN (
        SELECT email 
        FROM customer 
        GROUP BY email 
        HAVING COUNT(*) > 1
    )
)
DELETE FROM customer 
WHERE id IN (
    SELECT id 
    FROM duplicates 
    WHERE rn > 1
);

-- 3단계: UNIQUE 제약조건 확인
SELECT 
    constraint_name,
    constraint_type,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'customer' 
    AND tc.constraint_type = 'UNIQUE';

-- 4단계: email 컬럼에 UNIQUE 제약조건 추가 (없다면)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'customer' 
        AND constraint_name LIKE '%email%'
        AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE customer ADD CONSTRAINT customer_email_unique UNIQUE (email);
        RAISE NOTICE 'email 컬럼에 UNIQUE 제약조건이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'email 컬럼에 이미 UNIQUE 제약조건이 존재합니다.';
    END IF;
END $$;

-- 5단계: RLS 정책 확인 및 수정
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'customer';

-- 6단계: 임시 RLS 정책 생성 (모든 작업 허용)
DROP POLICY IF EXISTS "Allow all operations for now" ON customer;
CREATE POLICY "Allow all operations for now" ON customer
    FOR ALL USING (true) WITH CHECK (true);

-- 7단계: 최종 테이블 상태 확인
SELECT 
    'customer 테이블 최종 상태' as check_type,
    COUNT(*) as total_records,
    COUNT(DISTINCT email) as unique_emails,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT email) THEN '중복 없음'
        ELSE '중복 있음'
    END as duplicate_status
FROM customer;

-- 8단계: 테스트 데이터 삽입 (선택사항)
-- INSERT INTO customer (email, name, phone, addr) 
-- VALUES ('test@example.com', 'Test User', '010-1234-5678', 'Test Address')
-- ON CONFLICT (email) DO NOTHING; 