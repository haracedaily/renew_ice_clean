-- 강제 팝업 테이블 생성
CREATE TABLE IF NOT EXISTS forced_popups (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    image_url TEXT,
    link_url TEXT,
    button_text VARCHAR(100) DEFAULT '확인',
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE forced_popups ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 활성 팝업을 읽을 수 있도록 정책 설정
CREATE POLICY "Allow public read access to active forced popups" ON forced_popups
    FOR SELECT USING (is_active = true);

-- 관리자만 팝업을 생성/수정/삭제할 수 있도록 정책 설정 (필요시)
-- CREATE POLICY "Allow admin access to forced popups" ON forced_popups
--     FOR ALL USING (auth.role() = 'authenticated');

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO forced_popups (title, content, image_url, link_url, button_text, is_active, start_date, end_date) 
VALUES (
    '아이스케어 서비스 안내',
    '안전하고 깨끗한 제빙기 청소 서비스를 제공합니다.<br>전문 기술로 고객님의 제빙기를 완벽하게 관리해드립니다.',
    'https://via.placeholder.com/400x300/0066CC/FFFFFF?text=ICECARE+Service',
    'https://example.com',
    '서비스 보기',
    true,
    NOW(),
    NOW() + INTERVAL '1 month'
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_forced_popups_active ON forced_popups(is_active);
CREATE INDEX IF NOT EXISTS idx_forced_popups_dates ON forced_popups(start_date, end_date); 