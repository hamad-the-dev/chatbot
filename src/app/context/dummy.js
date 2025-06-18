'use client';

import React from 'react';
import { useEffect } from "react";
import { createContext, useState } from "react";
import { toast } from "react-toastify";
import axiosPrivate from '../utils/axiosPrivate';

const isBrowser = typeof window !== 'undefined';

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const backendurl = process.env.NEXT_PUBLIC_VITE_BACKEND_URL || 'http://localhost:4000';
  const [isLoggedin, setIsLoggedin] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    setIsLoggedin(false);
    setUserData(null);
  };

  const getAuthState = async () => {
    if (!isBrowser) return false;
    
    try {
      const token = localStorage.getItem('token');
      console.log('Checking auth state with token:', token);
      const savedUser = localStorage.getItem('user');
      
      if (!token || !savedUser) {
        return false;
      }

      const { data } = await axiosPrivate.get(`${backendurl}/api/auth/is-auth`);
      if (data.success) {
        setIsLoggedin(true);
        setUserData(data.user || JSON.parse(savedUser));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Auth state check error:', error);
      return false;
    }
  };

  const getuserData = async () => {
    if (!isBrowser) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const { data } = await axiosPrivate.get(`${backendurl}/api/user/data`);
      if (data.success && data.userData) {
        setUserData(data.userData);
        setIsLoggedin(true);
        localStorage.setItem('user', JSON.stringify(data.userData));
      }
    } catch (error) {
      // Only log the error but don't clear auth data
      // This prevents logout on temporary network issues
      console.error('User data fetch error:', error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const isAuthenticated = await getAuthState();
        
        if (isAuthenticated) {
          await getuserData();
        } else {
          // Only clear data if we're not on auth pages
          const path = window.location.pathname;
          if (path !== '/login' && path !== '/signup' && path !== '/reset-password') {
            clearAuthData();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    if (!isInitialized) {
      initializeAuth();
    }
  }, [isInitialized]);

  const logout = async () => {
    try {
      const { data } = await axiosPrivate.post(`${backendurl}/api/auth/logout`);
      if (data.success) {
        clearAuthData();
        // Use replace to avoid adding to browser history
        window.location.replace('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if server logout fails
      clearAuthData();
      window.location.replace('/login');
    }
  };

  // Don't render children until auth is initialized
  if (!isInitialized && isBrowser) {
    return null; 
  }

  const value = {
    backendurl,
    isLoggedin,
    setIsLoggedin,
    userData,
    setUserData,
    getuserData,
    getAuthState,
    logout
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};
export default AppContextProvider;