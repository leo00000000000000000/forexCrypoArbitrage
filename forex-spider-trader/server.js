const express = require('express');
const fetch = require('node-fetch').default;
const app = express();
const port = 3001;

let exchangeRatesData = {}; // Renamed from forexData

async function fetchExchangeRates(type = 'forex') {
  let apiUrl;
  let dataKey;

  if (type === 'forex') {
    apiUrl = 'https://open.er-api.com/v6/latest/USD';
    dataKey = 'rates';
  } else if (type === 'crypto') {
    apiUrl = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/btc.json';
    dataKey = 'btc';
  } else {
    console.error('Invalid exchange rate type:', type);
    return;
  }

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data && data[dataKey]) {
      exchangeRatesData = {};
      const baseCurrency = type === 'forex' ? data.base_code : Object.keys(data[dataKey])[0];

      for (const currency1 in data[dataKey]) {
        for (const currency2 in data[dataKey]) {
          if (currency1 === currency2) continue;
          const rate1 = data[dataKey][currency1];
          const rate2 = data[dataKey][currency2];
          const crossRate = rate2 / rate1;

          if (!exchangeRatesData[currency1.toUpperCase()]) {
            exchangeRatesData[currency1.toUpperCase()] = {};
          }
          exchangeRatesData[currency1.toUpperCase()][currency2.toUpperCase()] = crossRate;
        }
      }
      console.log(`${type} data updated successfully.`);
    } else {
      console.error(`Failed to fetch ${type} data: Invalid response format.`, data);
    }
  } catch (error) {
    console.error(`Error fetching ${type} data:`, error);
  }
}

// Fetch data initially and then every 5 minutes
fetchExchangeRates('forex'); // Initial fetch for forex
setInterval(() => fetchExchangeRates('forex'), 5 * 60 * 1000); // Fetch forex every 5 minutes

function findArbitrage(startCurrency, maxSteps, currentPath, currentProfit) {
  const lastCurrency = currentPath[currentPath.length - 1];

  if (currentPath.length > 1 && lastCurrency === startCurrency && currentProfit > 1) {
    return [{ path: currentPath, profit: currentProfit }];
  }

  if (currentPath.length >= maxSteps) {
    return [];
  }

  let opportunities = [];
  if (exchangeRatesData[lastCurrency]) {
    for (const nextCurrency in exchangeRatesData[lastCurrency]) {
      const exchangeRate = exchangeRatesData[lastCurrency][nextCurrency];
      // Avoid immediate back-and-forth trading (e.g., USD -> SGD -> USD)
      if (currentPath.length > 1 && nextCurrency === currentPath[currentPath.length - 2]) {
        continue;
      }
      console.log(`Checking: ${lastCurrency} -> ${nextCurrency} (Rate: ${exchangeRate.toFixed(4)}) from path: ${currentPath.join(' -> ')}`);
      const newProfit = currentProfit * exchangeRate;
      opportunities = opportunities.concat(findArbitrage(startCurrency, maxSteps, [...currentPath, nextCurrency], newProfit));
    }
  }
  return opportunities;
}

app.get('/api', async (req, res) => {
  const startCurrency = req.query.startCurrency ? req.query.startCurrency.toUpperCase() : 'USD';
  const maxSteps = parseInt(req.query.maxSteps) || 3;
  const type = req.query.type || 'forex';

  // Fetch data for the requested type if not already fetched or if it's a different type
  if (Object.keys(exchangeRatesData).length === 0 || (req.query.type && req.query.type !== currentDataType)) {
    await fetchExchangeRates(type);
    currentDataType = type; // Store the current data type being used
  }

  if (!exchangeRatesData[startCurrency]) {
    return res.status(400).json({ error: `Start currency ${startCurrency} not found in ${type} data.` });
  }

  const results = findArbitrage(startCurrency, maxSteps, [startCurrency], 1);
  res.json(results);
});

let currentDataType = 'forex'; // Initialize currentDataType

app.get('/api/currencies', async (req, res) => {
  const type = req.query.type || 'forex';

  if (Object.keys(exchangeRatesData).length === 0 || type !== currentDataType) {
    await fetchExchangeRates(type);
    currentDataType = type;
  }

  if (exchangeRatesData) {
    res.json(Object.keys(exchangeRatesData));
  } else {
    res.status(500).json({ error: 'Currency data not available.' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});