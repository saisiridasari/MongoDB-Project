const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { MongoClient } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 MongoDB Connection
const client = new MongoClient("mongodb://localhost:27017");
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("companyDB");
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
}

connectDB();


// 🔹 Function to Generate MongoDB Filter JSON using Ollama
async function generateMongoQuery(nlQuery) {
  const prompt = `
You are an AI that converts natural language into MongoDB filter JSON.

IMPORTANT RULES:
- Return ONLY valid JSON.
- Do NOT explain anything.
- Do NOT include db.collection.find.
- Only return the filter object.

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
Input: employees with salary greater than 60000
Output: { "salary": { "$gt": 60000 } }

Input: male employees
Output: { "gender": "Male" }

Now convert this query:

${nlQuery}
`;

  const response = await axios.post("http://localhost:11434/api/generate", {
    model: "phi3",
    prompt: prompt,
    stream: false
  });

  return response.data.response;
}


// 🔹 Extract JSON safely from model output
function extractJSON(text) {
  // Remove markdown formatting
  text = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  // Extract JSON object
  const match = text.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("No valid JSON found");
  }

  return JSON.parse(match[0]);
}



// 🔹 Main API Endpoint
app.post("/query", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Step 1: Get model output
    const rawOutput = await generateMongoQuery(query);
    console.log("Model Output:", rawOutput);

    // Step 2: Extract filter JSON
    const filter = extractJSON(rawOutput);

    // Step 3: Execute MongoDB query
    const results = await db
      .collection("employees")
      .find(filter)
      .limit(100)
      .toArray();

    res.json({
      generatedFilter: filter,
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


// 🔹 Start Server
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
