import React, { useEffect, useState } from 'react';
import { Line, Pie, Bar } from 'react-chartjs-2';
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

const CategoryBadge = ({ category }) => {
  const colors = {
    Food: '#FF6384',
    Transport: '#36A2EB',
    Entertainment: '#FFCE56',
    Health: '#8BC34A',
    Other: '#9C27B0',
  };
  return (
    <span
      style={{
        backgroundColor: colors[category] || colors.Other,
        borderRadius: '8px',
        color: 'white',
        padding: '0.15rem 0.6rem',
        fontSize: '0.75rem',
        fontWeight: '600',
        marginRight: '0.5rem',
        userSelect: 'none',
      }}
    >
      {category}
    </span>
  );
};

const Analytics = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    average: 0,
    topCategory: '',
    peakMonth: '',
    transactions: 0,
  });
  const [expenseData, setExpenseData] = useState([]);

  // Toggles
  const [chartType, setChartType] = useState('line'); // 'line' | 'pie' | 'bar'
  const [recentView, setRecentView] = useState('list'); // 'list' | 'chart'
  const [largestView, setLargestView] = useState('list'); // 'list' | 'chart'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await getExpenses();
        if (!data?.length) return;

        setExpenseData(data);

        const monthMap = {};
        const catMap = {};
        let total = 0;

        data.forEach(({ amount, date, category }) => {
          const month = new Date(date).toISOString().slice(0, 7);
          monthMap[month] = (monthMap[month] || 0) + amount;
          catMap[category] = (catMap[category] || 0) + amount;
          total += amount;
        });

        const sortedMonths = Object.keys(monthMap).sort();
        const last12 = sortedMonths.slice(-12);
        const monthlyData = last12.map((month) => ({
          label: month,
          value: monthMap[month],
        }));

        const categoryData = Object.entries(catMap).map(([label, value]) => ({ label, value }));
        const average = sortedMonths.length ? total / sortedMonths.length : 0;
        const topCategory = categoryData.sort((a, b) => b.value - a.value)[0]?.label || 'N/A';
        const peakMonth = monthlyData.sort((a, b) => b.value - a.value)[0]?.label || 'N/A';

        setMonthlyData(monthlyData);
        setCategoryData(categoryData);
        setSummary({
          total,
          average,
          topCategory,
          peakMonth,
          transactions: data.length,
        });
      } catch (error) {
        console.error('Failed to fetch expenses:', error);
      }
    };

    fetchData();
  }, []);

  // Chart data definitions
  const lineChartData = {
    labels: monthlyData.map((d) => d.label),
    datasets: [
      {
        label: 'Monthly Expenses',
        data: monthlyData.map((d) => d.value),
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const pieChartData = {
    labels: categoryData.map((d) => d.label),
    datasets: [
      {
        data: categoryData.map((d) => d.value),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#8BC34A',
          '#FF9800', '#9C27B0', '#00BCD4',
        ],
        hoverOffset: 6,
      },
    ],
  };

  const barChartData = {
    labels: categoryData.map((d) => d.label),
    datasets: [
      {
        label: 'Spending by Category',
        data: categoryData.map((d) => d.value),
        backgroundColor: '#2980b9',
        borderRadius: 5,
      },
    ],
  };

  // Top 5 largest transactions
  const largestTransactions = [...expenseData]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Filter data for Recent Transactions Chart (e.g., bar chart grouped by category for last 5 transactions)
  // For simplicity, show bar chart of amounts by category for recent transactions
  const recentTransactions = expenseData.slice(-5);
  const recentCatMap = {};
  recentTransactions.forEach(({ amount, category }) => {
    recentCatMap[category] = (recentCatMap[category] || 0) + amount;
  });
  const recentCategoryData = Object.entries(recentCatMap).map(([label, value]) => ({ label, value }));

  const recentBarData = {
    labels: recentCategoryData.map(d => d.label),
    datasets: [
      {
        label: 'Recent Spending by Category',
        data: recentCategoryData.map(d => d.value),
        backgroundColor: '#3498db',
        borderRadius: 5,
      }
    ]
  };

  // For largest expenses chart: show bar chart of top 5 largest expenses by title and amount
  const largestBarData = {
    labels: largestTransactions.map(t => t.title),
    datasets: [
      {
        label: 'Top 5 Largest Expenses',
        data: largestTransactions.map(t => t.amount),
        backgroundColor: '#e74c3c',
        borderRadius: 5,
      }
    ]
  };

  // Select chart component based on selected chartType for main spending charts
  const renderMainChart = () => {
    if (chartType === 'line') {
      return <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false }} />;
    } else if (chartType === 'pie') {
      return <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: false }} />;
    } else if (chartType === 'bar') {
      return <Bar
        data={barChartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true } }
        }}
      />;
    }
  };

  return (
    <div className="analytics-container">
      <h2>Expense Analytics</h2>

      <div className="summary-cards">
        <div className="summary-card">
          <h4>Total Expenses</h4>
          <p>${summary.total.toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h4>Avg. Monthly</h4>
          <p>${summary.average.toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h4>Top Category</h4>
          <p>{summary.topCategory}</p>
        </div>
        <div className="summary-card">
          <h4>Peak Month</h4>
          <p>{summary.peakMonth}</p>
        </div>
        <div className="summary-card">
          <h4>Transactions</h4>
          <p>{summary.transactions}</p>
        </div>
      </div>

      <div className="charts-wrapper">
        <div className="chart-card">
          <h3>Spending Overview</h3>
          <div className="chart-toggle-buttons">
            <button
              className={chartType === 'line' ? 'active' : ''}
              onClick={() => setChartType('line')}
            >
              Line
            </button>
            <button
              className={chartType === 'pie' ? 'active' : ''}
              onClick={() => setChartType('pie')}
            >
              Pie
            </button>
            <button
              className={chartType === 'bar' ? 'active' : ''}
              onClick={() => setChartType('bar')}
            >
              Bar
            </button>
          </div>
          <div>
            {renderMainChart()}
          </div>
        </div>
      </div>

      {/* Recent Transactions with toggle */}
      <div className="recent-transactions">
        <h3>
          Recent Transactions
          <span className="view-toggle">
            <button
              className={recentView === 'list' ? 'active' : ''}
              onClick={() => setRecentView('list')}
            >
              List
            </button>
            <button
              className={recentView === 'chart' ? 'active' : ''}
              onClick={() => setRecentView('chart')}
            >
              Chart
            </button>
          </span>
        </h3>

        {recentView === 'list' ? (
          <ul>
            {recentTransactions.slice().reverse().map(({ id, title, amount, category, date }) => (
              <li key={id} className="transaction-item">
                <div className="transaction-left">
                  <span className="transaction-date">{new Date(date).toLocaleDateString()}</span>
                  <CategoryBadge category={category} />
                  <strong>{title}</strong>
                </div>
                <div className="transaction-amount">${amount.toFixed(2)}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="small-chart-wrapper">
            <Bar
              data={recentBarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        )}
      </div>

      {/* Largest Expenses with toggle */}
      <div className="largest-transactions">
        <h3>
          Top 5 Largest Expenses
          <span className="view-toggle">
            <button
              className={largestView === 'list' ? 'active' : ''}
              onClick={() => setLargestView('list')}
            >
              List
            </button>
            <button
              className={largestView === 'chart' ? 'active' : ''}
              onClick={() => setLargestView('chart')}
            >
              Chart
            </button>
          </span>
        </h3>

        {largestView === 'list' ? (
          <ul>
            {largestTransactions.map(({ id, title, amount, category, date }) => (
              <li key={id} className="transaction-item">
                <div className="transaction-left">
                  <span className="transaction-date">{new Date(date).toLocaleDateString()}</span>
                  <CategoryBadge category={category} />
                  <strong>{title}</strong>
                </div>
                <div className="transaction-amount">${amount.toFixed(2)}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="small-chart-wrapper">
            <Bar
              data={largestBarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
