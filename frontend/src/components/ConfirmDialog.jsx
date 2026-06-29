import Modal from "./Modal";

const ConfirmDialog = ({ show, title, message, onConfirm, onCancel, confirmLabel = "Delete", confirmVariant = "danger" }) => {
  return (
    <Modal show={show} onClose={onCancel} title={title || "Confirm Action"}>
      <p className="mb-4">{message}</p>
      <div className="d-flex justify-content-end gap-2">
        <button className="btn btn-light" onClick={onCancel}>
          Cancel
        </button>
        <button className={`btn btn-${confirmVariant}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
