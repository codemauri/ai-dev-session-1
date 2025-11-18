'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api, { User } from '@/lib/api';

interface Stats {
  total_users: number;
  active_users: number;
  admin_users: number;
  total_recipes: number;
  public_recipes: number;
  total_meal_plans: number;
  total_categories: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData, me] = await Promise.all([
        api.admin.getStats(),
        api.admin.users.list(0, 50),
        api.auth.getMe(),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setCurrentUser(me);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This will also delete all their recipes and meal plans.')) {
      return;
    }

    try {
      await api.admin.users.delete(userId);
      setUsers(users.filter(u => u.id !== userId));
      setDeleteUserId(null);
      await loadData(); // Reload stats
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleResetPassword = async (userId: number) => {
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    try {
      await api.admin.users.resetPassword(userId, newPassword);
      alert('Password reset successfully');
      setResetPasswordUserId(null);
      setNewPassword('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reset password');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await api.admin.users.update(user.id, { is_active: !user.is_active });
      setUsers(users.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleToggleAdmin = async (user: User) => {
    try {
      await api.admin.users.update(user.id, { is_admin: !user.is_admin });
      setUsers(users.map(u => u.id === user.id ? { ...u, is_admin: !u.is_admin } : u));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading admin dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.total_users}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.active_users} active
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Recipes</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.total_recipes}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.public_recipes} public
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Meal Plans</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.total_meal_plans}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Categories</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.total_categories}</p>
            </div>
          </div>
        )}

        {/* User Management */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.full_name || 'No name'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={currentUser?.id === user.id}
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        } ${currentUser?.id === user.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        title={currentUser?.id === user.id ? 'Cannot deactivate yourself' : ''}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleAdmin(user)}
                        disabled={currentUser?.id === user.id}
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.is_admin
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        } ${currentUser?.id === user.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        title={currentUser?.id === user.id ? 'Cannot remove your own admin privileges' : ''}
                      >
                        {user.is_admin ? 'Admin' : 'User'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {resetPasswordUserId === user.id ? (
                        <div className="flex gap-2">
                          <input
                            type="password"
                            placeholder="New password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="px-2 py-1 border rounded text-xs"
                            minLength={8}
                          />
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className="text-green-600 hover:text-green-900 text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setResetPasswordUserId(null);
                              setNewPassword('');
                            }}
                            className="text-gray-600 hover:text-gray-900 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setResetPasswordUserId(user.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Reset Password
                          </button>
                          {currentUser?.id !== user.id && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
