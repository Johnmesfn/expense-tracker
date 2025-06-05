import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000';

export const getIncomes = () => axios.get(`${API_BASE_URL}/incomes`);

export const addIncome = (incomeData) =>
  axios.post(`${API_BASE_URL}/incomes`, incomeData);

export const deleteIncome = (id) =>
  axios.delete(`${API_BASE_URL}/incomes/${id}`);
