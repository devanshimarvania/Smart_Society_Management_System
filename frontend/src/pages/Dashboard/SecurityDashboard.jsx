import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import dashboardService from "../../services/dashboardService";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import Spinner from "../../components/Spinner";

const SecurityDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardService.getSecurityDashboard();
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

  const { stats, recentVisitors } = data;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Gate Activity</h4>
        <Link to="/security/visitors" className="btn btn-primary btn-sm">
          <i className="bi bi-plus-lg me-1"></i> New Visitor Entry
        </Link>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <StatCard icon="bi-person-walking" label="Visitors Today" value={stats.visitorsToday} color="indigo" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-door-open" label="Currently Inside" value={stats.visitorsInside} color="teal" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-hourglass-split" label="Pending Approvals" value={stats.pendingApprovals} color="amber" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-box-seam" label="Deliveries Today" value={stats.deliveriesToday} color="sky" />
        </div>
      </div>

      <div className="section-card">
        <h6 className="mb-3">Recent Visitor Activity</h6>
        {recentVisitors.length === 0 ? (
          <p className="text-muted small">No visitor activity yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Purpose</th>
                  <th>Visiting</th>
                  <th>Approval</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentVisitors.map((v) => (
                  <tr key={v._id}>
                    <td>{v.name}</td>
                    <td className="text-capitalize">{v.purpose}</td>
                    <td>{v.visitingFlat?.block}-{v.visitingFlat?.flatNumber}</td>
                    <td><StatusBadge status={v.approvalStatus} /></td>
                    <td><StatusBadge status={v.status} /></td>
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

export default SecurityDashboard;
