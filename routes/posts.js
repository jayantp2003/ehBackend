const express = require("express");
const router = express.Router();
const axios = require("axios");
const BlogPost = require("../models/Blog");
const User = require("../models/Auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const apiToken = process.env.LLAMA_API_KEY; // Replace with your actual Llama AI API key

router.get("/", async (req, res) => {
  try {
    const posts = await BlogPost.find();
    res.send(posts);
  } catch (error) {
    res.status(500).send(error);
  }
});

async function run(content) {
  // The Gemini 1.5 models are versatile and work with both text-only and multimodal prompts
  const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash"});

  const prompt = "Summarize the following content into an engaging blog intro, around 50 words, to attract readers:\n\n" + content;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);
  return text;
}


async function getSummary(content) {
  const apiUrl = "https://api.llama-api.com/chat/completions";

  const apiRequestJson = {
    messages: [{ role: "user", content: `Summarize the following content into an engaging blog intro, around 50 words, to attract readers:

${content}` }],
    max_tokens: 100,
    temperature: 0.7,
  };

  try {
    const response = await axios.post(apiUrl, apiRequestJson, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LLAMA_API_KEY}`
      }
    });

    if (response.status === 200 && response.data.choices && response.data.choices.length > 0) {
      const summary = response.data.choices[0].message.content.trim();
      console.log("API-generated summary:", summary);
      return summary;
    } else {
      console.error("Unexpected response structure:", response.data);
      return generateFallbackSummary(content);
    }
  } catch (error) {
    console.error("Error generating summary:", error.response ? error.response.data : error.message);
    return generateFallbackSummary(content);
  }
}

router.post("/", async (req, res) => {
  try {
    const { title, content, author } = req.body;
    let summary = await getSummary(content);
    if (summary === "Failed to generate summary") {
      console.warn("Using fallback summary due to generation failure");
      summary = "Summary not available";
    }
    console.log("Summary from Llama: ", summary);
    const summaryg = await run(content);
    console.log("Summary from Gemini: ", summaryg);
    console.log("author:", author);
    const post = new BlogPost({ title, content, summary, author });
    const authorUser = await User.findOne({ email: author });
    console.log("Author user:", authorUser);
    if (authorUser) {
      const postData = await post.save();
      authorUser.posts.push(postData._id);
      await authorUser.save();
    }
    else
    {
      console.error("Author not found");
      res.status(404).send("Author not found");
    }
    
    res.status(201).send(post);
  } catch (error) {
    console.error("Error creating blog post:", error);
    res.status(400).send("Failed to create blog post");
  }
});


router.get("/:id", async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).send("Blog post not found");
    }
    res.send(post);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { title, content, summary, author } = req.body;
    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { title, content, summary, updatedAt: Date.now() },
      { new: true }
    );
    if (!post) {
      return res.status(404).send("Blog post not found");
    }
    res.send(post);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    console.log("Deleting post:", req.params.id);

    // Find the post by ID
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).send("Blog post not found");
    }
    console.log("Post found:", post);

    // Find the author of the post
    const author = await User.findOne({ email: post.author });
    if (author) {
      console.log("Author found:", author);
      author.posts.pull(post._id);
      await author.save();
    } else {
      console.log("Author not found");
    }

    // Delete the post
    await BlogPost.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).send("An error occurred while deleting the post.");
  }
});


module.exports = router;
