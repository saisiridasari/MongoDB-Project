# Natural Language Interface for MongoDB

A full-stack Natural Language Interface (NLI) for MongoDB that enables users to query databases using plain English instead of MongoDB query syntax. The system leverages a locally hosted Large Language Model (LLM) via Ollama to convert natural language queries into valid MongoDB filter JSON and aggregation pipelines.

Built with React, Node.js, Express, MongoDB, and Ollama, the application runs entirely offline without requiring paid APIs.

---

## Features

- Query databases using natural language
- Automatic MongoDB filter generation from plain English
- Support for aggregation operations (average, count, max, group by)
- Modern MongoDB-inspired user interface
- Fully local execution with no external API dependencies
- CSV dataset import capability
- Secure and cost-effective solution

---

## Example Queries

```bash
male employees
employees with salary greater than 60000
average salary by job category
count employees by gender
highest salary
```

---

## Tech Stack

**Frontend:** React.js  
**Backend:** Node.js + Express.js  
**Database:** MongoDB  
**LLM Engine:** Ollama (phi3 model)  
**HTTP Client:** Axios  

---

## System Architecture

```
User → React Frontend → Node.js Backend → Ollama (LLM) → MongoDB → Backend → Frontend
```

---

## Project Structure

```
NL-MONGO-Project/
│
├── backend/
│   ├── server.js
│   ├── queryGenerator.js
│   └── package.json
│
└── frontend/
    ├── src/
    ├── public/
    └── package.json
```

---

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Ollama

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/NL-MONGO-Project.git
cd NL-MONGO-Project
```

---

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

---

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

### 4. Install and Configure Ollama

Download and install Ollama from:

https://ollama.com/

Pull the required model:

```bash
ollama pull phi3
```

Start Ollama:

```bash
ollama serve
```

---

### 5. Run Backend Server

```bash
cd backend
node server.js
```

Backend will run on:

http://localhost:5000

---

### 6. Run Frontend Application

```bash
cd frontend
npm start
```

Frontend will run on:

http://localhost:3000

---

## How It Works

1. User enters a natural language query in the frontend interface
2. Backend sends a structured prompt to Ollama
3. The LLM converts the query into MongoDB filter JSON
4. Backend executes the query on MongoDB
5. Results are returned and displayed in the frontend

---

## Current Limitations

- Complex nested queries may require improved prompt tuning
- Aggregation detection is rule-based
- Currently supports single collection queries
- Date filtering capabilities are limited

---

## Future Enhancements

- Chart visualization for aggregation results
- Query history panel
- Advanced date filtering
- Multi-collection support
- Cloud deployment options
- Enhanced error handling and validation

---

## License

This project is intended for educational and academic purposes.

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## Contact

For questions or suggestions, please open an issue on GitHub.
