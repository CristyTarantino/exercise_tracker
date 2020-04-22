const mongoose = require("mongoose");
const moment = require("moment");

/** this project needs a db !! **/
// make a connection
mongoose.connect(process.env.MLAB_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true
});

// get reference to database
var db = mongoose.connection;

db.on("error", () => console.log("connection error:"));

db.on("connected", () => console.log("connected"));

// define Schema
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  username: String
});

var ExerciseTrackSchema = new Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date
});

// compile schema to model
var UserExercise = mongoose.model("UserExercise", UserSchema);

// compile schema to model
var Exercise = mongoose.model("Exercise", ExerciseTrackSchema);

// 1. I can create a user by posting form data username to /api/exercise/new-user and returned will be an object with username and _id.
var createAndSaveUser = (username, done) => {
  UserExercise.findOne({ username: username }, (err, data) => {
    if (data) {
      done(null, data);
    } else {
      const user = new UserExercise({ username: username });
      user.save((err, data) =>
        err ? done(err) : done(null, { _id: data.id, username })
      );
    }
  });
};

// 2. I can get an array of all users by getting api/exercise/users with the same info as when creating a user.
var findUsers = done => {
  UserExercise.find({}, (err, data) => (err ? done(err) : done(null, data)));
};

// 3. an add an exercise to any user by posting form data userId(_id), description, duration, and optionally date to /api/exercise/add. If no date supplied it will use current date. Returned will be the user object with also with the exercise fields added.
var createAndSaveExercise = ({ userId, description, duration, date }, done) => {
  console.log(date);
  if (!mongoose.Types.ObjectId.isValid(userId))
    return done("Unknown user with _id");

  UserExercise.findById(userId).then(user => {
    if (!user) return done("Unknown user with _id");
    date = date === "" || !date ? Date.now() : date;
    
    const ex = new Exercise({ userId, description, duration, date });
    ex.save((err, data) =>
      err
        ? done(err)
        : done(null, {
            username: user.username,
            description,
            duration: +duration,
            _id: userId,
            date: moment(data.date).format("ddd MMM DD YYYY")
          })
    );
  });
};

// 4. I can retrieve a full exercise log of any user by getting /api/exercise/log with a parameter of userId(_id). Return will be the user object with added array log and count (total exercise count).
var findExerciseLog = ({ userId, from, to, limit }, done) => {
  from = moment(from, "YYYY-MM-DD").isValid() ? moment(from, "YYYY-MM-DD") : 0;
  to = moment(to, "YYYY-MM-DD").isValid()
    ? moment(to, "YYYY-MM-DD")
    : moment().add(1000000000000);

  UserExercise.findById(userId, (err, userData) => {
    if (userData) {
      const { _id, username } = userData;
      // 5. I can retrieve part of the log of any user by also passing along optional parameters of from & to or limit. (Date format yyyy-mm-dd, limit = int)
      Exercise.find({
        userId: userId,
        date: { $gte: from, $lt: to }
      })
        .limit(+limit)
        .exec((err, data) => {
          if (data.length) {
            done(null, {
              _id,
              username,
              count: data.length,
              log: data.map(log => ({
                description: log.description,
                duration: +log.duration,
                date: moment(log.date).format("ddd MMM DD YYYY")
              }))
            });
          } else {
            done(err);
          }
        });
    } else {
      done(err);
    }
  });
};

exports.UserModel = UserExercise;
exports.createAndSaveUser = createAndSaveUser;
exports.findUsers = findUsers;
exports.ExerciseModel = Exercise;
exports.createAndSaveExercise = createAndSaveExercise;
exports.findExerciseLog = findExerciseLog;
