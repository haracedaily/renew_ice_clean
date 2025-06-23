const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://wqetnltlnsvjidubewia.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZXRubHRsbnN2amlkdWJld2lhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjc3Mjk0OSwiZXhwIjoyMDU4MzQ4OTQ5fQ.8ibNfBcS3zEei7hx5nL5CD7EI3Iwc9fFXoisabifcUQ';

// 서비스 롤 키로 클라이언트 생성 (RLS 우회 가능)
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCustomerTable() {
    try {
        console.log('Customer 테이블 수정 시작...');

        // 1. 현재 customer 테이블 데이터 확인
        console.log('\n1. 현재 customer 테이블 데이터 확인...');
        const { data: customers, error: selectError } = await supabase
            .from('customer')
            .select('*');
        
        if (selectError) {
            console.log('Customer 테이블 접근 오류:', selectError);
        } else {
            console.log(`현재 customer 테이블에 ${customers.length}개의 레코드가 있습니다.`);
            if (customers.length > 0) {
                console.log('첫 번째 레코드:', customers[0]);
            }
        }

        // 2. 테스트 데이터 삽입
        console.log('\n2. 테스트 데이터 삽입...');
        const testData = {
            user_id: '00000000-0000-0000-0000-000000000000', // 테스트용 UUID
            email: 'test@example.com',
            name: '테스트 사용자',
            tel: '010-1234-5678',
            postcode: '12345',
            address: '테스트 주소',
            detail_address: '테스트 상세주소'
        };

        const { data: insertData, error: insertError } = await supabase
            .from('customer')
            .insert([testData])
            .select();

        if (insertError) {
            console.log('테스트 데이터 삽입 오류:', insertError);
        } else {
            console.log('테스트 데이터 삽입 성공:', insertData);
        }

        // 3. 테스트 데이터 삭제
        console.log('\n3. 테스트 데이터 삭제...');
        const { error: deleteError } = await supabase
            .from('customer')
            .delete()
            .eq('email', 'test@example.com');

        if (deleteError) {
            console.log('테스트 데이터 삭제 오류:', deleteError);
        } else {
            console.log('테스트 데이터 삭제 완료');
        }

        // 4. RLS 정책 확인
        console.log('\n4. RLS 정책 확인...');
        const { data: policies, error: policyError } = await supabase
            .from('pg_policies')
            .select('*')
            .eq('tablename', 'customer');

        if (policyError) {
            console.log('정책 확인 오류:', policyError);
        } else {
            console.log('현재 RLS 정책:', policies);
        }

        console.log('\n✅ Customer 테이블 테스트 완료!');
        console.log('이제 회원가입을 테스트해보세요.');

    } catch (error) {
        console.error('❌ 오류 발생:', error);
    }
}

// 스크립트 실행
fixCustomerTable(); 