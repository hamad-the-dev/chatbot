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
    const token = localStorage.getItem('token');
    if (!token) {
      clearAuthData();
      return;
    }

    try {
      const { data } = await axiosPrivate.get(`${backendurl}/api/user/data`);
      if (data.success) {
        setUserData(data.userData);
        setIsLoggedin(true);
      } else {
        toast.error(data.message);
        clearAuthData();
        if (window.location.pathname !== '/login' && 
            window.location.pathname !== '/signup') {
          window.location.href = '/login';
        }
      }
    } catch (error) {
      console.log('User data fetch error:', error);
      if (error.response?.status === 401) {
        clearAuthData();
        if (window.location.pathname !== '/login' && 
            window.location.pathname !== '/signup') {
          window.location.href = '/login';
        }
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to fetch user data');
      }
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        clearAuthData();
        if (window.location.pathname !== '/login' && 
            window.location.pathname !== '/signup') {
          window.location.href = '/login';
        }
        return;
      }
      try {
        await getAuthState();
        if (isLoggedin) {
          await getuserData();
        }
      } catch (error) {
        clearAuthData();
        if (window.location.pathname !== '/login' && 
            window.location.pathname !== '/signup') {
          window.location.href = '/login';
        }
      }
    };
    initializeAuth();
  }, []);

  const logout = async () => {
    try {
      await axiosPrivate.post(`${backendurl}/api/auth/logout`);
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      clearAuthData();
      window.location.href = '/login';
    }
  };

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