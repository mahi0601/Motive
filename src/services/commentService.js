import axios from 'axios';

const API = 'http://localhost:8080/api/comments';

export const getComments = (taskId) => axios.get(`${API}/${taskId}`);
export const addComment = (taskId, comment) => axios.post(`${API}/${taskId}`, { comment });