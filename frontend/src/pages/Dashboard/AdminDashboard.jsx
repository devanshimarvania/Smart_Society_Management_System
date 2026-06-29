import { useEffect, useState } from "react";
import { Line, Doughnut } from "react-chartjs-2";
import "../../chartSetup";
import dashboardService from "../../services/dashboardService";
import StatCard from "../../components/StatCard";
import Spinner from "../../components/Spinner";

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardService.getAdminDashboard();
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

  const { stats, charts, recentActivity } = data;

  const revenueLineData = {
    labels: charts.revenueTrend.map((r) => r._id),
    datasets: [
      {
        label: "Revenue (₹)",
        data: charts.revenueTrend.map((r) => r.total),
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79,70,229,0.15)",
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const complaintsDoughnutData = {
    labels: charts.complaintsByCategory.map((c) => c._id),
    datasets: [
      {
        data: charts.complaintsByCategory.map((c) => c.count),
        backgroundColor: [
          "#4f46e5",
          "#14b8a6",
          "#f59e0b",
          "#e11d48",
          "#8b5cf6",
          "#0ea5e9",
          "#84cc16",
          "#6b7280",
        ],
      },
    ],
  };

  return (
    <div>
      <h4 className="mb-3">Admin Dashboard</h4>

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-lg-3">
          <StatCard icon="bi-people" label="Total Residents" value={stats.totalResidents} color="indigo" />
        </div>
        <div className="col-6 col-md-4 col-lg-3">
          <StatCard icon="bi-building" label="Occupied / Total Flats" value={`${stats.occupiedFlats}/${stats.totalFlats}`} color="teal" />
        </div>
        <div className="col-6 col-md-4 col-lg-3">
          <StatCard icon="bi-person-walking" label="Visitors Today" value={stats.visitorsToday} color="sky" />
        </div>
        <div className="col-6 col-md-4 col-lg-3">
          <StatCard icon="bi-exclamation-circle" label="Pending Complaints" value={stats.pendingComplaints} color="rose" />
        </div>
        <div className="col-6 col-md-4 col-lg-3">
          <StatCard icon="bi-receipt" label="Pending Bills" value={stats.pendingBills} color="amber" />
        </div>
        <div className="col-6 col-md-4 col-lg-3">
          <StatCard icon="bi-exclamation-triangle" label="Overdue Bills" value={stats.overdueBills} color="rose" />
        </div>
        <div className="col-6 col-md-4 col-lg-3">
          <StatCard icon="bi-calendar-check" label="Pending Bookings" value={stats.pendingBookings} color="violet" />
        </div>
        <div className="col-6 col-md-4 col-lg-3">
          <StatCard icon="bi-cash-coin" label="Revenue This Month" value={`₹${stats.totalRevenueThisMonth}`} color="teal" />
        </div>
      </div>

      {/* Charts */}
      <div className="row g-3 mb-4">
        <div className="col-lg-7">
          <div className="section-card h-100">
            <h6 className="mb-3">Revenue Trend (Last 6 Months)</h6>
            {charts.revenueTrend.length === 0 ? (
              <p className="text-muted small">No payment data yet.</p>
            ) : (
              <Line data={revenueLineData} />
            )}
          </div>
        </div>
        <div className="col-lg-5">
          <div className="section-card h-100">
            <h6 className="mb-3">Complaints by Category</h6>
            {charts.complaintsByCategory.length === 0 ? (
              <p className="text-muted small">No complaints yet.</p>
            ) : (
              <Doughnut data={complaintsDoughnutData} />
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="row g-3">
        <div className="col-lg-6">
          <div className="section-card h-100">
            <h6 className="mb-3">Recent Complaints</h6>
            {recentActivity.complaints.length === 0 ? (
              <p className="text-muted small">No recent complaints.</p>
            ) : (
              <ul className="list-group list-group-flush">
                {recentActivity.complaints.map((c) => (
                  <li key={c._id} className="list-group-item px-0">
                    <div className="d-flex justify-content-between">
                      <span className="small">{c.title}</span>
                      <span className="badge bg-light text-dark text-capitalize">{c.status}</span>
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                      {c.raisedBy?.user?.name} • {c.category}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="col-lg-6">
          <div className="section-card h-100">
            <h6 className="mb-3">Recent Visitors</h6>
            {recentActivity.visitors.length === 0 ? (
              <p className="text-muted small">No recent visitors.</p>
            ) : (
              <ul className="list-group list-group-flush">
                {recentActivity.visitors.map((v) => (
                  <li key={v._id} className="list-group-item px-0">
                    <div className="d-flex justify-content-between">
                      <span className="small">{v.name}</span>
                      <span className="badge bg-light text-dark text-capitalize">{v.approvalStatus}</span>
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                      {v.purpose} • Flat {v.visitingFlat?.block}-{v.visitingFlat?.flatNumber}
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

export default AdminDashboard;
