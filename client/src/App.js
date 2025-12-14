import React, { Component } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import './App.css';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import DeckList from './components/DeckList';
import DeckDetail from './components/DeckDetail';
import StudySession from './components/StudySession';
import Layout from './components/Layout';
import { authAPI } from './utils/api';
import { ThemeProvider } from './contexts/ThemeContext';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: authAPI.getUser(),
            showRegister: false
        };
    }

    handleLoginSuccess = () => {
        this.setState({ user: authAPI.getUser() });
    };

    render() {
        const { user, showRegister } = this.state;

        return (
            <ThemeProvider>
                <Layout>
                    <h1>Pangstudy - 플래시카드 학습</h1>

                    <Switch>
                        <Route exact path="/login">
                            {user ? (
                                <Redirect to="/decks" />
                            ) : showRegister ? (
                                <Register
                                    onSwitchToLogin={() => this.setState({ showRegister: false })}
                                    onRegisterSuccess={this.handleLoginSuccess}
                                />
                            ) : (
                                <Login
                                    onSwitchToRegister={() => this.setState({ showRegister: true })}
                                    onLoginSuccess={this.handleLoginSuccess}
                                />
                            )}
                        </Route>

                        <Route exact path="/register">
                            {user ? (
                                <Redirect to="/decks" />
                            ) : (
                                <Register
                                    onSwitchToLogin={() => this.setState({ showRegister: false })}
                                    onRegisterSuccess={this.handleLoginSuccess}
                                />
                            )}
                        </Route>

                        <Route exact path="/decks">
                            {user ? <DeckList /> : <Redirect to="/login" />}
                        </Route>

                        <Route exact path="/decks/:deckId">
                            {user ? <DeckDetail /> : <Redirect to="/login" />}
                        </Route>

                        <Route exact path="/study/:deckId">
                            {user ? <StudySession /> : <Redirect to="/login" />}
                        </Route>

                        <Route exact path="/">
                            <Redirect to={user ? "/decks" : "/login"} />
                        </Route>
                    </Switch>
                </Layout>
            </ThemeProvider>
        );
    }
}

export default App;
