import React, { useState, useRef } from 'react';
import { addExpense } from '../../api/expenses';
import * as XLSX from 'xlsx';
import './ExpenseForm.css';
import { FaFileImport } from 'react-icons/fa'; // Import icon

const ExpenseForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: '',
    category: '',
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [fileData, setFileData] = useState(null);
  const categories = ['Food', 'Transportation', 'Entertainment', 'Health', 'Utilities', 'Others'];

  const fileInputRef = useRef(null);

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
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
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
      setMessage({ type: 'success', text: '✅ Expense added successfully!' });
      setFormData({ title: '', amount: '', date: '', category: '' });
      setErrors({});
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: '❌ Failed to add expense. Please try again.' });
    }

    setTimeout(() => setMessage(''), 4000);
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const binaryStr = evt.target.result;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      setFileData(jsonData);
      bulkImportExpenses(jsonData);
    };
    reader.readAsBinaryString(file);
  };

  const bulkImportExpenses = async (data) => {
    try {
      for (const row of data) {
        if (!row.title || !row.amount || !row.date || !row.category) {
          setMessage({ type: 'error', text: 'Invalid data. Required columns: title, amount, date, category' });
          return;
        }
        await addExpense({
          title: row.title,
          amount: parseFloat(row.amount),
          date: row.date,
          category: row.category,
        });
      }
      setMessage({ type: 'success', text: '✅ Bulk expenses imported successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Bulk import failed: ' + error.message });
    }

    setTimeout(() => setMessage(''), 5000);
  };

  return (
    <div className="expense-form-container">

      {/* Custom Import Button */}
      <button type="button" className="import-btn" onClick={triggerFileSelect}>
        <FaFileImport style={{ marginRight: '8px' }} />
        Import from Excel / CSV
      </button>
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      <h2>Add New Expense</h2>

      <form onSubmit={handleSubmit} className="expense-form" noValidate>
        <div className="form-group">
          <input
            type="text"
            name="title"
            placeholder="Expense Title"
            value={formData.title}
            onChange={handleChange}
            autoComplete="off"
          />
          {errors.title && <small className="error-msg">{errors.title}</small>}
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
          />
          {errors.amount && <small className="error-msg">{errors.amount}</small>}
        </div>

        <div className="form-group">
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
          />
          {errors.date && <small className="error-msg">{errors.date}</small>}
        </div>

        <div className="form-group">
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && <small className="error-msg">{errors.category}</small>}
        </div>

        <button type="submit">Add Expense</button>
      </form>

      {message && (
        <p className={`message ${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
        </p>
      )}

      {fileData && (
        <div>
          <h3>Preview Imported Data</h3>
          <pre style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {JSON.stringify(fileData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ExpenseForm;
