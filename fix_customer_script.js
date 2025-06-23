const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://wqetnltlnsvjidubewia.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZXRubHRsbnN2amlkdWJld2lhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjc3Mjk0OSwiZXhwIjoyMDU4MzQ4OTQ5fQ.8ibNfBcS3zEei7hx5nL5CD7EI3Iwc9fFXoisabifcUQ';

// 서비스 롤 키로 클라이언트 생성 (RLS 우회 가능)
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCustomerTable() {
    try {
        console.log('Customer 테이블 수정 시작...');

        // 1. 현재 customer 테이블 구조 확인
        console.log('\n1. 현재 customer 테이블 구조 확인...');
        const { data: columns, error: columnsError } = await supabase
            .rpc('get_table_columns', { table_name: 'customer' });
        
        if (columnsError) {
            console.log('테이블 구조 확인 중 오류:', columnsError);
        } else {
            console.log('현재 컬럼:', columns);
        }

        // 2. customer 테이블이 존재하지 않으면 생성
        console.log('\n2. customer 테이블 생성 확인...');
        const { error: createError } = await supabase
            .rpc('create_customer_table_if_not_exists');
        
        if (createError) {
            console.log('테이블 생성 오류:', createError);
        } else {
            console.log('테이블 생성 완료');
        }

        // 3. 누락된 컬럼들 추가
        console.log('\n3. 누락된 컬럼들 추가...');
        const { error: alterError } = await supabase
            .rpc('add_missing_columns');
        
        if (alterError) {
            console.log('컬럼 추가 오류:', alterError);
        } else {
            console.log('컬럼 추가 완료');
        }

        // 4. RLS 활성화
        console.log('\n4. RLS 활성화...');
        const { error: rlsError } = await supabase
            .rpc('enable_rls_on_customer');
        
        if (rlsError) {
            console.log('RLS 활성화 오류:', rlsError);
        } else {
            console.log('RLS 활성화 완료');
        }

        // 5. 기존 정책 삭제
        console.log('\n5. 기존 정책 삭제...');
        const { error: dropError } = await supabase
            .rpc('drop_existing_policies');
        
        if (dropError) {
            console.log('정책 삭제 오류:', dropError);
        } else {
            console.log('정책 삭제 완료');
        }

        // 6. 새로운 RLS 정책 설정
        console.log('\n6. 새로운 RLS 정책 설정...');
        const { error: policyError } = await supabase
            .rpc('create_customer_policies');
        
        if (policyError) {
            console.log('정책 생성 오류:', policyError);
        } else {
            console.log('정책 생성 완료');
        }

        // 7. 인덱스 생성
        console.log('\n7. 인덱스 생성...');
        const { error: indexError } = await supabase
            .rpc('create_customer_indexes');
        
        if (indexError) {
            console.log('인덱스 생성 오류:', indexError);
        } else {
            console.log('인덱스 생성 완료');
        }

        // 8. 최종 확인
        console.log('\n8. 최종 확인...');
        const { data: finalCheck, error: finalError } = await supabase
            .from('customer')
            .select('*')
            .limit(1);
        
        if (finalError) {
            console.log('최종 확인 오류:', finalError);
        } else {
            console.log('Customer 테이블 접근 성공!');
        }

        console.log('\n✅ Customer 테이블 수정 완료!');

    } catch (error) {
        console.error('❌ 오류 발생:', error);
    }
}

// 스크립트 실행
fixCustomerTable(); 