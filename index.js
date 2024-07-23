const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require("mongoose");

app.use(cors())
app.use(express.static('public'))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(
  "mongodb+srv://Alberto_Bio:Mmmeriva.23@cluster0.6oeifpn.mongodb.net/exertracker?retryWrites=true&w=majority&appName=Cluster0",
  { useNewUrlParser: true, useUnifiedTopology: true },
);

const UserSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: [
    {
      description: String,
      duration: Number,
      date: String
    }
  ]
})
let User = mongoose.model("User", UserSchema);

app.post("/api/users", async function (req, res) {
  const usrnm = req.body.username;
  try {
    const user = new User({
      username : usrnm,
      count : 0,
      log: []
    });
    await user.save()
    const exists = await User.findOne({ username : usrnm });
    res.json({"username" : exists.username, "_id" : exists._id})
  } catch (err) {
    console.log(err)
    res.json({err : "Error"});
  }
})


app.post("/api/users/:_id/exercises", async function (req, res) {
   const searchId = req.params._id;
   const desc = req.body.description;
   const dur = Number(req.body.duration);
   let dat;
   if (req.body.date !== "") {
     dat = new Date(req.body.date); 
   } else {
     dat = new Date;
   }
   const formatDate = dat.toDateString() 
   try {
    const selected = 
    await User.findByIdAndUpdate(
      {_id : searchId},
      {
        $inc: {count : + 1},
        $push: { 
          log: {
          description : desc,
          duration: dur,
          date: formatDate
          }
        },
    }, 
      {new : true})
      const modified = await User.findById(searchId)
      // const count = modified.count;
    res.json({
      "_id" : modified._id, 
      "username" : modified.username, 
      "date" : formatDate,
      "duration" : dur,
      "description" : desc
    })
   } catch (err) {
    console.error(err);
   }
})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
