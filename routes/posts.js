const express = require('express');
const router = express.Router();
const axios = require('axios');
const BlogPost = require('../models/Blog');
const apiToken = process.env.LLAMA_API_KEY; // Replace with your actual Llama AI API key

router.get('/', async (req, res) => {
  try {
    const posts = await BlogPost.find();
    res.send(posts);
  } catch (error) {
    res.status(500).send(error);
  }
});

async function getSummary(content) {
  const apiUrl = 'https://api.llama-api.com/chat/completions'; // Llama AI API endpoint

  const apiRequestJson = {
    "messages": [
      {"role": "user", "content": content}
    ],
    "functions": [
      {
        "name": "generate_summary",
        "description": "Generate a summary from given content",
        "parameters": {
          "type": "object",
          "properties": {
            "content": {
              "type": "string",
              "description": "The content to be summarized"
            },
            "length": {
              "type": "number",
              "description": "Desired length of the summary in words"
            }
          }
        },
        "required": ["content"]
      }
    ],
    "stream": false,
    "function_call": "generate_summary"
  };

  try {
    const response = await axios.post(apiUrl, apiRequestJson, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      }
    });

    if (response.status === 200) {
      const summaryData = response.data;
      const summary = summaryData.choices[0].message.function_call.arguments.content; // Assuming the summary is in the first choice
      console.log('Summary:', summary);
      return summary;
    } else {
      throw new Error('Failed to generate summary');
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to generate summary');
  }
}


router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;
    console.log('Title:', title);
    console.log('Content:', content);
    const summary = await getSummary(content);
    console.log('Summary:', summary);
    const post = new BlogPost({ title, content, summary });
    await post.save();
    res.status(201).send(post);
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(400).send('Failed to create blog post');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).send('Blog post not found');
    }
    res.send(post);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, content, summary } = req.body;
    const post = await BlogPost.findByIdAndUpdate(req.params.id, { title, content, summary }, { new: true });
    if (!post) {
      return res.status(404).send('Blog post not found');
    }
    res.send(post);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).send('Blog post not found');
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
