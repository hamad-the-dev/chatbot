// src/api/axiosPublic.js
import axios from 'axios';

const axiosPublic = axios.create({
  baseURL: 'http://localhost:5173',
  withCredentials: true, 
});

export default axiosPublic;