const QRCode = require("qrcode");

// ==========================================
// GENERATE BOOKING QR CODE
// ==========================================

const generateBookingQR = async ({
  bookingId,
  eventId,
  eventName,
  seatNumber,
  userEmail,
  amount,
}) => {
  const bookingData = {
    bookingId,
    eventId,
    eventName,
    seatNumber,
    userEmail,
    amount,
  };

  const qrCodeDataUrl = await QRCode.toDataURL(
    JSON.stringify(bookingData),
    {
      width: 300,
      margin: 2,
    }
  );

  return qrCodeDataUrl;
};

module.exports = {
  generateBookingQR,
};