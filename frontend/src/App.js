import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;

    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/query", {
        query
      });

      setResults(response.data.results);
      setCount(response.data.count);
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
          <div className="result-header">
            <span>Results Found: {count}</span>
          </div>

          <div className="table-wrapper">
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
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
