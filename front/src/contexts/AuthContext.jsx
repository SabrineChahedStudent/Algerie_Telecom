import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('user');
    const token = Cookies.get('access');

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Invalid user data in localStorage");
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, access, refresh) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    Cookies.set('access', access, { expires: 1/24 }); // 1 hour
    Cookies.set('refresh', refresh, { expires: 7 }); // 7 days
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    Cookies.remove('access');
    Cookies.remove('refresh');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
