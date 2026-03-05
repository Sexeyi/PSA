import React, { useState } from 'react';
import AddNewSupply from './AddNewSupply';
import GenerateReport from './GenerateReport';
import History from './History';

const Dashboard = ({ totalSupplies }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const days = [];

    // Empty slots for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<span key={`empty-${i}`} className="date empty"></span>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        day === new Date().getDate() &&
        month === new Date().getMonth() &&
        year === new Date().getFullYear();

      days.push(
        <span
          key={day}
          className={`date ${isToday ? 'today' : ''}`}
        >
          {day}
        </span>
      );
    }

    return { days, monthName: monthNames[month], year };
  };

  const { days, monthName, year } = renderCalendar();

  return (
    <>
      {isModalOpen && <AddNewSupply isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
      {isReportModalOpen && <GenerateReport isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />}
      {isHistoryModalOpen && <History onClose={() => setIsHistoryModalOpen(false)} />}
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Welcome back, Ma'am Ella!</h1>
          <p>Here's what's happening with your system today.</p>
        </div>

        <div className="dashboard-cards">
          <div className="card card-supplies">
            <div className="card-icon"></div>
            <div className="card-content">
              <h3>Total Supplies</h3>
              <div className="card-value">{totalSupplies}</div>
              <div className="card-change positive">+12% from last month</div>
            </div>
          </div>
          <div className="card card-activities">
            <div className="card-icon"></div>
            <div className="card-content">
              <h3>Recent Activities</h3>
              <div className="card-value">5</div>
              <div className="card-change">New entries today</div>
            </div>
          </div>
          <div className="card card-status">
            <div className="card-icon"></div>
            <div className="card-content">
              <h3>System Status</h3>
              <div className="card-value">Online</div>
              <div className="card-change">All systems operational</div>
            </div>
          </div>
          <div className="card card-alerts">
            <div className="card-icon"></div>
            <div className="card-content">
              <h3>Low Stock Alerts</h3>
              <div className="card-value">2</div>
              <div className="card-change">Items need restocking</div>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button onClick={() => setIsModalOpen(true)}>Add New Supply</button>
            <button onClick={() => setIsReportModalOpen(true)}>Generate Report</button>
            <button onClick={() => setIsHistoryModalOpen(true)}>View History</button>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-section">
            <h2>Supply Trends</h2>
            <div className="chart-placeholder">
              <div className="chart-bar" style={{ height: '60%' }}>
                <span className="chart-percentage">60%</span>
              </div>
              <div className="chart-bar" style={{ height: '60%' }}>
                <span className="chart-percentage">60%</span>
              </div>
              <div className="chart-bar" style={{ height: '80%' }}>
                <span className="chart-percentage">80%</span>
              </div>
              <div className="chart-bar" style={{ height: '40%' }}>
                <span className="chart-percentage">40%</span>
              </div>
              <div className="chart-bar" style={{ height: '90%' }}>
                <span className="chart-percentage">90%</span>
              </div>
              <div className="chart-bar" style={{ height: '70%' }}>
                <span className="chart-percentage">70%</span>
              </div>
              <div className="chart-bar" style={{ height: '50%' }}>
                <span className="chart-percentage">50%</span>
              </div>
            </div>
          </div>

          <div className="dashboard-section">
            <h2>Calendar</h2>
            <div className="calendar-placeholder">
              <div className="calendar-header">
                <button className="calendar-nav-btn" onClick={handlePrevMonth}>{'<'}</button>
                <span className="calendar-month">{monthName} {year}</span>
                <button className="calendar-nav-btn" onClick={handleNextMonth}>{'>'}</button>
              </div>
              <div className="calendar-days">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>
              <div className="calendar-dates">
                {days}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};


export default Dashboard;
