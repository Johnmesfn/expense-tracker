import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { FaFileImport } from 'react-icons/fa'; // Use same icon style as ExpenseForm

const IncomeForm = () => {
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    date: '',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [fileData, setFileData] = useState(null);

  const fileInputRef = useRef(null);

  const validate = () => {
    const newErrors = {};
    if (!formData.source.trim()) newErrors.source = 'Source is required';
    if (!formData.amount) newErrors.amount = 'Amount is required';
    else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0)
      newErrors.amount = 'Amount must be a positive number';
    if (!formData.date) newErrors.date = 'Date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const res = await fetch('http://localhost:5000/incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: formData.source,
          amount: parseFloat(formData.amount),
          date: formData.date,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add income.');
      }

      setMessage({ type: 'success', text: '✅ Income added successfully!' });
      setFormData({ source: '', amount: '', date: '' });
      setErrors({});
    } catch (error) {
      setMessage({ type: 'error', text: '❌ ' + error.message });
    }

    setTimeout(() => setMessage(null), 4000);
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
      bulkImportIncomes(jsonData);
    };
    reader.readAsBinaryString(file);
  };

  const bulkImportIncomes = async (data) => {
    try {
      for (const row of data) {
        if (!row.source || !row.amount || !row.date) {
          setMessage({ type: 'error', text: 'Invalid data. Columns required: source, amount, date' });
          return;
        }
        await fetch('http://localhost:5000/incomes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: row.source,
            amount: parseFloat(row.amount),
            date: row.date,
          }),
        });
      }
      setMessage({ type: 'success', text: '✅ Bulk incomes imported successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Bulk import failed: ' + error.message });
    }

    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div className="expense-form-container">

      {/* Import button matching expense form */}
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

      <h2>Add Income</h2>

      <form onSubmit={handleSubmit} className="expense-form" noValidate>
        <div className="form-group">
          <input
            type="text"
            name="source"
            placeholder="Income Source"
            value={formData.source}
            onChange={handleChange}
            autoComplete="off"
          />
          {errors.source && <small className="error-msg">{errors.source}</small>}
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

        <button type="submit">Add Income</button>
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

export default IncomeForm;
