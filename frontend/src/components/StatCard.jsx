const StatCard = ({ icon, label, value, color = "indigo" }) => {
  return (
    <div className={`stat-card bg-${color}`}>
      <div className="d-flex justify-content-between">
        <span className="stat-icon">
          <i className={`bi ${icon}`}></i>
        </span>
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
};

export default StatCard;
