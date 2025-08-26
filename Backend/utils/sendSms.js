const axios = require('axios');

async function sendSmsYellika({ recipient, message }) {
  try {
    const response = await axios.post(
      'https://panel.yellikasms.com/api/v3/sms/send',
      {
        recipient,
        sender_id: process.env.YELLIKA_SENDER_ID, // à définir dans .env
        type: 'plain',
        message,
      },
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${process.env.YELLIKA_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error('Erreur envoi SMS:', err.response?.data || err.message);
    return null;
  }
}

module.exports = sendSmsYellika;
