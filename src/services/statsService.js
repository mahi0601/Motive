import axios from 'axios';

const API = 'http://localhost:8080/api/stats';

export const getStats = () => axios.get(API);
