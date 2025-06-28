// Import necessary modules
const express = require('express');
const fetch = require('node-fetch').default; // Import node-fetch for making HTTP requests

// Initialize Express app
const app = express();
const port = 3001; // Port for the backend server

// Global variable to store fetched exchange rates
// This will hold either Forex or Crypto data based on the last fetch
let exchangeRatesData = {};

// Variable to keep track of the currently loaded data type (forex or crypto)
let currentDataType = 'forex';

/**
 * Fetches exchange rates from external APIs based on the specified type.
 * Populates the `exchangeRatesData` object with the fetched rates.
 * @param {string} type - The type of exchange rates to fetch ('forex' or 'crypto').
 */
async function fetchExchangeRates(type = 'forex') {
  let apiUrl; // API endpoint URL
  let dataKey; // Key to access the rates data in the API response

  // Determine API URL and data key based on the type
  if (type === 'forex') {
    apiUrl = 'https://open.er-api.com/v6/latest/USD'; // Forex API for USD base rates
    dataKey = 'rates';
  } else if (type === 'crypto') {
    apiUrl = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/btc.json'; // Crypto API for BTC base rates
    dataKey = 'btc';
  } else {
    console.error('Invalid exchange rate type:', type);
    return;
  }

  try {
    // Fetch data from the chosen API
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Process the fetched data if valid
    if (data && data[dataKey]) {
      exchangeRatesData = {}; // Clear previous data
      // Determine the base currency for cross-rate calculation
      const baseCurrency = type === 'forex' ? data.base_code : Object.keys(data[dataKey])[0];

      // Calculate cross-currency rates to create a comprehensive exchangeRatesData object
      for (const currency1 in data[dataKey]) {
        for (const currency2 in data[dataKey]) {
          if (currency1 === currency2) continue; // Skip same currency pairs
          const rate1 = data[dataKey][currency1];
          const rate2 = data[dataKey][currency2];
          const crossRate = rate2 / rate1; // Calculate cross rate

          // Store the cross rate, ensuring currency codes are uppercase
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

// Initial data fetch on server start (Forex by default)
fetchExchangeRates('forex');
// Set interval to fetch data periodically (every 5 minutes)
setInterval(() => fetchExchangeRates('forex'), 5 * 60 * 1000); // Fetches forex data every 5 minutes

/**
 * Recursively finds arbitrage opportunities in the exchange rates.
 * @param {string} startCurrency - The currency to start the trading path from.
 * @param {number} maxSteps - The maximum number of trades in a path.
 * @param {string[]} currentPath - The current trading path (array of currency symbols).
 * @param {number} currentProfit - The current accumulated profit ratio.
 * @returns {Array<Object>} An array of found arbitrage opportunities.
 */
function findArbitrage(startCurrency, maxSteps, currentPath, currentProfit) {
  const lastCurrency = currentPath[currentPath.length - 1];

  // Base case 1: If a cycle is completed and profitable
  if (currentPath.length > 1 && lastCurrency === startCurrency && currentProfit > 1) {
    return [{ path: currentPath, profit: currentProfit }];
  }

  // Base case 2: If max steps are reached without a profitable cycle
  if (currentPath.length >= maxSteps) {
    return [];
  }

  let opportunities = [];
  // Explore all possible next currencies from the last currency in the path
  if (exchangeRatesData[lastCurrency]) {
    for (const nextCurrency in exchangeRatesData[lastCurrency]) {
      const exchangeRate = exchangeRatesData[lastCurrency][nextCurrency];
      // Avoid immediate back-and-forth trading (e.g., USD -> SGD -> USD) to prevent infinite loops
      if (currentPath.length > 1 && nextCurrency === currentPath[currentPath.length - 2]) {
        continue;
      }
      // Log the current currency comparison for debugging/tracking
      console.log(`Checking: ${lastCurrency} -> ${nextCurrency} (Rate: ${exchangeRate.toFixed(4)}) from path: ${currentPath.join(' -> ')}`);
      const newProfit = currentProfit * exchangeRate;
      // Recursively call findArbitrage with the new path and profit
      opportunities = opportunities.concat(findArbitrage(startCurrency, maxSteps, [...currentPath, nextCurrency], newProfit));
    }
  }
  return opportunities;
}

// API endpoint for finding arbitrage opportunities
app.get('/api', async (req, res) => {
  // Parse request parameters
  const startCurrency = req.query.startCurrency ? req.query.startCurrency.toUpperCase() : 'USD';
  const maxSteps = parseInt(req.query.maxSteps) || 3;
  const type = req.query.type || 'forex';

  // Fetch data for the requested type if no data is loaded or if the type has changed
  if (Object.keys(exchangeRatesData).length === 0 || (req.query.type && req.query.type !== currentDataType)) {
    await fetchExchangeRates(type);
    currentDataType = type; // Update the current data type being used
  }

  // Check if the start currency exists in the loaded data
  if (!exchangeRatesData[startCurrency]) {
    return res.status(400).json({ error: `Start currency ${startCurrency} not found in ${type} data.` });
  }

  // Find arbitrage results
  const results = findArbitrage(startCurrency, maxSteps, [startCurrency], 1);
  res.json(results);
});

// API endpoint for getting available currencies
app.get('/api/currencies', async (req, res) => {
  const type = req.query.type || 'forex';

  // Fetch data for the requested type if no data is loaded or if the type has changed
  if (Object.keys(exchangeRatesData).length === 0 || type !== currentDataType) {
    await fetchExchangeRates(type);
    currentDataType = type;
  }

  // Return the keys (currency symbols) from the loaded exchange rates data
  if (exchangeRatesData) {
    res.json(Object.keys(exchangeRatesData));
  } else {
    res.status(500).json({ error: 'Currency data not available.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});