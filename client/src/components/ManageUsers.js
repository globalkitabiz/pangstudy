import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import AddUserForm from './AddUserForm';
import AssignModal from './AssignModal';
import AdminReport from './AdminReport';
import { adminAPI } from '../utils/api';

export class ManageUsers extends Component {
  state = {
    users: [],
    showAssign: false,
    selectedUser: null,
    editingUser: null,
    newPassword: '',
    loading: false,
    error: null
  };

  componentDidMount() {
    this.loadUsers();
  }

  loadUsers = () => {
    this.setState({ loading: true, error: null });
    adminAPI.getUsers()
      .then(data => {
        this.setState({ users: data.users || [], loading: false });
      })
      .catch(e => {
        console.error('Failed to load users:', e);
        this.setState({ error: e.message, loading: false });
      });
  };

  addUser = (name, email, password) => {
    adminAPI.addUser(name, email, password)
      .then(({ user }) => {
        this.setState(prev => ({ users: [...prev.users, user] }));
      })
      .catch(e => {
        alert('Failed to add user: ' + e.message);
      });
  };

  deleteUser = (userId, userName) => {
    if (!window.confirm(`"${userName}" 사용자를 삭제하시겠습니까?\n관련 학습 기록도 함께 삭제됩니다.`)) {
      return;
    }

    adminAPI.deleteUser(userId)
      .then(() => {
        this.setState(prev => ({
          users: prev.users.filter(u => u.id !== userId)
        }));
      })
      .catch(e => {
        alert('Failed to delete user: ' + e.message);
      });
  };

  toggleAdmin = (userId, currentIsAdmin) => {
    const newIsAdmin = !currentIsAdmin;
    const action = newIsAdmin ? '관리자 권한을 부여' : '관리자 권한을 해제';

    if (!window.confirm(`${action}하시겠습니까?`)) {
      return;
    }

    adminAPI.updateUser(userId, { is_admin: newIsAdmin })
      .then(({ user }) => {
        this.setState(prev => ({
          users: prev.users.map(u => u.id === userId ? { ...u, is_admin: user.is_admin } : u)
        }));
      })
      .catch(e => {
        alert('Failed to update admin status: ' + e.message);
      });
  };

  resetPassword = (userId) => {
    const { newPassword } = this.state;
    if (!newPassword || newPassword.length < 4) {
      alert('비밀번호는 4자 이상이어야 합니다.');
      return;
    }

    adminAPI.updateUser(userId, { new_password: newPassword })
      .then(() => {
        alert('비밀번호가 재설정되었습니다.');
        this.setState({ editingUser: null, newPassword: '' });
      })
      .catch(e => {
        alert('Failed to reset password: ' + e.message);
      });
  };

  render() {
    const { users, loading, error, editingUser, newPassword } = this.state;

    return (
      <div className="ShowDeck">
        <h2>Users</h2>

        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>ID</th>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Email</th>
              <th style={{ padding: 8 }}>Admin</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(({ id: userId, name, email, is_admin }) => (
              <tr key={userId} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{userId}</td>
                <td style={{ padding: 8 }}>{name}</td>
                <td style={{ padding: 8 }}>{email}</td>
                <td style={{ padding: 8 }}>
                  <button
                    onClick={() => this.toggleAdmin(userId, is_admin)}
                    style={{
                      background: is_admin ? '#4CAF50' : '#ccc',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    {is_admin ? 'Admin' : 'User'}
                  </button>
                </td>
                <td style={{ padding: 8 }}>
                  <Link to={`/users/${userId}/decks`} style={{ marginRight: 8 }}>View Decks</Link>
                  <button
                    style={{ marginRight: 8 }}
                    onClick={() => this.setState({ showAssign: true, selectedUser: { id: userId, name, email } })}
                  >
                    Assign
                  </button>
                  <button
                    style={{ marginRight: 8 }}
                    onClick={() => this.setState({ editingUser: userId, newPassword: '' })}
                  >
                    Reset PW
                  </button>
                  <button
                    style={{ color: 'red' }}
                    onClick={() => this.deleteUser(userId, name || email)}
                  >
                    Delete
                  </button>

                  {editingUser === userId && (
                    <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                      <input
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => this.setState({ newPassword: e.target.value })}
                        style={{ marginRight: 8, padding: 4 }}
                      />
                      <button onClick={() => this.resetPassword(userId)} style={{ marginRight: 4 }}>
                        Save
                      </button>
                      <button onClick={() => this.setState({ editingUser: null, newPassword: '' })}>
                        Cancel
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <AddUserForm addUser={this.addUser} />

        <AssignModal
          visible={this.state.showAssign}
          user={this.state.selectedUser}
          onClose={() => this.setState({ showAssign: false, selectedUser: null })}
          onSuccess={(data) => {
            alert('Assignment created: ' + data.assignmentId);
            this.setState({ showAssign: false, selectedUser: null });
          }}
        />

        <AdminReport />
      </div>
    );
  }
}

export default ManageUsers;
