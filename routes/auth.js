const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/Auth");

router.get("/", (req, res) => {
  res.send("Auth route");
});

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
      name,
    });

    await user.save();
    res.status(201).send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send("User not found");
    }
    user.verified = true;
    await user.save();
    res.send("User verified");
  } catch (error) {
    res.status(400).send("Failed to verify user");
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send("User not found");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("Invalid credentials");
    }
    res.send({
      id: user._id,
      name: user.name,
      email: user.email,
      verified: user.verified,
      posts: user.posts,
    });
  } catch (error) {
    res.status(400).send("Failed to login");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
