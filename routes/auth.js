const router = require("express").Router();
const User = require("../model/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { registerValidation, loginValidation } = require("../validation");

router.post("/register", async (req, res) => {
  // VALIDATE THE DATA BEFORE CREATING A USER
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //checking if user is already in the database
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) return res.status(400).send("Email already exists");

  //   Hash passwords
  const salt = await bcrypt.gentSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
  });
  try {
    const savedUser = await user.save();
    res.send({ user: user._id });
  } catch (err) {
    res.status(400).send(err);
  }
});

// LOGIN
router.post("/login", async (req, res) => {
//   VALIDATING DATA
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);
//   check if email doesn't exist
  const user = await User.findOne({email: req.body.email});
  if (!user) return res.status(400).send('Email is not found');
//   check if password is correct
  const validPass = await bcrypt.compare(req.body.password, user.password);
  if(!validPass) return res.status(400).send('Invalid Password');

//   create and assign a token
   const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET)
   res.header('auth-token', token).send(token);

});

module.exports = router;
