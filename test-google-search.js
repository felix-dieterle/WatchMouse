const axios = require('axios');

const API_KEY = 'c154687e8c5ba3a56eb7c3e16a88c372f37a0201880a4a67dcbc67d88f6b2662';

async function testSearch(query) {
  const url = 'https://serpapi.com/search';
  
  try {
    const response = await axios.get(url, {
      params: {
        api_key: API_KEY,
        q: `${query} site:kleinanzeigen.de`,
        num: 10,
        gl: 'de',
        hl: 'de',
        engine: 'google'
      }
    });

    console.log(`\n=== Suche: "${query}" ===\n`);
    
    if (response.data.organic_results) {
      response.data.organic_results.forEach((item, i) => {
        console.log(`${i + 1}. ${item.title}`);
        console.log(`   ${item.link}`);
        if (item.snippet) {
          console.log(`   ${item.snippet.substring(0, 150)}...`);
        }
        console.log('');
      });
      console.log(`Gefunden: ${response.data.organic_results.length} Ergebnisse`);
    } else {
      console.log('Keine Ergebnisse gefunden');
      console.log(response.data);
    }
  } catch (error) {
    console.error('Fehler:', error.response?.data || error.message);
  }
}

testSearch('iPhone 14');
