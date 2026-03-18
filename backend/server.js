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

/* ==============================
   Generate MongoDB Query via LLM
============================== */

async function generateMongoQuery(nlQuery) {
  const prompt = `
Return ONLY valid JSON.
No explanation.
No markdown.

Format EXACTLY:
{
  "type": "find" or "aggregation",
  "filter": {},
  "pipeline": []
}

Rules:
- Use $and for multiple conditions
- Use $gt, $lt, $gte, $lte correctly
- Combine conditions logically
- Use correct field names

Fields:
gender, salary, jobcat, bdate, educ, salbegin, jobtime, prevexp, minority

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

Input: male employees with salary > 60000 and experience > 5
Output:
{
  "type": "find",
  "filter": {
    "$and": [
      { "gender": "Male" },
      { "salary": { "$gt": 60000 } },
      { "prevexp": { "$gt": 5 } }
    ]
  }
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

Query:
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
   Extract JSON Safely
============================== */

function extractJSON(text) {
  try {
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("No valid JSON found");
    }

    return JSON.parse(match[0]);
  } catch (error) {
    throw new Error("Invalid JSON format from model");
  }
}

/* ==============================
   Main API
============================== */

app.post("/query", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Step 1: Get LLM output
    const rawOutput = await generateMongoQuery(query);
    console.log("Model Output:", rawOutput);

    // Step 2: Extract JSON
    const parsedQuery = extractJSON(rawOutput);

    if (!parsedQuery.type) {
      throw new Error("Missing query type");
    }

    let results;

    /* ==============================
       Execute Query
    ============================== */

    if (parsedQuery.type === "aggregation") {

      if (!Array.isArray(parsedQuery.pipeline)) {
        throw new Error("Invalid pipeline format");
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
      throw new Error("Invalid query type");
    }

    /* ==============================
       Response
    ============================== */

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