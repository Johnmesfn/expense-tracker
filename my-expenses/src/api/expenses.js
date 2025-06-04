import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000';

export const getExpenses = () => axios.get(`${API_BASE_URL}/expenses`);

export const addExpense = (expenseData) =>
  axios.post(`${API_BASE_URL}/expenses`, expenseData);

export const deleteExpense = (id) =>
  axios.delete(`${API_BASE_URL}/expenses/${id}`);
