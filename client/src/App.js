import React, { Component } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import './App.css';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import DeckList from './components/DeckList';
import DeckDetail from './components/DeckDetail';
import StudySession from './components/StudySession';
import Layout from './components/Layout';
import Recommendations from './components/Recommendations';
import { authAPI } from './utils/api';
import { ThemeProvider } from './contexts/ThemeContext';

// Admin components
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsers from './components/admin/AdminUsers';
import AdminDecks from './components/admin/AdminDecks';
import AdminAssign from './components/admin/AdminAssign';
import AdminStats from './components/admin/AdminStats';

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
        const isAdmin = user?.is_admin;

        return (
            <ThemeProvider>
                <Switch>
                    {/* Admin routes - separate layout */}
                    <Route path="/admin">
                        {user && isAdmin ? (
                            <AdminLayout>
                                <Switch>
                                    <Route exact path="/admin" component={AdminDashboard} />
                                    <Route exact path="/admin/users" component={AdminUsers} />
                                    <Route exact path="/admin/decks" component={AdminDecks} />
                                    <Route exact path="/admin/assign" component={AdminAssign} />
                                    <Route exact path="/admin/stats" component={AdminStats} />
                                </Switch>
                            </AdminLayout>
                        ) : user ? (
                            <Redirect to="/decks" />
                        ) : (
                            <Redirect to="/login" />
                        )}
                    </Route>

                    {/* User routes - standard layout */}
                    <Route>
                        <Layout>
                            <Switch>
                                <Route path="/login">
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

                                <Route exact path="/recommendations">
                                    {user ? <Recommendations /> : <Redirect to="/login" />}
                                </Route>

                                <Route exact path="/users">
                                    <Redirect to="/admin" />
                                </Route>

                                <Route exact path="/decks/:deckId">
                                    {user ? <DeckDetail /> : <Redirect to="/login" />}
                                </Route>

                                <Route exact path="/study/assigned">
                                    {user ? <StudySession assignedMode={true} /> : <Redirect to="/login" />}
                                </Route>

                                <Route exact path="/study/:deckId">
                                    {user ? <StudySession /> : <Redirect to="/login" />}
                                </Route>

                                <Route exact path="/">
                                    <Redirect to={user ? "/decks" : "/login"} />
                                </Route>
                            </Switch>
                        </Layout>
                    </Route>
                </Switch>
            </ThemeProvider>
        );
    }
}

export default App;
