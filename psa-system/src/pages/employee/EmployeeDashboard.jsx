import React, { useEffect, useMemo, useState } from "react";
import "./EmployeeDashboard.css";

const daysAgoLabel = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const diff = Math.floor((today - d) / 86400000);

    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return `${diff}d ago`;
};

export default function EmployeeDashboard() {

    const [requisitions, setRequisitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [showProfile, setShowProfile] = useState(false);
    const [calDate, setCalDate] = useState(new Date());

    // FETCH FROM DATABASE
    useEffect(() => {
        fetchRequisitions();
    }, []);

    const fetchRequisitions = async () => {
        try {

            const token = localStorage.getItem("token");

            const response = await fetch("http://localhost:5000/api/requisitions", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Failed to fetch requisitions");

            const data = await response.json();

            setRequisitions(Array.isArray(data) ? data : []);

        } catch (error) {
            console.error("Fetch requisitions error:", error);
        } finally {
            setLoading(false);
        }
    };

    // STATS
    const stats = useMemo(() => ({
        total: requisitions.length,
        pending: requisitions.filter(r => r.status === "Pending").length,
        approved: requisitions.filter(r => r.status === "Approved").length,
        rejected: requisitions.filter(r => r.status === "Rejected").length,
    }), [requisitions]);

    // FILTER
    const filtered = useMemo(() =>
        filter === "All"
            ? requisitions
            : requisitions.filter(r => r.status === filter),
        [filter, requisitions]
    );

    // CALENDAR FUNCTIONS
    const getDaysInMonth = d => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const getFirstDay = d => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

    const renderCal = () => {

        const daysInMonth = getDaysInMonth(calDate);
        const firstDay = getFirstDay(calDate);

        const days = [];
        const today = new Date();

        const prevDays = new Date(calDate.getFullYear(), calDate.getMonth(), 0).getDate();

        for (let i = firstDay - 1; i >= 0; i--) {
            days.push(
                <div key={`p${i}`} className="cal-day other">
                    {prevDays - i}
                </div>
            );
        }

        for (let i = 1; i <= daysInMonth; i++) {

            const ds =
                `${calDate.getFullYear()}-${String(calDate.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;

            const hasEvent = requisitions.some(
                r => r.createdAt?.slice(0, 10) === ds
            );

            const isToday =
                today.getDate() === i &&
                today.getMonth() === calDate.getMonth() &&
                today.getFullYear() === calDate.getFullYear();

            let dayClass = "cal-day";

            if (isToday) dayClass += " today";
            else if (hasEvent) dayClass += " has-event";

            days.push(
                <div key={i} className={dayClass}>
                    {i}
                    {hasEvent && !isToday && <div className="cal-dot" />}
                </div>
            );
        }

        const rem = 42 - days.length;

        for (let i = 1; i <= rem; i++) {
            days.push(
                <div key={`n${i}`} className="cal-day other">
                    {i}
                </div>
            );
        }

        return days;
    };

    const badgeClass = s => `badge ${s?.toLowerCase()}`;
    const priorityClass = s => `priority ${s?.toLowerCase()}`;

    if (loading) {
        return <div className="loading-spinner">Loading dashboard...</div>;
    }

    return (
        <div className="db-wrap">

            <main className="db-main">

                <div className="db-page-title">Your Request Hub</div>
                <div className="db-page-sub">
                    Track your requisitions and activity
                </div>

                {/* STATS */}
                <div className="stats-grid">

                    {[
                        { type: "pending", label: "Open · Pending", value: stats.pending },
                        { type: "approved", label: "Approved", value: stats.approved },
                        { type: "rejected", label: "Rejected", value: stats.rejected },
                    ].map(({ type, label, value }) => (

                        <div key={type} className={`stat-card ${type}`}>

                            <div className="stat-label">{label}</div>

                            <div className={`stat-value ${type}`}>
                                {value}
                            </div>

                            <div className="stat-bar-wrap">
                                <div
                                    className={`stat-bar ${type}`}
                                    style={{
                                        width: `${stats.total ? (value / stats.total) * 100 : 0}%`
                                    }}
                                />
                            </div>

                            <div className="stat-fraction">
                                {value} of {stats.total} total
                            </div>

                        </div>

                    ))}

                </div>

                {/* RECENT ACTIVITY */}
                <div className="card">

                    <div className="section-header">

                        <span className="section-title">
                            <span className="section-title-icon">🕐</span>
                            Recent Activity
                        </span>

                        <div className="chips-container">

                            {["All", "Pending", "Approved", "Rejected"].map(s => (

                                <button
                                    key={s}
                                    className={`chip ${filter === s ? "active" : ""}`}
                                    onClick={() => setFilter(s)}
                                >
                                    {s}
                                </button>

                            ))}

                        </div>

                    </div>

                    <div className="table-wrapper">

                        <table className="req-table">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Created</th>
                                </tr>
                            </thead>

                            <tbody>

                                {filtered.map(r => (

                                    <tr key={r._id}>

                                        <td>
                                            <span className="id-tag">
                                                {r.requestNumber || r._id}
                                            </span>
                                        </td>

                                        <td style={{ maxWidth: 280, fontWeight: 500 }}>
                                            {r.title || r.itemName}
                                        </td>

                                        <td>
                                            <span className={badgeClass(r.status)}>
                                                {r.status}
                                            </span>
                                        </td>

                                        <td>
                                            <span className={priorityClass(r.priority)}>
                                                {r.priority}
                                            </span>
                                        </td>

                                        <td
                                            style={{
                                                color: "var(--text-muted)",
                                                fontFamily: "'DM Mono', monospace",
                                                fontSize: 12
                                            }}
                                        >
                                            {daysAgoLabel(r.createdAt)}
                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                </div>

                {/* CALENDAR */}
                <div className="card">

                    <div className="cal-nav">

                        <button
                            className="cal-btn"
                            onClick={() =>
                                setCalDate(
                                    new Date(
                                        calDate.getFullYear(),
                                        calDate.getMonth() - 1,
                                        1
                                    )
                                )
                            }
                        >
                            ‹
                        </button>

                        <span className="cal-month">
                            {calDate.toLocaleString("default", {
                                month: "long",
                                year: "numeric"
                            })}
                        </span>

                        <button
                            className="cal-btn"
                            onClick={() =>
                                setCalDate(
                                    new Date(
                                        calDate.getFullYear(),
                                        calDate.getMonth() + 1,
                                        1
                                    )
                                )
                            }
                        >
                            ›
                        </button>

                    </div>

                    <div className="cal-grid">

                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
                            <div key={i} className="cal-header-day">
                                {d}
                            </div>
                        ))}

                        {renderCal()}

                    </div>

                </div>

            </main>

        </div>
    );
}