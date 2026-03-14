const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { MongoClient } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());

/* ==============================
   MongoDB Connection
============================== */

const client = new MongoClient("mongodb://localhost:27017");
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("companyDB");
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  }
}

connectDB();

async function generateMongoQuery(nlQuery) {
  const prompt = `
You convert natural language into MongoDB queries.

STRICT RULES:
- Return ONLY valid JSON.
- Do NOT explain anything.
- Do NOT use markdown.
- Return an object in EXACT format:

{
  "type": "find" OR "aggregation",
  "filter": {}   (if type = find)
  "pipeline": [] (if type = aggregation)
}

Collection: employees

Schema:
{
  id: number,
  gender: string,
  bdate: date,
  educ: number,
  jobcat: string,
  salary: number,
  salbegin: number,
  jobtime: number,
  prevexp: number,
  minority: string
}

Examples:

Input: male employees
Output:
{
  "type": "find",
  "filter": { "gender": "Male" }
}

Input: employees with salary greater than 60000
Output:
{
  "type": "find",
  "filter": { "salary": { "$gt": 60000 } }
}

Input: average salary by job category
Output:
{
  "type": "aggregation",
  "pipeline": [
    {
      "$group": {
        "_id": "$jobcat",
        "averageSalary": { "$avg": "$salary" }
      }
    }
  ]
}

Now convert this query:

${nlQuery}
`;

  const response = await axios.post("http://localhost:11434/api/generate", {
    model: "mistral",
    prompt: prompt,
    stream: false
  });

  return response.data.response;
}

/* ==============================
   Safe JSON Extraction
============================== */

function extractJSON(text) {
  try {
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("No valid JSON found in model output");
    }

    return JSON.parse(match[0]);
  } catch (error) {
    throw new Error("Invalid JSON format returned by model");
  }
}

/* ==============================
   Main Query Endpoint
============================== */

app.post("/query", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Step 1: Get model-generated query
    const rawOutput = await generateMongoQuery(query);
    console.log("Model Output:", rawOutput);

    // Step 2: Extract structured JSON
    const parsedQuery = extractJSON(rawOutput);

    if (!parsedQuery.type) {
      throw new Error("Query type missing from model response");
    }

    let results;

    // Step 3: Execute Query Based on Type
    if (parsedQuery.type === "aggregation") {

      if (!Array.isArray(parsedQuery.pipeline)) {
        throw new Error("Invalid aggregation pipeline format");
      }

      results = await db
        .collection("employees")
        .aggregate(parsedQuery.pipeline)
        .toArray();

    } else if (parsedQuery.type === "find") {

      if (!parsedQuery.filter || typeof parsedQuery.filter !== "object") {
        throw new Error("Invalid filter format");
      }

      results = await db
        .collection("employees")
        .find(parsedQuery.filter)
        .limit(100)
        .toArray();

    } else {
      throw new Error("Invalid query type returned by model");
    }

    // Step 4: Send Response
    res.json({
      generatedQuery: parsedQuery,
      count: results.length,
      results
    });

  } catch (error) {
    console.error("FULL ERROR:", error);
    res.status(500).json({
      error: error.message
    });
  }
});

/* ==============================
   Start Server
============================== */

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});