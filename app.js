const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Quiz = require('./models/Quiz');
const Cors = require('cors');
require('dotenv/config');

//Import Routes
const userRoute = require('./routes/userActions');
app.use(bodyParser.json());
app.use(Cors());

app.use('/userActions', userRoute);

//ROUTES
app.get('/', (req,res) => {
    //res.send("it works");
});

//Connect To DB
mongoose.connect(
    process.env.DB_CONNECTION, 
    {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false},
)
.then(res => {
    console.log("connected to DB");
})
.catch(err => console.log(err))

/* Quiz.deleteOne({quizName: "testQuiz123"}, (err,quiz) => {
    if (err) {
        console.log(err);
    } else {
        //console.log(quiz);
    }
}); */

app.listen(3000);