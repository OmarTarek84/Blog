const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    comment: {
        type: String,
        required: true
    },
    post: {
        type: Schema.Types.ObjectId,
        ref: 'Post'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
}, {timestamps: true});

module.exports = mongoose.model('Comment', commentSchema);