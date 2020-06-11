const mongoose = require('mongoose');

const QuizSchema = mongoose.Schema({
    quizName: {
        type: String,
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Users',
        required: true
    },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Questions' }]
    
});

module.exports = mongoose.model('Quiz', QuizSchema);