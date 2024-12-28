import express from "express";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const { Pool} =pg;

const pool =new Pool ({
    user : process.env.DB_USER,
    host :process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.use(express.json());

// GET all players and their scores
app.get ("/players-scores", async(req, res) => {
try {
    const query = `
    SELECT p.name AS player_name, g.title AS game_title, s.score
    FROM players p
    JOIN scores s ON p.id = s.player_id
    JOIN games g ON s.game_id = g.id;
  `;
  const result = await pool.query(query);
  res.json(result.rows);
} catch(err){
    res.status(500).send(err.message);
}
});


// GET top 3 players by total scores
app.get("/top-players", async (req, res) => {
    try {
      const query = `
        SELECT p.name AS player_name, SUM(s.score) AS total_score
        FROM players p
        JOIN scores s ON p.id = s.player_id
        GROUP BY p.name
        ORDER BY total_score DESC
        LIMIT 3;
      `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });


  // GET players who haven’t played any games
  app.get("/inactive-players", async (req, res) => {
    try {
      const query = `
        SELECT p.name AS player_name
        FROM players p
        LEFT JOIN scores s ON p.id = s.player_id
        WHERE s.player_id IS NULL;
      `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  // GET most popular game genres
  app.get("/popular-genres", async (req, res) => {
    try {
      const query = `
        SELECT g.genre, COUNT(s.game_id) AS play_count
        FROM games g
        JOIN scores s ON g.id = s.game_id
        GROUP BY g.genre
        ORDER BY play_count DESC;
      `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  // GET players who joined in the last 30 days
  app.get("/recent-players", async (req, res) => {
    try {
      const query = `
        SELECT name, join_date
        FROM players
        WHERE join_date >= CURRENT_DATE - INTERVAL '30 days';
      `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  
//POST a new user
app.post("/players", async (req, res) => {
    const { id, name, join_date } = req.body;

    try {
        const result = await pool.query(
            "INSERT INTO players (id, name, join_date) VALUES ($1, $2, $3) RETURNING *",
            [id, name, join_date]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});


app.listen(3000, (req, res)=> 
console.log("Server is running in PORT 3000"));
