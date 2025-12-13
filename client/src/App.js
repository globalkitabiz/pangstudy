import React, { Component } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import './App.css';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import DeckList from './components/DeckList';
import DeckDetail from './components/DeckDetail';
import Layout from './components/Layout';
import { authAPI } from './utils/api';

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
            <Layout>
                <h1>Pangstudy - 플래시카드 학습</h1>
                <Switch>
                    <Route exact path="/login">
                        {user ? (
                            <Redirect to="/decks" />
                        ) : showRegister ? (
                            <Register
                                onSwitchToLogin={() => this.setState({ showRegister: false })}
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

                    <Route path="/decks/:deckId">
                        {user ? <DeckDetail /> : <Redirect to="/login" />}
                    </Route>

                    <Route exact path="/">
                        <Redirect to={user ? "/decks" : "/login"} />
                    </Route>
                </Switch>
            </Layout>
        );
    }
}

export default App;
