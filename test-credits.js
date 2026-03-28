const axios = require('axios');

const API_KEY = 'c154687e8c5ba3a56eb7c3e16a88c372f37a0201880a4a67dcbc67d88f6b2662';

async function checkCredits() {
  try {
    const response = await axios.get('https://serpapi.com/account', {
      params: { api_key: API_KEY }
    });
    console.log('Account Info:', response.data);
  } catch (error) {
    console.error('Fehler:', error.response?.data || error.message);
  }
}

checkCredits();
