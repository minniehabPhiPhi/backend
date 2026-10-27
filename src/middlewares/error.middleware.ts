import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (error.name === "UnauthorizedError") {
    res.status(error.status).json({ message: error.message });
    return;
  }
  const status = error.status >= 400 && error.status < 600 ? error.status : 500;
  if (status === 500) {
    // แสดงสาเหตุจริงใน log (เช่น Render Logs) แต่ยังตอบ client แบบเดิม
    console.error(`[${_req.method} ${_req.originalUrl}]`, error);
  }
  res.status(status).json({ error: status === 500 ? "Internal server error" : error.message });
};
