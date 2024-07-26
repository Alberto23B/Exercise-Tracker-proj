const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require("mongoose");
const nodemon = require("nodemon");


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
      date: Date
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
    console.error(err)
    res.json({err : "Error"});
  }
})


app.post("/api/users/:_id/exercises", async function (req, res) {
   const searchId = req.params._id;
   const regex = /^[^a-zA-Z]*$/
   const desc = req.body.description;
   const dur = Number(req.body.duration);
   let dat;
   if (req.body.date !== "" && regex.test(req.body.date)) {
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

// get a list of all users (an ARRAY)
app.get("/api/users", async function (req, res) {
  const userList = await User.find().select(["username", "_id"]);
  res.json(userList);
}); 

app.get("/api/users/:_id/logs", async function (req, res) {
  let {from, to, limit} = (req.query) ? req.query : false;
  const searchId = req.params._id
  try {
    let user = await User.findById(searchId).select(["_id", "username", "count", "log.description", "log.duration", "log.date"]);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    let logs = user.log;
    let customCount = 0;
    
    if (from) {
       const formatFrom = new Date(from);
       logs = logs.filter(function (log) {
        if (new Date(log.date) >= formatFrom) {
          customCount++;
          return true;  
        }
       })
    } else {
      customCount = logs.length;
    }
    if (to) {
      customCount = 0;
      const formatTo = new Date(to);
      logs = logs.filter(function (log) {
      if (new Date(log.date) <= formatTo) {
        customCount++;
        return true 
      } else {
        customCount = logs.length;
      } 
      }) 
    };
    let copyLogs = [];
    if (limit && logs.length >= limit) {
      let i = 0;
      logs.filter(() => {
        if (i < limit) {
          copyLogs.push(logs[i]);
          i++;
        } 
      })
      customCount = i;
    } else {
      customCount = logs.length;
    }
    let formattedLogs;
    if (copyLogs.length > 0) {
      formattedLogs = copyLogs.map( function (log) {
        return {description: log.description,
               duration: log.duration,
               date: new Date(log.date).toDateString()}
      })
    } else {
      formattedLogs = logs.map( function (log) {
        return {description: log.description,
               duration: log.duration,
               date: new Date(log.date).toDateString()}
      })
    }

    res.json({
        "_id" : user._id,
        "username": user.username,
        "count": customCount,
        "log" : formattedLogs
      })
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "User not found" });
  }

})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
