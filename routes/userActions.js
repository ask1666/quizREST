const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const jwt = require('jsonwebtoken');
const verify = require('./verifyToken');
const { Mongoose } = require('mongoose');

const router = express.Router();

router.post('/createUser', (req, res) => {
    const hashedPass = saltHashPassword(req.body.password);     //saves the hashed password and the salt in db.
    User.findOne({ username: req.body.username }, (err, user) => {
        if (err || user) {
            res.send('User with that name already registered');
        } else {
            const user = new User({
                username: req.body.username,
                password: hashedPass.passwordHash,
                salt: hashedPass.salt
            })

            user.save()
                .then(data => {
                    res.sendStatus(200);
                })
                .catch(err => {
                    res.sendStatus(500);
                })
        }
    });

});

router.post('/login', (req, res) => {
    User.findOne({ username: req.body.username }, (err, user) => {
        
        if (err || !user) {
            res.sendStatus(404);
        } else {
            let hashedPass;
            try {
            hashedPass = sha512(req.body.password, user.salt);  //hash the password with the salt for the user stored in the db.
            } catch (err){
                res.send(err);
            }
            if (user.password === hashedPass.passwordHash) {
                const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
                //res.header('authToken', token).send(token);
                res.send( {authToken: token, userid: user._id})
            }
        }
    });
});

router.delete('/deleteUser', verify, (req, res) => {
    User.findOneAndRemove({ _id: req.userId }, (err, user) => {
        if (err || !user) {
            res.sendStatus(401);
        } else {
            Quiz.deleteMany({ creator: req.userId }, (err, quiz) => {
                if (err) {
                    res.send('user has no quiz');
                } else {
                    
                }
            })
            res.sendStatus(200);
        }
    });
});

router.get('/getAllUsers', (req, res) => {
    User.find({}, function (err, users) {
        if (err) {
            res.send(err);
        } else {
            var userMap = {};

            users.forEach(function (user) {

                userMap[user._id] = user.username;

            });

            res.send(userMap);
        }

    });
});

router.get('/getUserById', (req, res) => {
    User.findById(req.query.userid, (err, user) => {
        if (err) {
            res.send(err);
        } else if (!user) {
            res.send('id does not match!')
        } else {
            res.send(user);
        }
    });
})

router.put('/createQuiz', verify, (req, res) => {
    
    User.findOne({ _id: req.userId }, (err, user) => {
        if (err) {
            res.sendStatus(403);
        } else {
            Quiz.findOne({ creator: req.userId, quizName: req.body.quizName }, (err, data) => {
                
                if (err || data) {
                    res.send('User already have quiz with that name');
                } else if (!data) {
                    const quiz = new Quiz({
                        quizName: req.body.quizName,
                        creator: req.userId
                    })

                    if (user && user._id.equals(req.userId)) {
                        quiz.save()
                            .then(data => {

                            })
                            .catch(err => {
                                res.send({ message: err });
                            })

                        User.updateOne({ _id: req.userId }, {
                            $push: { createdQuiz: quiz }      //$push - adding items to array 
                        }, (err, data) => {
                            if (err) {
                                res.send(err);
                            } else {
                                Quiz.findOne({quizName: req.body.quizName}, (err,createdQuiz) => {
                                    if (err) {res.send(err)} 
                                    else {
                                        res.send(createdQuiz._id);
                                    }
                                })
                                
                            }
                        });
                    } else {
                        
                        res.sendStatus(403);
                    }
                }
            })

        }
    });
});

router.delete('/deleteQuiz', verify, async (req, res) => {

    const quiz = await Quiz.findOne({ quizName: req.body.quizName }, (err, quiz) => {
        if (err || !quiz) {
            res.sendStatus(404);
        }
    });

    if (quiz.creator.equals(req.userId)) {
        User.updateOne({ createdQuiz: quiz._id }, {
            $pull: { createdQuiz: quiz._id }
        }, (err, user) => {
            if (err) {
                res.sendStatus(401);
            }
        })

        Quiz.findOneAndRemove({ quizName: req.body.quizName }, (err, quiz) => {
            if (err) {
                res.send(err);
            } else {
                Question.deleteMany({ quiz: quiz._id}, (err, question) => {
                    if (err)
                        res.send(err)
                        
                })
                res.sendStatus(200);
            }
        });
    } else {
        res.sendStatus(403);
    }


});

