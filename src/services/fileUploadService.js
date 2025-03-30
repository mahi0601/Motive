import axios from 'axios';

const API = 'http://localhost:8080/api/upload';

export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return axios.post(API, formData);
};