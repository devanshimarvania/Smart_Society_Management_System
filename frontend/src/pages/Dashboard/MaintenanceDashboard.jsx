import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import dashboardService from "../../services/dashboardService";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import Spinner from "../../components/Spinner";

const MaintenanceDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardService.getMaintenanceDashboard();
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

  const { stats, assignedComplaints } = data;

  return (
    <div>
      <h4 className="mb-3">My Work Queue</h4>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4">
          <StatCard icon="bi-clipboard-data" label="Total Assigned" value={stats.totalAssigned} color="indigo" />
        </div>
        <div className="col-6 col-md-4">
          <StatCard icon="bi-tools" label="Pending Work" value={stats.pendingWork} color="amber" />
        </div>
        <div className="col-6 col-md-4">
          <StatCard icon="bi-check-circle" label="Completed" value={stats.completedWork} color="teal" />
        </div>
      </div>

      <div className="section-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">Active Assignments</h6>
          <Link to="/maintenance/complaints" className="small text-decoration-none">View all</Link>
        </div>
        {assignedComplaints.length === 0 ? (
          <p className="text-muted small">No active assignments. Nice work!</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern align-middle">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Flat</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assignedComplaints.map((c) => (
                  <tr key={c._id}>
                    <td>{c.title}</td>
                    <td className="text-capitalize">{c.category}</td>
                    <td>{c.flat?.block}-{c.flat?.flatNumber}</td>
                    <td className="text-capitalize">{c.priority}</td>
                    <td><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceDashboard;
