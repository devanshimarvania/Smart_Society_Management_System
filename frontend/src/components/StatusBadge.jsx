// Maps a status string to a Bootstrap-flavored badge color.
// Used across Complaints, Bills, Visitors, Bookings, Polls, etc.
const STATUS_COLOR_MAP = {
  // Generic
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "secondary",
  active: "success",
  inactive: "secondary",

  // Complaints
  raised: "info",
  assigned: "primary",
  "in-progress": "warning",
  completed: "success",
  closed: "secondary",
  reopened: "danger",

  // Bills
  paid: "success",
  overdue: "danger",

  // Visitors
  inside: "success",
  exited: "secondary",

  // Flats
  vacant: "secondary",
  "owner-occupied": "success",
  rented: "info",
};

const StatusBadge = ({ status }) => {
  const color = STATUS_COLOR_MAP[status] || "secondary";
  return (
    <span className={`badge-status bg-${color}-subtle text-${color} border border-${color}-subtle`}>
      {status}
    </span>
  );
};

export default StatusBadge;
