import axios from 'axios';

const API = 'http://localhost:8080/api/auth';

export const login = (credentials) => axios.post(`${API}/login`, credentials);
export const register = (data) => axios.post(`${API}/register`, data);
export const logout = () => axios.post(`${API}/logout`);