router.get('/getAllQuiz', (req, res) => {
    Quiz.find({}, function (err, quiz) {
        if (err) {
            res.send(err);
        } else {
            var quizMap = [];

            quiz.forEach(function (quiz) {

                quizMap.push(quiz);

            });
            

            res.send(quizMap);
        }

    });
});

router.get('/getYourQuiz', verify, (req, res) => {
    Quiz.find({ creator: req.userId }, function (err, quiz) {
        if (err) {
            res.send(err);
        } else {
            var quizMap = [];

            quiz.forEach(function (quiz) {

                quizMap.push(quiz);

            });

            res.send(quizMap);
        }

    });
});

router.post('/getQuiz', (req,res) => {
    if (req.body.quizId) {
        Quiz.findById(req.body.quizId, (err, quiz) => {
            if (err) {res.send(err);}
            else {
                
                res.send(quiz);
            }
        });
    } else {
        res.sendStatus(403);
    }
})

router.put('/addQuestion', verify, (req, res) => {
    Quiz.findOne({ creator: req.userId, quizName: req.body.quizName }, (err, quiz) => {
        if (err || !quiz) {
            res.send('You dont own a quiz with that name');
        } else {
            Question.findOne({ quiz: quiz._id, question: req.body.question }, (err, ques) => {
                if (err || ques) {
                    res.send('already question like that in your quiz');
                } else {
                    const question = new Question({
                        quiz: quiz,
                        question: req.body.question,
                        rightAnswer: req.body.rightAnswer,
                        falseAnswers: req.body.falseAnswer,
                    });

                    question.save()
                        .then(data => {

                        })
                        .catch(err => {
                            res.send({ message: err });
                        })

                    Quiz.updateOne({ quizName: req.body.quizName }, {
                        $push: { questions: question }      //$push - adding items to array 
                    }, (err, data) => {
                        if (err) {
                            res.sendStatus(404);
                        } else {
                            res.sendStatus(200);
                        }
                    });
                }
            });

        }
    });
});

router.delete('/deleteQuestion', verify, async (req, res) => {

    const quiz = await Quiz.findOne({ quizName: req.body.quizName, creator: req.userId }, (err, quiz) => {
        if (err || !quiz) {
            res.sendStatus(404);
        }
    });

    Question.findOne({ question: req.body.question, quiz: quiz._id }, (err, question) => {
        if (err || !question) {
            res.sendStatus(404);
        } else {
            Quiz.updateOne({ creator: req.userId, quizName: req.body.quizName }, {
                $pull: { questions: question._id }
            }, (err, question) => {
                if (err) {
                    res.sendStatus(404);
                }
            })

            Question.findOneAndRemove({ quiz: quiz._id, question: req.body.question }, (err, question) => {
                if (err) {
                    res.sendStatus(404)
                } else {
                    res.sendStatus(200);
                }
            });
        }
    });

});

router.get('/getQuestions', (req, res) => {
    Question.find({}, function (err, question) {
        if (err) {
            res.send(err);
        } else {
            var questionMap = {};

            question.forEach(function (question) {

                questionMap[question._id] = question;

            });

            res.send(questionMap);
        }

    });
});

router.post('/getYourQuestions', async (req, res) => {

    const quiz = await Quiz.findOne({creator: req.body.userid, quizName: req.body.quizName}, (err,quiz) => {
        if (err || !quiz) {
            res.sendStatus(404);
        }
    });
    if (quiz) {
        Question.find({quiz: quiz._id}, function (err, question) {
            if (err) {
                res.send(err);
                console.log(err);
            } else {
                var questionList = [];

                question.forEach(function (question) {

                    questionList.push(question)

                });

                res.send(questionList);
            }

        });
    }
});


/**
 * generates random string of characters i.e salt
 * @function
 * @param {number} length - Length of the random string.
 */
var genRandomString = function(length){
    return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex') /** convert to hexadecimal format */
            .slice(0,length);   /** return required number of characters */
};

/**
 * hash password with sha512.
 * @function
 * @param {string} password - List of required fields.
 * @param {string} salt - Data to be validated.
 */
var sha512 = function(password, salt){
    var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt:salt,
        passwordHash:value
    };
};

function saltHashPassword(userpassword) {
    var salt = genRandomString(16); /** Gives us salt of length 16 */
    var passwordData = sha512(userpassword, salt);
    return passwordData;
}






module.exports = router;