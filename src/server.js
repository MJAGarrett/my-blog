import express from "express";
import path from "path";

const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "/build")));

const withDB = async (operations, res) => {
  try {
    const client = new MongoClient("mongodb://localhost:27017");
    const db = client.db("blog");

    await operations(db);

    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error connecting to database, ", error });
  }
};

app.get(`/api/articles/:name`, async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(articleInfo);
  }, res);
});

app.post(`/api/articles/:name/add-comment`, (req, res) => {
  const articleName = req.params.name;
  const { username, text } = req.body;
  withDB(async (db) => {
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    await db
      .collection("articles")
      .updateOne(
        { name: articleName },
        { $set: { comments: articleInfo.comments.concat({ username, text }) } }
      );

    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(updatedArticleInfo);
  });
});

app.post("/api/articles/:name/upvote", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;

    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          upvotes: articleInfo.upvotes + 1,
        },
      }
    );
    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(updatedArticleInfo);
  }, res);
});

app.get("*", (req, res) => {
  res.send(path.join(__dirname + "/build/index.html"));
});

app.listen(8000, () => {
  console.log("listening on port 8000");
});
