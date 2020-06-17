const mongoose = require('mongoose');

const QuestionSchema = mongoose.Schema({
    quiz: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Quiz',
        required: true
    },
    question: {
        type: String,
        require: true
    },
    rightAnswer: {
        type: String,
        require: true
    },
    falseAnswers: {
        type: [String],
        usePushEach: true
    }
    
});

module.exports = mongoose.model('Questions', QuestionSchema);