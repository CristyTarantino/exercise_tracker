const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const MyApp = require('./myApp.js');

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', (req, res) => {
  MyApp.createAndSaveUser(req.body.username, (err, data) => err ? res.send(err) : res.send(data));
});

app.get('/api/exercise/users', (req, res) => {
  MyApp.findUsers((err, data) => err ? res.send(err) : res.send(data));
});

app.post('/api/exercise/add', (req, res) => {
  MyApp.createAndSaveExercise(req.body, (err, data) => err ? res.send(err) : res.send(data));
});

app.get('/api/exercise/log?:userId', (req, res) => {
  MyApp.findExerciseLog(req.query, (err, data) => err ? res.send(err) : res.send(data));
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
