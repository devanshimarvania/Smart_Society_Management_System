import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import dashboardService from "../../services/dashboardService";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import Spinner from "../../components/Spinner";

const ResidentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardService.getResidentDashboard();
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Spinner />;
  if (!data) return <p className="text-muted">Failed to load dashboard data.</p>;

  const { stats, pendingBills, upcomingBookings } = data;

  return (
    <div>
      <h4 className="mb-3">My Dashboard</h4>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-lg-2">
          <StatCard icon="bi-exclamation-circle" label="My Complaints" value={stats.myComplaints} color="indigo" />
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <StatCard icon="bi-hourglass-split" label="Open Complaints" value={stats.openComplaints} color="rose" />
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <StatCard icon="bi-receipt" label="My Bills" value={stats.myBills} color="amber" />
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <StatCard icon="bi-calendar-check" label="My Bookings" value={stats.myBookings} color="violet" />
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <StatCard icon="bi-bell" label="Unread Alerts" value={stats.unreadNotificationsCount} color="sky" />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="section-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Pending Bills</h6>
              <Link to="/resident/bills" className="small text-decoration-none">View all</Link>
            </div>
            {pendingBills.length === 0 ? (
              <p className="text-muted small">No pending bills. You're all caught up!</p>
            ) : (
              <ul className="list-group list-group-flush">
                {pendingBills.map((b) => (
                  <li key={b._id} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="small fw-semibold">{b.billMonth} — ₹{b.totalAmount}</div>
                      <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                        Due {new Date(b.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="section-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Upcoming Bookings</h6>
              <Link to="/resident/bookings" className="small text-decoration-none">View all</Link>
            </div>
            {upcomingBookings.length === 0 ? (
              <p className="text-muted small">No upcoming facility bookings.</p>
            ) : (
              <ul className="list-group list-group-flush">
                {upcomingBookings.map((b) => (
                  <li key={b._id} className="list-group-item px-0">
                    <div className="small fw-semibold">{b.facility?.name}</div>
                    <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                      {new Date(b.bookingDate).toLocaleDateString()} • {b.startTime} - {b.endTime}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;
