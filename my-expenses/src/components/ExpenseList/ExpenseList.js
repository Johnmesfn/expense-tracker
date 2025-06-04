import React, { useEffect, useState } from 'react';
import { getExpenses, deleteExpense } from '../../api/expenses';
import './ExpenseList.css';

const categoryColors = {
  Food: '#ff6384',
  Transport: '#36a2eb',
  Entertainment: '#ffce56',
  Health: '#8bc34a',
  Other: '#9c27b0',
  Groceries: '#ffa500',
  Bills: '#20b2aa',
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <p>{message}</p>
        <div className="modal-buttons">
          <button className="btn btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-confirm" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const ExpenseList = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showConfirm, setShowConfirm] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  useEffect(() => {
    getExpenses()
      .then(({ data }) => {
        setExpenses(data);
        setFilteredExpenses(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredExpenses(expenses);
    } else {
      setFilteredExpenses(
        expenses.filter((expense) => expense.category === selectedCategory)
      );
    }
  }, [selectedCategory, expenses]);

  const requestDelete = (id) => {
    setExpenseToDelete(id);
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    try {
      await deleteExpense(expenseToDelete);
      setExpenses((prev) => prev.filter((expense) => expense.id !== expenseToDelete));
    } catch (err) {
      console.error('Failed to delete expense:', err);
    } finally {
      setShowConfirm(false);
      setExpenseToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
    setExpenseToDelete(null);
  };

  const uniqueCategories = ['All', ...new Set(expenses.map((e) => e.category))];

  return (
    <div className="expense-list-container">
      <h2>Expense List</h2>

      <div className="filter-container">
        <label htmlFor="categoryFilter">Filter by Category:</label>
        <select
          id="categoryFilter"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {uniqueCategories.map((cat, idx) => (
            <option key={idx} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading expenses...</p>
      ) : filteredExpenses.length === 0 ? (
        <p>No expenses found.</p>
      ) : (
        <table className="expense-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map(({ id, title, amount, date, category }) => (
              <tr key={id}>
                <td>{title}</td>
                <td>${amount.toFixed(2)}</td>
                <td>{new Date(date).toLocaleDateString()}</td>
                <td>
                  <span
                    className="category-badge"
                    style={{ backgroundColor: categoryColors[category] || categoryColors.Other }}
                  >
                    {category}
                  </span>
                </td>
                <td>
                  <button onClick={() => requestDelete(id)} className="delete-btn">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showConfirm && (
        <ConfirmModal
          message="Are you sure you want to delete this expense?"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
};

export default ExpenseList;
