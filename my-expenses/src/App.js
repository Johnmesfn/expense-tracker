import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Analytics from './components/Analytics/Analytics';
import ExpenseForm from './components/ExpenseForm/ExpenseForm';
import ExpenseList from './components/ExpenseList/ExpenseList';
import './App.css';

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Analytics />} />
        <Route path="/add-expense" element={<ExpenseForm />} />
        <Route path="/expenses" element={<ExpenseList />} />
      </Routes>
    </Router>
  );
};

export default App;
