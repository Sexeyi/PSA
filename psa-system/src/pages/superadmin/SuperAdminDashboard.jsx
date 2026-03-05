import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';  // Add this import

const Dashboard = ({ totalSupplies }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

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

    for (let i = 0; i < firstDay; i++) {
      days.push(<span key={`empty-${i}`} className="date empty"></span>);
    }

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

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (!user) {
    return null;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <>
      {isModalOpen && <AddNewSupply isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
      {isReportModalOpen && <GenerateReport isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />}
      {isHistoryModalOpen && <History onClose={() => setIsHistoryModalOpen(false)} />}

      <div className="dashboard">
        <div className="dashboard-header">
          <h1>{getGreeting()}, {user.fullName}!</h1>
          <p>Here's what's happening with your system today.</p>
        </div>

        <div className="dashboard-cards">
          <div className="card card-supplies">
            <div className="card-icon">📦</div>
            <div className="card-content">
              <h3>Total Supplies</h3>
              <div className="card-value">{totalSupplies || 0}</div>
              <div className="card-change positive">+12% from last month</div>
            </div>
          </div>

          <div className="card card-activities">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <h3>Recent Activities</h3>
              <div className="card-value">5</div>
              <div className="card-change">New entries today</div>
            </div>
          </div>

          {(user.role === 'Admin' || user.role === 'Approver') && (
            <div className="card card-pending">
              <div className="card-icon">⏳</div>
              <div className="card-content">
                <h3>Pending Requests</h3>
                <div className="card-value">3</div>
                <div className="card-change">Awaiting approval</div>
              </div>
            </div>
          )}

          <div className="card card-alerts">
            <div className="card-icon">⚠️</div>
            <div className="card-content">
              <h3>Low Stock Alerts</h3>
              <div className="card-value">2</div>
              <div className="card-change">Items need restocking</div>
            </div>
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