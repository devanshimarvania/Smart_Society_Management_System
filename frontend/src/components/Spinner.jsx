const Spinner = ({ small = false }) => {
  return (
    <div
      className={`d-flex justify-content-center align-items-center ${
        small ? "" : "py-5"
      }`}
    >
      <div
        className="spinner-border text-primary"
        style={small ? { width: "1.2rem", height: "1.2rem" } : {}}
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
};

export default Spinner;
