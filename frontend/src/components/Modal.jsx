// Lightweight Bootstrap-styled modal, controlled entirely via props
// (no Bootstrap JS bundle dependency - avoids needing bootstrap.bundle.js)
const Modal = ({ show, onClose, title, children, size = "" }) => {
  if (!show) return null;

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ background: "rgba(0,0,0,0.5)" }}
      >
        <div className={`modal-dialog ${size} modal-dialog-centered`}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
