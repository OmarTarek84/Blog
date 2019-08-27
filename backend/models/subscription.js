const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subscriptionSchema = new Schema({
    endpoint: {
        type: String,
        required: true
    },
    keys: {
        auth: {
            type: String,
            required: true
        },
        p256dh: {
            type: String,
            required: true
        },
    }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);