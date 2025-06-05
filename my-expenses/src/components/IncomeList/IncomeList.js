import React, { useEffect, useState } from 'react';
import { getIncomes, deleteIncome } from '../../api/incomes';
import './IncomeList.css';

const sourceColors = {
  Salary: '#2ecc71',
  Freelance: '#3498db',
  Investment: '#9b59b6',
  Business: '#e67e22',
  Other: '#95a5a6',
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="modal-backdrop">
    <div className="modal-container">
      <p>{message}</p>
      <div className="modal-buttons">
        <button className="btn btn-cancel" onClick={onCancel}>Cancel</button>
        <button className="btn btn-confirm" onClick={onConfirm}>Confirm</button>
      </div>
    </div>
  </div>
);

const IncomeList = () => {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState(null);
  const [selectedSource, setSelectedSource] = useState('All');

  useEffect(() => {
    getIncomes()
      .then(({ data }) => {
        setIncomes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const requestDelete = (id) => {
    setIncomeToDelete(id);
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!incomeToDelete) return;
    try {
      await deleteIncome(incomeToDelete);
      setIncomes((prev) => prev.filter((inc) => inc.id !== incomeToDelete));
    } catch (err) {
      console.error('Failed to delete income:', err);
    } finally {
      setShowConfirm(false);
      setIncomeToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
    setIncomeToDelete(null);
  };

  const uniqueSources = ['All', ...new Set(incomes.map((inc) => inc.source))];
  const filteredIncomes = selectedSource === 'All'
    ? incomes
    : incomes.filter((income) => income.source === selectedSource);

  return (
    <div className="income-list-container">
      <h2>Income List</h2>

      <div className="filter-container">
        <label htmlFor="sourceFilter">Filter by Source:</label>
        <select
          id="sourceFilter"
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
        >
          {uniqueSources.map((src, idx) => (
            <option key={idx} value={src}>
              {src}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading incomes...</p>
      ) : filteredIncomes.length === 0 ? (
        <p>No incomes found.</p>
      ) : (
        <table className="income-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncomes.map(({ id, source, amount, date }) => (
              <tr key={id}>
                <td>
                  <span
                    className="source-badge"
                    style={{ backgroundColor: sourceColors[source] || sourceColors.Other }}
                  >
                    {source}
                  </span>
                </td>
                <td>${amount.toFixed(2)}</td>
                <td>{new Date(date).toLocaleDateString()}</td>
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
          message="Are you sure you want to delete this income?"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
};

export default IncomeList;
