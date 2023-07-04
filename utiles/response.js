export const RESPONSE = (res, status, data, message = "") => {
  if (status === 200) {
    res.status(200).json({
      ...data,
      success: true,
      message,
    });
  } else {
    
    res.status(status).json({
      success: false,
      message,
    });
  }
};
