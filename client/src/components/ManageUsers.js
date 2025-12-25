import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import AddUserForm from './AddUserForm';
import AssignModal from './AssignModal';
import AdminReport from './AdminReport';
import { adminAPI } from '../utils/api';
import { ThemeContext } from '../contexts/ThemeContext';

export class ManageUsers extends Component {
  static contextType = ThemeContext;
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
    const { colors } = this.context || {};

    return (
      <div className="ShowDeck" style={{ backgroundColor: colors?.background, minHeight: '100vh', padding: '20px' }}>
        <h2 style={{ color: colors?.text }}>Users</h2>

        {loading && <p style={{ color: colors?.text }}>Loading...</p>}
        {error && <p style={{ color: colors?.danger || 'red' }}>Error: {error}</p>}

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, backgroundColor: colors?.cardBackground }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${colors?.border || '#ddd'}`, textAlign: 'left' }}>
              <th style={{ padding: 8, color: colors?.text }}>ID</th>
              <th style={{ padding: 8, color: colors?.text }}>Name</th>
              <th style={{ padding: 8, color: colors?.text }}>Email</th>
              <th style={{ padding: 8, color: colors?.text }}>Admin</th>
              <th style={{ padding: 8, color: colors?.text }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(({ id: userId, name, email, is_admin }) => (
              <tr key={userId} style={{ borderBottom: `1px solid ${colors?.borderLight || '#eee'}` }}>
                <td style={{ padding: 8, color: colors?.text }}>{userId}</td>
                <td style={{ padding: 8, color: colors?.text }}>{name}</td>
                <td style={{ padding: 8, color: colors?.text }}>{email}</td>
                <td style={{ padding: 8 }}>
                  <button
                    onClick={() => this.toggleAdmin(userId, is_admin)}
                    style={{
                      background: is_admin ? colors?.success || '#4CAF50' : colors?.buttonSecondary || '#ccc',
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
                  <Link to={`/users/${userId}/decks`} style={{ marginRight: 8, color: colors?.primary || '#007bff' }}>View Decks</Link>
                  <button
                    style={{ marginRight: 8, backgroundColor: colors?.buttonPrimary || '#007bff', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}
                    onClick={() => this.setState({ showAssign: true, selectedUser: { id: userId, name, email } })}
                  >
                    Assign
                  </button>
                  <button
                    style={{ marginRight: 8, backgroundColor: colors?.warning || '#ffc107', color: '#000', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}
                    onClick={() => this.setState({ editingUser: userId, newPassword: '' })}
                  >
                    Reset PW
                  </button>
                  <button
                    style={{ backgroundColor: colors?.danger || '#dc3545', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}
                    onClick={() => this.deleteUser(userId, name || email)}
                  >
                    Delete
                  </button>

                  {editingUser === userId && (
                    <div style={{ marginTop: 8, padding: 8, background: colors?.backgroundSecondary || '#f5f5f5', borderRadius: 4 }}>
                      <input
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => this.setState({ newPassword: e.target.value })}
                        style={{ marginRight: 8, padding: 4, backgroundColor: colors?.inputBackground || '#fff', color: colors?.text, border: `1px solid ${colors?.inputBorder || '#ddd'}`, borderRadius: 4 }}
                      />
                      <button onClick={() => this.resetPassword(userId)} style={{ marginRight: 4, backgroundColor: colors?.buttonSuccess || '#28a745', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>
                        Save
                      </button>
                      <button onClick={() => this.setState({ editingUser: null, newPassword: '' })} style={{ backgroundColor: colors?.buttonSecondary || '#6c757d', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>
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
