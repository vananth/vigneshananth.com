// Stock Tracker JavaScript
// Using mock data for now - will connect to API later

// Mock data storage (will be replaced with API calls)
let holdings = [
  {
    ticker: 'NVDA',
    dateAdded: '2024-01-15',
    amountInvested: 1000,
    purchasePrice: 495.22,
    shares: 2.019,
    currentPrice: 875.28,
    currentValue: 1767.44,
    gainLoss: 767.44,
    returnPercent: 76.74
  },
  {
    ticker: 'TSLA',
    dateAdded: '2024-03-20',
    amountInvested: 1500,
    purchasePrice: 175.50,
    shares: 8.547,
    currentPrice: 242.84,
    currentValue: 2075.95,
    gainLoss: 575.95,
    returnPercent: 38.40
  },
  {
    ticker: 'PLTR',
    dateAdded: '2024-06-10',
    amountInvested: 800,
    purchasePrice: 23.45,
    shares: 34.117,
    currentPrice: 38.76,
    currentValue: 1322.37,
    gainLoss: 522.37,
    returnPercent: 65.30
  }
];

// Generate mock daily data for the past 5 years
function generateMockDailyData() {
  const data = { dates: [], portfolio: [], sp500: [] };
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 5);

  let portfolioValue = 100;
  let sp500Value = 100;

  for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    data.dates.push(new Date(d));

    // Simulate daily returns (portfolio more volatile)
    const portfolioChange = (Math.random() - 0.48) * 2; // Slight upward bias
    const sp500Change = (Math.random() - 0.49) * 1.5; // More stable, slight upward bias

    portfolioValue *= (1 + portfolioChange / 100);
    sp500Value *= (1 + sp500Change / 100);

    data.portfolio.push(portfolioValue);
    data.sp500.push(sp500Value);
  }

  return data;
}

const fullHistoricalData = generateMockDailyData();
let currentTimeRange = 'ALL';

// Chart instance
let performanceChart = null;

// Aggregate data by period (daily, weekly, monthly)
function aggregateData(data, period) {
  if (period === 'daily') return data;

  const aggregated = { dates: [], portfolio: [], sp500: [] };
  let currentPeriod = null;
  let periodData = { portfolio: [], sp500: [], lastDate: null };

  for (let i = 0; i < data.dates.length; i++) {
    const date = data.dates[i];
    let periodKey;

    if (period === 'weekly') {
      // Group by week (use Monday as start of week)
      const weekStart = new Date(date);
      const day = weekStart.getDay();
      const diff = (day === 0 ? -6 : 1) - day; // Adjust to Monday
      weekStart.setDate(weekStart.getDate() + diff);
      periodKey = weekStart.toISOString().split('T')[0];
    } else if (period === 'monthly') {
      // Group by month
      periodKey = `${date.getFullYear()}-${date.getMonth()}`;
    }

    if (periodKey !== currentPeriod) {
      // Save previous period if exists
      if (currentPeriod !== null && periodData.portfolio.length > 0) {
        aggregated.dates.push(periodData.lastDate);
        // Use last value of the period (close price)
        aggregated.portfolio.push(periodData.portfolio[periodData.portfolio.length - 1]);
        aggregated.sp500.push(periodData.sp500[periodData.sp500.length - 1]);
      }

      // Start new period
      currentPeriod = periodKey;
      periodData = { portfolio: [], sp500: [], lastDate: null };
    }

    periodData.portfolio.push(data.portfolio[i]);
    periodData.sp500.push(data.sp500[i]);
    periodData.lastDate = date;
  }

  // Add last period
  if (periodData.portfolio.length > 0) {
    aggregated.dates.push(periodData.lastDate);
    aggregated.portfolio.push(periodData.portfolio[periodData.portfolio.length - 1]);
    aggregated.sp500.push(periodData.sp500[periodData.sp500.length - 1]);
  }

  return aggregated;
}

// Filter data by time range and apply appropriate aggregation
function getFilteredData(range) {
  const now = new Date();
  let cutoffDate = new Date();
  let aggregation = 'daily';

  switch(range) {
    case '1M':
      cutoffDate.setMonth(now.getMonth() - 1);
      aggregation = 'daily';
      break;
    case '3M':
      cutoffDate.setMonth(now.getMonth() - 3);
      aggregation = 'daily';
      break;
    case '6M':
      cutoffDate.setMonth(now.getMonth() - 6);
      aggregation = 'weekly';
      break;
    case '1Y':
      cutoffDate.setFullYear(now.getFullYear() - 1);
      aggregation = 'weekly';
      break;
    case '5Y':
      cutoffDate.setFullYear(now.getFullYear() - 5);
      aggregation = 'monthly';
      break;
    case 'ALL':
    default:
      cutoffDate.setFullYear(now.getFullYear() - 5);
      aggregation = 'monthly';
      break;
  }

  const startIndex = fullHistoricalData.dates.findIndex(d => d >= cutoffDate);
  if (startIndex === -1) {
    return aggregateData(fullHistoricalData, aggregation);
  }

  const filtered = {
    dates: fullHistoricalData.dates.slice(startIndex),
    portfolio: fullHistoricalData.portfolio.slice(startIndex),
    sp500: fullHistoricalData.sp500.slice(startIndex)
  };

  return aggregateData(filtered, aggregation);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeChart();
  updateHoldingsTable();
  updateSummaryCards();
  setupTimeRangeControls();
});

