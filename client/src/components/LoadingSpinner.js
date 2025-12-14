// 로딩 스피너 컴포넌트
import React from 'react';

const LoadingSpinner = ({ message = '로딩 중...', size = 'medium' }) => {
    const sizes = {
        small: { spinner: 24, fontSize: 12 },
        medium: { spinner: 40, fontSize: 14 },
        large: { spinner: 60, fontSize: 16 }
    };

    const currentSize = sizes[size] || sizes.medium;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            textAlign: 'center'
        }}>
            <div style={{
                width: `${currentSize.spinner}px`,
                height: `${currentSize.spinner}px`,
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #007bff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            {message && (
                <p style={{
                    marginTop: '15px',
                    color: '#6c757d',
                    fontSize: `${currentSize.fontSize}px`
                }}>
                    {message}
                </p>
            )}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LoadingSpinner;
