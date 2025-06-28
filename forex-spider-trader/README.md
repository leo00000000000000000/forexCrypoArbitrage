# Forex/Crypto Spider Trader

This application helps visualize potential arbitrage opportunities in Forex and Cryptocurrency markets. It fetches live (daily updated) exchange rates and attempts to find profitable cycles based on user-defined parameters.

## Features

*   **Forex & Crypto Trading:** Switch between Forex and Cryptocurrency markets.
*   **Dynamic Currency Selection:** The starting currency input adapts to the selected trading type, providing a dropdown for crypto assets.
*   **Arbitrage Path Visualization:** Displays potential arbitrage paths and calculated profits.
*   **Potential Gain Calculator:** Estimates potential gain based on an investment amount.
*   **Loading Indicator:** Provides visual feedback during arbitrage calculation.
*   **Request Cancellation:** Ability to abort ongoing arbitrage calculations.

## Installation

To set up and run the project, follow these steps:

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <your-repository-url>
    cd forex-spider-trader
    ```

2.  **Backend Setup:**
    Navigate to the `forex-spider-trader` directory:
    ```bash
    cd /Users/leo/forex-spider-trader
    ```
    Install backend dependencies:
    ```bash
    npm install
    ```

3.  **Frontend Setup:**
    Navigate to the `client` directory:
    ```bash
    cd /Users/leo/forex-spider-trader/client
    ```
    Install frontend dependencies:
    ```bash
    npm install
    ```

## How to Run

1.  **Start the Backend Server:**
    Open a new terminal and navigate to the `forex-spider-trader` directory:
    ```bash
    cd /Users/leo/forex-spider-trader
    node server.js
    ```
    The server will start on `http://localhost:3001`.

2.  **Start the React Frontend:**
    Open another terminal and navigate to the `client` directory:
    ```bash
    cd /Users/leo/forex-spider-trader/client
    npm start
    ```
    This will open the application in your default web browser, usually at `http://localhost:3000`.

## Important Notes on Arbitrage

It's important to understand that finding profitable arbitrage opportunities with this application is highly unlikely in real-world scenarios due to several factors:

*   **Market Efficiency:** Major Forex and Cryptocurrency markets are extremely efficient. Any significant price discrepancies are typically exploited by high-frequency trading algorithms within milliseconds.
*   **Data Latency:** The APIs used (open.er-api.com for Forex and @fawazahmed0/currency-api for Crypto) provide daily updated rates, not real-time, high-frequency data. True arbitrage opportunities are fleeting and require millisecond-level data.
*   **Transaction Costs:** This application does not account for transaction fees, slippage, or other trading costs, which would significantly reduce or eliminate any theoretical profits.
*   **Exchange Differences:** Real arbitrage often exists due to price differences *between different exchanges*, whereas this application uses consolidated rates from single sources.

This application serves as a conceptual demonstration of how arbitrage logic can be applied to currency exchange rates, rather than a tool for real-world profit generation.
