'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { authApi, tokenManager, User } from '@/lib/api';

export default function Navigation() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (tokenManager.isAuthenticated()) {
        try {
          const currentUser = await authApi.getMe();
          setUser(currentUser);
        } catch (error) {
          // Token might be invalid, clear it
          tokenManager.removeToken();
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
    // Full page reload to refresh all data and clear cached recipes
    window.location.href = '/';
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold hover:text-blue-200 transition">
            Recipe Manager
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="hover:text-blue-200 transition font-medium"
            >
              Home
            </Link>
            <Link
              href="/categories"
              className="hover:text-blue-200 transition font-medium"
            >
              Categories
            </Link>
            <Link
              href="/grocery-list"
              className="hover:text-blue-200 transition font-medium"
            >
              Grocery List
            </Link>
            <Link
              href="/meal-plans"
              className="hover:text-blue-200 transition font-medium"
            >
              Meal Plans
            </Link>

            {!loading && (
              <>
                {user ? (
                  <>
                    {user.is_admin && (
                      <Link
                        href="/admin"
                        className="hover:text-blue-200 transition font-medium bg-purple-700 px-3 py-1 rounded"
                      >
                        Admin
                      </Link>
                    )}
                    <Link
                      href="/recipes/new"
                      className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition font-medium"
                    >
                      + Create Recipe
                    </Link>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-blue-100">
                        {user.email}
                      </span>
                      <Link
                        href="/settings"
                        className="text-sm hover:text-blue-200 transition"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition font-medium"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="hover:text-blue-200 transition font-medium"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition font-medium"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
