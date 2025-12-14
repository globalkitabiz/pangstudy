// 에러 메시지 처리 유틸리티

export const getErrorMessage = (error) => {
    const message = error.message || error.toString();

    // 이메일 중복
    if (message.includes('Email already exists') || message.includes('UNIQUE constraint')) {
        return '이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.';
    }

    // 인증 오류
    if (message.includes('Invalid credentials') || message.includes('Unauthorized')) {
        return '이메일 또는 비밀번호가 올바르지 않습니다.';
    }

    if (message.includes('401')) {
        return '로그인이 필요합니다. 다시 로그인해주세요.';
    }

    // 비밀번호 오류
    if (message.includes('password') && message.includes('short')) {
        return '비밀번호는 최소 8자 이상이어야 합니다.';
    }

    // 네트워크 오류
    if (message.includes('Failed to fetch') || message.includes('Network')) {
        return '네트워크 연결을 확인해주세요.';
    }

    // 404 오류
    if (message.includes('404') || message.includes('not found')) {
        return '요청한 리소스를 찾을 수 없습니다.';
    }

    // 500 서버 오류
    if (message.includes('500') || message.includes('Internal server error')) {
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }

    // 덱 관련 오류
    if (message.includes('Deck not found')) {
        return '덱을 찾을 수 없습니다.';
    }

    if (message.includes('Card not found')) {
        return '카드를 찾을 수 없습니다.';
    }

    // 공유 관련 오류
    if (message.includes('Invalid share token')) {
        return '유효하지 않은 공유 링크입니다.';
    }

    // 기본 메시지
    return message || '오류가 발생했습니다. 다시 시도해주세요.';
};

// 성공 메시지 포맷팅
export const getSuccessMessage = (action, itemName = '') => {
    const messages = {
        create: `${itemName}이(가) 생성되었습니다.`,
        update: `${itemName}이(가) 수정되었습니다.`,
        delete: `${itemName}이(가) 삭제되었습니다.`,
        import: `${itemName}을(를) 가져왔습니다.`,
        share: '공유 링크가 생성되었습니다.',
        copy: '클립보드에 복사되었습니다.'
    };

    return messages[action] || '작업이 완료되었습니다.';
};
