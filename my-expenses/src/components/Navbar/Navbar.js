import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <NavLink to="/" className={({ isActive }) => (isActive ? 'active-link' : '')}>
        Dashboard
      </NavLink>
      <NavLink to="/add-expense" className={({ isActive }) => (isActive ? 'active-link' : '')}>
        Add Expense
      </NavLink>
      <NavLink to="/expenses" className={({ isActive }) => (isActive ? 'active-link' : '')}>
        Expense List
      </NavLink>
      <NavLink to="/add-income" className={({ isActive }) => (isActive ? 'active-link' : '')}>
        Add Income
      </NavLink>
      <NavLink to="/incomes" className={({ isActive }) => (isActive ? 'active-link' : '')}>
        Income List
      </NavLink>
    </nav>
  );
};

export default Navbar;
