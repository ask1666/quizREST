const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    },
    createdQuiz: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }]
});

module.exports = mongoose.model('Users', UserSchema);