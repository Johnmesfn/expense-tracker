import React, { useEffect, useState } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { getExpenses } from '../../api/expenses';
import { getIncomes } from '../../api/incomes';
import './Analytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

const Analytics = () => {
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [expensesRes, incomesRes] = await Promise.all([
          getExpenses(),
          getIncomes(),
        ]);
        setExpenses(expensesRes.data || []);
        setIncomes(incomesRes.data || []);
      } catch (err) {
        console.error('Error fetching analytics data', err);
      }
    };
    fetchData();
  }, []);

  const summary = {
    totalExpense: expenses.reduce((sum, e) => sum + e.amount, 0),
    totalIncome: incomes.reduce((sum, i) => sum + i.amount, 0),
  };
  summary.netBalance = summary.totalIncome - summary.totalExpense;

  // Top income source and expense category
  const incomeSourceMap = {};
  const expenseCatMap = {};

  incomes.forEach(({ source, amount }) => {
    incomeSourceMap[source] = (incomeSourceMap[source] || 0) + amount;
  });

  expenses.forEach(({ category, amount }) => {
    expenseCatMap[category] = (expenseCatMap[category] || 0) + amount;
  });

  summary.topIncomeSource = Object.entries(incomeSourceMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  summary.topExpenseCategory = Object.entries(expenseCatMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Monthly aggregation
  const monthSet = new Set();
  [...expenses, ...incomes].forEach(({ date }) => {
    monthSet.add(new Date(date).toISOString().slice(0, 7));
  });
  const sortedMonths = Array.from(monthSet).sort();

  const incomeByMonth = {};
  const expenseByMonth = {};

  incomes.forEach(({ date, amount }) => {
    const m = new Date(date).toISOString().slice(0, 7);
    incomeByMonth[m] = (incomeByMonth[m] || 0) + amount;
  });

  expenses.forEach(({ date, amount }) => {
    const m = new Date(date).toISOString().slice(0, 7);
    expenseByMonth[m] = (expenseByMonth[m] || 0) + amount;
  });

  // Charts
  const incomeVsExpenseData = {
    labels: sortedMonths,
    datasets: [
      {
        label: 'Income',
        data: sortedMonths.map(m => incomeByMonth[m] || 0),
        backgroundColor: '#2ecc71',
      },
      {
        label: 'Expense',
        data: sortedMonths.map(m => expenseByMonth[m] || 0),
        backgroundColor: '#e74c3c',
      },
    ],
  };

  const balanceTrendData = {
    labels: sortedMonths,
    datasets: [
      {
        label: 'Net Balance',
        data: sortedMonths.map(m => (incomeByMonth[m] || 0) - (expenseByMonth[m] || 0)),
        borderColor: '#9b59b6',
        backgroundColor: 'rgba(155, 89, 182, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const incomePieData = {
    labels: Object.keys(incomeSourceMap),
    datasets: [
      {
        label: 'Income by Source',
        data: Object.values(incomeSourceMap),
        backgroundColor: ['#2ecc71', '#1abc9c', '#27ae60', '#16a085'],
      },
    ],
  };

  const expensePieData = {
    labels: Object.keys(expenseCatMap),
    datasets: [
      {
        label: 'Expense by Category',
        data: Object.values(expenseCatMap),
        backgroundColor: ['#FF6384', '#FFCE56', '#36A2EB', '#9C27B0', '#8BC34A'],
      },
    ],
  };

  const recentIncomes = incomes.slice(-5).reverse();
  const recentExpenses = expenses.slice(-5).reverse();

  return (
    <div className="analytics-container">
      <h2>Financial Analytics</h2>

      <div className="summary-cards">
        <div className="summary-card"><h4>Total Income</h4><p>${summary.totalIncome.toFixed(2)}</p></div>
        <div className="summary-card"><h4>Total Expense</h4><p>${summary.totalExpense.toFixed(2)}</p></div>
        <div className="summary-card">
          <h4>Net Balance</h4>
          <p style={{ color: summary.netBalance >= 0 ? 'green' : 'red' }}>
            ${summary.netBalance.toFixed(2)}
          </p>
        </div>
        <div className="summary-card"><h4>Top Income Source</h4><p>{summary.topIncomeSource}</p></div>
        <div className="summary-card"><h4>Top Expense Category</h4><p>{summary.topExpenseCategory}</p></div>
      </div>

      <div className="charts-wrapper">
        <div className="chart-card">
          <h3>Monthly Income vs Expense</h3>
          <Bar data={incomeVsExpenseData} options={{ responsive: true }} />
        </div>
        <div className="chart-card">
          <h3>Net Balance Trend</h3>
          <Line data={balanceTrendData} options={{ responsive: true }} />
        </div>
        <div className="chart-card">
          <h3>Income by Source</h3>
          <Pie data={incomePieData} options={{ responsive: true }} />
        </div>
        <div className="chart-card">
          <h3>Expense by Category</h3>
          <Pie data={expensePieData} options={{ responsive: true }} />
        </div>
      </div>

      <div className="recent-transactions">
        <div>
          <h3>Recent Incomes</h3>
          <ul>
            {recentIncomes.map(({ id, source, amount, date }) => (
              <li key={id}>
                {source} - ${amount.toFixed(2)} on {new Date(date).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3>Recent Expenses</h3>
          <ul>
            {recentExpenses.map(({ id, title, amount, category, date }) => (
              <li key={id}>
                {title} ({category}) - ${amount.toFixed(2)} on {new Date(date).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
