import api from "./api";

// PDF/Excel endpoints return binary data, so we request blob responseType
// and trigger a browser download manually.
const downloadInvoicePDF = async (billId) => {
  const res = await api.get(`/reports/invoice/${billId}`, {
    responseType: "blob",
  });
  triggerDownload(res.data, `invoice-${billId}.pdf`);
};

const downloadBillsExcel = async (params) => {
  const res = await api.get("/reports/bills-excel", {
    params,
    responseType: "blob",
  });
  triggerDownload(res.data, "bills-report.xlsx");
};

const downloadComplaintsExcel = async (params) => {
  const res = await api.get("/reports/complaints-excel", {
    params,
    responseType: "blob",
  });
  triggerDownload(res.data, "complaints-report.xlsx");
};

const triggerDownload = (blobData, filename) => {
  const url = window.URL.createObjectURL(new Blob([blobData]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default {
  downloadInvoicePDF,
  downloadBillsExcel,
  downloadComplaintsExcel,
};