function initializeChart() {
  const ctx = document.getElementById('performanceChart').getContext('2d');
  const filteredData = getFilteredData(currentTimeRange);

  performanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: filteredData.dates.map(d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })),
      datasets: [
        {
          label: 'My Portfolio',
          data: filteredData.portfolio,
          borderColor: '#0366d6',
          backgroundColor: 'rgba(3, 102, 214, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          label: 'S&P 500',
          data: filteredData.sp500,
          borderColor: '#666',
          backgroundColor: 'rgba(102, 102, 102, 0.05)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          borderDash: [5, 5]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: {
              family: 'serif',
              size: 14
            },
            usePointStyle: true,
            padding: 15
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += context.parsed.y.toFixed(1) + '%';
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return value + '%';
            },
            font: {
              family: 'serif'
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: {
            font: {
              family: 'serif'
            }
          },
          grid: {
            display: false
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });
}

function updateHoldingsTable() {
  const tableBody = document.getElementById('holdingsTableBody');

  if (holdings.length === 0) {
    tableBody.innerHTML = `
      <tr class="no-data">
        <td colspan="3">No holdings yet.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = holdings.map(holding => {
    const isPositive = holding.returnPercent >= 0;
    const changeClass = isPositive ? 'positive' : 'negative';
    const changeSymbol = isPositive ? '+' : '';

    return `
      <tr>
        <td class="ticker-cell">${holding.ticker}</td>
        <td>${formatDate(holding.dateAdded)}</td>
        <td class="${changeClass}">${changeSymbol}${holding.returnPercent.toFixed(2)}%</td>
      </tr>
    `;
  }).join('');
}

function setupTimeRangeControls() {
  const buttons = document.querySelectorAll('.time-range-btn');

  buttons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      buttons.forEach(btn => btn.classList.remove('active'));

      // Add active class to clicked button
      this.classList.add('active');

      // Update current time range
      currentTimeRange = this.getAttribute('data-range');

      // Update chart with filtered data
      updateChart(currentTimeRange);

      // Update summary cards
      updateSummaryCards();
    });
  });
}

function updateChart(range) {
  const filteredData = getFilteredData(range);

  // Update chart data
  performanceChart.data.labels = filteredData.dates.map(d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  performanceChart.data.datasets[0].data = filteredData.portfolio;
  performanceChart.data.datasets[1].data = filteredData.sp500;

  // Re-render chart
  performanceChart.update();
}

function updateSummaryCards() {
  // Get the latest values from the current filtered data
  const filteredData = getFilteredData(currentTimeRange);
  const latestPortfolioValue = filteredData.portfolio[filteredData.portfolio.length - 1];
  const latestSP500Value = filteredData.sp500[filteredData.sp500.length - 1];

  // Calculate returns (since we normalized to 100, the value directly represents percentage)
  const portfolioReturnPercent = latestPortfolioValue - 100;
  const sp500ReturnPercent = latestSP500Value - 100;
  const differencePercent = portfolioReturnPercent - sp500ReturnPercent;

  // Update portfolio card
  document.getElementById('portfolioChange').textContent = `${portfolioReturnPercent >= 0 ? '+' : ''}${portfolioReturnPercent.toFixed(1)}%`;
  document.getElementById('portfolioChange').className = `summary-value ${portfolioReturnPercent >= 0 ? 'positive' : 'negative'}`;

  // Update S&P 500 card
  document.getElementById('sp500Change').textContent = `${sp500ReturnPercent >= 0 ? '+' : ''}${sp500ReturnPercent.toFixed(1)}%`;
  document.getElementById('sp500Change').className = `summary-value ${sp500ReturnPercent >= 0 ? 'positive' : 'negative'}`;

  // Update difference card
  document.getElementById('differencePercent').textContent = `${differencePercent >= 0 ? '+' : ''}${differencePercent.toFixed(1)}%`;
  document.getElementById('differencePercent').className = `summary-value ${differencePercent >= 0 ? 'positive' : 'negative'}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
