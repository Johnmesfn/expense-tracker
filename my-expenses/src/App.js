import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Analytics from './components/Analytics/Analytics';
import ExpenseForm from './components/ExpenseForm/ExpenseForm';
import ExpenseList from './components/ExpenseList/ExpenseList';
import IncomeForm from './components/IncomeForm/IncomeForm';       // Import IncomeForm
import IncomeList from './components/IncomeList/IncomeList';       // Import IncomeList
import './App.css';

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Analytics />} />
        <Route path="/add-expense" element={<ExpenseForm />} />
        <Route path="/expenses" element={<ExpenseList />} />
        <Route path="/add-income" element={<IncomeForm />} />        {/* Add Income Form route */}
        <Route path="/incomes" element={<IncomeList />} />           {/* Add Income List route */}
      </Routes>
    </Router>
  );
};

export default App;
