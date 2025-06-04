import React, { useState } from 'react';
import { addExpense } from '../../api/expenses';
import './ExpenseForm.css';

const ExpenseForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: '',
    category: '',
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const categories = ['Food', 'Transportation', 'Entertainment', 'Health', 'Utilities', 'Others'];

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.amount) newErrors.amount = 'Amount is required';
    else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0)
      newErrors.amount = 'Amount must be a positive number';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.category) newErrors.category = 'Category is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' })); // clear error on change
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await addExpense({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      setMessage('✅ Expense added successfully!');
      setFormData({ title: '', amount: '', date: '', category: '' });
      setErrors({});
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('❌ Failed to add expense. Please try again.');
      console.error(err);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  return (
    <div className="expense-form-container">
      <h2>Add New Expense</h2>
      <form onSubmit={handleSubmit} className="expense-form" noValidate>
        <div className="form-group">
          <input
            type="text"
            name="title"
            placeholder="Expense Title"
            value={formData.title}
            onChange={handleChange}
            aria-describedby="titleError"
            autoComplete="off"
          />
          {errors.title && <small className="error-msg" id="titleError">{errors.title}</small>}
        </div>

        <div className="form-group">
          <input
            type="number"
            name="amount"
            placeholder="Amount"
            value={formData.amount}
            onChange={handleChange}
            min="0.01"
            step="0.01"
            aria-describedby="amountError"
          />
          {errors.amount && <small className="error-msg" id="amountError">{errors.amount}</small>}
        </div>

        <div className="form-group">
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            aria-describedby="dateError"
          />
          {errors.date && <small className="error-msg" id="dateError">{errors.date}</small>}
        </div>

        <div className="form-group">
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            aria-describedby="categoryError"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && <small className="error-msg" id="categoryError">{errors.category}</small>}
        </div>

        <button type="submit">Add Expense</button>
      </form>

      {message && <p className={`message ${message.startsWith('❌') ? 'error' : 'success'}`}>{message}</p>}
    </div>
  );
};

export default ExpenseForm;
