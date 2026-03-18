import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [queryType, setQueryType] = useState("");
  const [generatedQuery, setGeneratedQuery] = useState(null); // NEW

  const handleSearch = async () => {
    if (!query) return;

    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/query", {
        query
      });

      setResults(response.data.results);
      setCount(response.data.count);
      setQueryType(response.data.generatedQuery.type);
      setGeneratedQuery(response.data.generatedQuery); // NEW
    } catch (error) {
      alert("Error fetching results");
    }

    setLoading(false);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>MongoDB Natural Language Interface</h1>
        <p>Query your database using plain English</p>
      </header>

      <div className="search-container">
        <input
          type="text"
          placeholder="Try: average salary by job category"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={handleSearch}>Run Query</button>
      </div>

      {loading && <div className="loader">Processing Query...</div>}

      {!loading && count > 0 && (
        <div className="results-section">

          {/* 🔹 Result Count + Query Type */}
          <div className="result-header">
            <span>Results Found: {count}</span>
            <span className="query-type">
              Type: {queryType.toUpperCase()}
            </span>
          </div>

          {/* 🔹 Generated Query Display */}
          {generatedQuery && (
            <div className="query-box">
              <h3>Generated MongoDB Query</h3>
              <pre>
                {JSON.stringify(generatedQuery, null, 2)}
              </pre>
            </div>
          )}

          <div className="table-wrapper">

            {/* 🔹 AGGREGATION TABLE */}
            {queryType === "aggregation" ? (
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Average Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item, index) => (
                    <tr key={index}>
                      <td>{item._id}</td>
                      <td>${item.averageSalary?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (

            /* 🔹 NORMAL QUERY TABLE */
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Gender</th>
                    <th>Job Category</th>
                    <th>Salary</th>
                    <th>Experience</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((emp) => (
                    <tr key={emp._id}>
                      <td>{emp.id}</td>
                      <td>{emp.gender}</td>
                      <td>{emp.jobcat}</td>
                      <td>${emp.salary}</td>
                      <td>{emp.prevexp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

export default App;