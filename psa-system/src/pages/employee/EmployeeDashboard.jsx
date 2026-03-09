import React, { useMemo, useState } from "react";
import "./EmployeeDashboard.css";

const demoRequisitions = [
    { id: "RQ-1007", title: "Ballpen, black", status: "Pending", priority: "High", createdAt: "2026-03-02", neededBy: "2026-03-08" },
    { id: "RQ-1006", title: "Ballpen, red, retractable", status: "Approved", priority: "Medium", createdAt: "2026-02-28", neededBy: "2026-03-20" },
    { id: "RQ-1005", title: "Certificate Holder Paper Board with plastic, A4 size", status: "Rejected", priority: "Low", createdAt: "2026-02-25", neededBy: "2026-02-27" },
    { id: "RQ-1004", title: "Envelope, Brown 229mm × 324mm (A4)", status: "Rejected", priority: "Low", createdAt: "2026-02-15", neededBy: "2026-04-10" },
    { id: "RQ-1003", title: "Envelope, Documentary, legal", status: "Pending", priority: "Urgent", createdAt: "2026-03-02", neededBy: "2026-03-05" },
];

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

export default function Dashboard() {
    const [filter, setFilter] = useState("All");
    const [showProfile, setShowProfile] = useState(false);
    const [calDate, setCalDate] = useState(new Date());

    const stats = useMemo(() => ({
        total: demoRequisitions.length,
        pending: demoRequisitions.filter(r => r.status === "Pending").length,
        approved: demoRequisitions.filter(r => r.status === "Approved").length,
        rejected: demoRequisitions.filter(r => r.status === "Rejected").length,
    }), []);

    const filtered = useMemo(() =>
        filter === "All" ? demoRequisitions : demoRequisitions.filter(r => r.status === filter),
        [filter]
    );

    const dueSoon = useMemo(() => {
        const now = new Date();
        const in14 = new Date();
        in14.setDate(now.getDate() + 14);
        return demoRequisitions
            .filter(r => r.status !== "Rejected" && new Date(r.neededBy) >= now && new Date(r.neededBy) <= in14)
            .sort((a, b) => new Date(a.neededBy) - new Date(b.neededBy));
    }, []);

    const myTasks = useMemo(() => demoRequisitions.filter(r => r.status === "Pending"), []);

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
                <div key={`p${i}`} className="cal-day other">{prevDays - i}</div>
            );
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const ds = `${calDate.getFullYear()}-${String(calDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const hasEvent = demoRequisitions.some(r => r.neededBy === ds || r.createdAt === ds);
            const isToday = today.getDate() === i && today.getMonth() === calDate.getMonth() && today.getFullYear() === calDate.getFullYear();

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
            days.push(<div key={`n${i}`} className="cal-day other">{i}</div>);
        }
        return days;
    };

    const badgeClass = s => `badge ${s.toLowerCase()}`;
    const priorityClass = s => `priority ${s.toLowerCase()}`;

    return (
        <div className="db-wrap">
            <main className="db-main">
                <div className="db-page-title">Your Request Hub</div>
                <div className="db-page-sub">Track your requisitions, due dates, and pending actions</div>

                {/* Stats */}
                <div className="stats-grid">
                    {[
                        { type: 'pending', label: 'Open · Pending', value: stats.pending },
                        { type: 'approved', label: 'Approved', value: stats.approved },
                        { type: 'rejected', label: 'Rejected', value: stats.rejected },
                    ].map(({ type, label, value }) => (
                        <div key={type} className={`stat-card ${type}`}>
                            <div className="stat-label">{label}</div>
                            <div className={`stat-value ${type}`}>{value}</div>
                            <div className="stat-bar-wrap">
                                <div
                                    className={`stat-bar ${type}`}
                                    style={{ width: `${stats.total ? (value / stats.total) * 100 : 0}%` }}
                                />
                            </div>
                            <div className="stat-fraction">{value} of {stats.total} total</div>
                        </div>
                    ))}
                </div>

                {/* Recent Activity */}
                <div className="card">
                    <div className="section-header">
                        <span className="section-title">
                            <span className="section-title-icon">🕐</span> Recent Activity
                        </span>
                        <div className="chips-container">
                            {["All", "Pending", "Approved", "Rejected"].map(s => (
                                <button
                                    key={s}
                                    className={`chip${filter === s ? ' active' : ''}`}
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
                                    <tr key={r.id}>
                                        <td><span className="id-tag">{r.id}</span></td>
                                        <td style={{ maxWidth: 280, fontWeight: 500 }}>{r.title}</td>
                                        <td><span className={badgeClass(r.status)}>{r.status}</span></td>
                                        <td><span className={priorityClass(r.priority)}>{r.priority}</span></td>
                                        <td style={{ color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                                            {daysAgoLabel(r.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="two-col">
                    {/* Tasks Column */}
                    <div className="col">
                        <div className="card">
                            <div className="section-header" style={{ marginBottom: 12 }}>
                                <span className="section-title">
                                    <span className="section-title-icon">✅</span> My Tasks
                                </span>
                                <span className="badge pending">{myTasks.length} pending</span>
                            </div>
                            {myTasks.length === 0 ? (
                                <div className="empty-state">No pending tasks. You're all caught up!</div>
                            ) : (
                                <div className="task-list">
                                    {myTasks.map(t => (
                                        <div key={t.id} className="task-item">
                                            <div className="task-check" />
                                            <div className="task-body">
                                                <div className="task-name">{t.title}</div>
                                                <div className="task-meta">
                                                    <span className="id-tag" style={{ fontSize: 10 }}>{t.id}</span>
                                                    &nbsp;· Needed by {t.neededBy}
                                                </div>
                                            </div>
                                            <span className={priorityClass(t.priority)}>{t.priority}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Calendar + Due Soon Column */}
                    <div className="col">
                        <div className="card">
                            <div className="cal-nav">
                                <button
                                    className="cal-btn"
                                    onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))}
                                >
                                    ‹
                                </button>
                                <span className="cal-month">
                                    {calDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </span>
                                <button
                                    className="cal-btn"
                                    onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))}
                                >
                                    ›
                                </button>
                            </div>
                            <div className="cal-grid">
                                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
                                    <div key={i} className="cal-header-day">{d}</div>
                                ))}
                                {renderCal()}
                            </div>
                        </div>

                        <div className="card">
                            <div className="section-header" style={{ marginBottom: 12 }}>
                                <span className="section-title">
                                    <span className="section-title-icon">⏰</span> Due Soon
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Next 14 days</span>
                            </div>
                            {dueSoon.length === 0 ? (
                                <div className="empty-state">No upcoming deadlines.</div>
                            ) : (
                                <div className="due-list">
                                    {dueSoon.map(d => (
                                        <div key={d.id} className="due-item">
                                            <div className="due-left">
                                                <span className="id-tag" style={{ fontSize: 10 }}>{d.id}</span>
                                                <span className="due-name">{d.title}</span>
                                            </div>
                                            <span className="due-date">{d.neededBy}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Profile Modal */}
            {showProfile && (
                <div className="modal-overlay" onClick={() => setShowProfile(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">Profile Settings</div>
                            <button className="modal-close" onClick={() => setShowProfile(false)}>×</button>
                        </div>
                        <div className="modal-divider" />
                        <div className="modal-body">
                            {[
                                { label: 'Full Name', value: 'Ewan Ko', type: 'text' },
                                { label: 'Email Address', value: 'ewan.ko@psa.com.ph', type: 'email' },
                                { label: 'Role', value: 'Requester', type: 'text', disabled: true },
                                { label: 'Department', value: 'Admin and Finance Unit', type: 'text' },
                                { label: 'Phone Number', value: '+63 912 345 6789', type: 'tel' },
                            ].map(f => (
                                <div key={f.label} className="form-group">
                                    <label className="form-label">{f.label}</label>
                                    <input
                                        className="form-input"
                                        type={f.type}
                                        defaultValue={f.value}
                                        disabled={f.disabled}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowProfile(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={() => setShowProfile(false)}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}