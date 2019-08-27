const postResolvers = require('./posts.js');
const userResolvers = require('./user.js');

module.exports = {
    ...postResolvers,
    ...userResolvers
}