import axios from 'axios';

const API = 'http://localhost:5000/api/upload';

export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return axios.post(API, formData);
};