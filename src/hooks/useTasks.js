import { useContext } from 'react';
import { TaskContext } from '../context/TaskContext';

const useTasks = () => useContext(TaskContext);

export default useTasks;