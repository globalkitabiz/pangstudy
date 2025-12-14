// 테마 토글 버튼 컴포넌트
import React, { Component } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

class ThemeToggle extends Component {
    render() {
        return (
            <ThemeContext.Consumer>
                {({ theme, toggleTheme, colors }) => (
                    <button
                        onClick={toggleTheme}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: colors.backgroundSecondary,
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}
                        title={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                        {theme === 'light' ? '다크' : '라이트'}
                    </button>
                )}
            </ThemeContext.Consumer>
        );
    }
}

export default ThemeToggle;
