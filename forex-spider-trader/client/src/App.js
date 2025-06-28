import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [startCurrency, setStartCurrency] = useState('USD');
  const [maxSteps, setMaxSteps] = useState(3);
  const [investment, setInvestment] = useState(100);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tradingType, setTradingType] = useState('forex');
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await fetch(`/api/currencies?type=${tradingType}`);
        const data = await response.json();
        setAvailableCurrencies(data);
        if (data.length > 0) {
          setStartCurrency(data[0]); // Set first available currency as default
        }
      } catch (error) {
        console.error('Error fetching currencies:', error);
      }
    };
    fetchCurrencies();
  }, [tradingType]);

  const fetchArbitrage = () => {
    setLoading(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    fetch(`/api?startCurrency=${startCurrency}&maxSteps=${maxSteps}&type=${tradingType}`, { signal })
      .then(res => res.json())
      .then(setResults)
      .catch(error => {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
        } else {
          console.error('Error fetching arbitrage:', error);
        }
      })
      .finally(() => setLoading(false));
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Forex/Crypto Spider Trader</h1>
        <div>
          <label>
            Trading Type:
            <select value={tradingType} onChange={e => setTradingType(e.target.value)}>
              <option value="forex">Forex</option>
              <option value="crypto">Crypto</option>
            </select>
          </label>
          <label>
            Start Currency:
            {tradingType === 'forex' ? (
              <input type="text" value={startCurrency} onChange={e => setStartCurrency(e.target.value.toUpperCase())} />
            ) : (
              <select value={startCurrency} onChange={e => setStartCurrency(e.target.value)}>
                {availableCurrencies.map(currency => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            )}
          </label>
          <label>
            Max Steps:
            <input type="number" value={maxSteps} onChange={e => setMaxSteps(parseInt(e.target.value))} />
          </label>
          <label>
            Investment Amount:
            <input type="number" value={investment} onChange={e => setInvestment(parseFloat(e.target.value))} />
          </label>
          <button onClick={fetchArbitrage} disabled={loading}>Find Arbitrage</button>
          {loading && <button onClick={handleCancel}>Cancel</button>}
        </div>
        <div>
          <h2>Arbitrage Paths (Text Visualization):</h2>
          {loading ? (
            <div className="spinner"></div>
          ) : results.length === 0 ? (
            <p>No arbitrage opportunities found.</p>
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

export default App;
