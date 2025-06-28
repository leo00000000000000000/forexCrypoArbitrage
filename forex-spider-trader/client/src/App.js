// Import necessary React hooks
import React, { useState, useEffect, useRef } from 'react';
// Import the CSS file for styling
import './App.css';

function App() {
  // State variables to manage application data and UI
  const [startCurrency, setStartCurrency] = useState('USD'); // The currency to start the arbitrage path from
  const [maxSteps, setMaxSteps] = useState(3); // Maximum number of trades in a path
  const [investment, setInvestment] = useState(100); // User's investment amount
  const [results, setResults] = useState([]); // Stores the arbitrage opportunities found
  const [loading, setLoading] = useState(false); // Indicates if a fetch request is in progress
  const [tradingType, setTradingType] = useState('forex'); // Current trading type: 'forex' or 'crypto'
  const [availableCurrencies, setAvailableCurrencies] = useState([]); // List of currencies available for the selected trading type
  const abortControllerRef = useRef(null); // Ref to store AbortController for request cancellation

  // useEffect hook to fetch available currencies whenever the tradingType changes
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        // Fetch currencies from the backend based on the selected trading type
        const response = await fetch(`/api/currencies?type=${tradingType}`);
        const data = await response.json();
        setAvailableCurrencies(data); // Update the list of available currencies
        if (data.length > 0) {
          setStartCurrency(data[0]); // Set the first available currency as the default start currency
        }
      } catch (error) {
        console.error('Error fetching currencies:', error);
      }
    };
    fetchCurrencies();
  }, [tradingType]); // Dependency array: runs when tradingType changes

  // Function to fetch arbitrage opportunities from the backend
  const fetchArbitrage = () => {
    setLoading(true); // Set loading state to true
    abortControllerRef.current = new AbortController(); // Create a new AbortController
    const signal = abortControllerRef.current.signal; // Get the signal from the controller

    // Make the fetch request to the backend, including start currency, max steps, type, and abort signal
    fetch(`/api?startCurrency=${startCurrency}&maxSteps=${maxSteps}&type=${tradingType}`, { signal })
      .then(res => res.json()) // Parse the JSON response
      .then(setResults) // Update the results state with the fetched data
      .catch(error => {
        // Handle errors, specifically AbortError if the request was cancelled
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
        } else {
          console.error('Error fetching arbitrage:', error);
        }
      })
      .finally(() => setLoading(false)); // Always set loading to false when the request completes or fails
  };

  // Function to handle cancellation of the ongoing fetch request
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Abort the fetch request
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Forex/Crypto Spider Trader</h1>
        <div>
          {/* Dropdown for selecting trading type */}
          <label>
            Trading Type:
            <select value={tradingType} onChange={e => setTradingType(e.target.value)}>
              <option value="forex">Forex</option>
              <option value="crypto">Crypto</option>
            </select>
          </label>
          {/* Input/Dropdown for Start Currency, changes based on tradingType */}
          <label>
            Start Currency:
            {tradingType === 'forex' ? (
              // Text input for Forex (allows manual entry)
              <input type="text" value={startCurrency} onChange={e => setStartCurrency(e.target.value.toUpperCase())} />
            ) : (
              // Dropdown for Crypto (populated from availableCurrencies)
              <select value={startCurrency} onChange={e => setStartCurrency(e.target.value)}>
                {availableCurrencies.map(currency => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            )}
          </label>
          {/* Input for Max Steps */}
          <label>
            Max Steps:
            <input type="number" value={maxSteps} onChange={e => setMaxSteps(parseInt(e.target.value))} />
          </label>
          {/* Input for Investment Amount */}
          <label>
            Investment Amount:
            <input type="number" value={investment} onChange={e => setInvestment(parseFloat(e.target.value))} />
          </label>
          {/* Button to trigger arbitrage calculation, disabled when loading */}
          <button onClick={fetchArbitrage} disabled={loading}>Find Arbitrage</button>
          {/* Cancel button, shown only when loading */}
          {loading && <button onClick={handleCancel}>Cancel</button>}
        </div>
        <div>
          <h2>Arbitrage Paths (Text Visualization):</h2>
          {/* Conditional rendering for loading spinner, no opportunities message, or results list */}
          {loading ? (
            <div className="spinner"></div> // Spinner displayed when loading
          ) : results.length === 0 ? (
            <p>No arbitrage opportunities found.</p> // Message when no results
          ) : (
            <ul>
              {results.map((result, index) => (
                <li key={index}>
                  Path: {result.path.join(' -> ')} | Profit: {result.profit.toFixed(4)} | Potential Gain: {(result.profit * investment - investment).toFixed(2)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>
    </div>
  );
}

export default App; // Export the App component
