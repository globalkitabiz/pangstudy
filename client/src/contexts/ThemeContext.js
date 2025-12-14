// 테마 Context
import React, { Component } from 'react';
import { lightTheme, darkTheme } from '../styles/themes';

export const ThemeContext = React.createContext();

export class ThemeProvider extends Component {
    constructor(props) {
        super(props);

        // localStorage에서 테마 불러오기
        const savedTheme = localStorage.getItem('theme') || 'light';

        this.state = {
            theme: savedTheme,
            colors: savedTheme === 'dark' ? darkTheme : lightTheme
        };
    }

    toggleTheme = () => {
        const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
        const newColors = newTheme === 'dark' ? darkTheme : lightTheme;

        this.setState({
            theme: newTheme,
            colors: newColors
        });

        // localStorage에 저장
        localStorage.setItem('theme', newTheme);
    };

    render() {
        return (
            <ThemeContext.Provider value={{
                theme: this.state.theme,
                colors: this.state.colors,
                toggleTheme: this.toggleTheme
            }}>
                {this.props.children}
            </ThemeContext.Provider>
        );
    }
}
