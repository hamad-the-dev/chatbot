// src/api/axiosPublic.js
import axios from 'axios';

const axiosPublic = axios.create({
  baseURL: 'http://localhost:4000', 
});

export default axiosPublic;