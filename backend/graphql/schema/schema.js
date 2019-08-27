const {buildSchema} = require('graphql');

module.exports = buildSchema(`

    type Post {
        _id: ID!
        title: String!
        body: String!
        photo: String!
        user: User!
        likes: [User]
        comments: [Comment!]!
        createdAt: String!
        updatedAt: String!
    }

    type Comment {
        _id: ID!
        comment: String!
        createdAt: String!
        updatedAt: String!
        post: Post!
        user: User!
    }

    type User {
        _id: ID!
        name: String!
        email: String!
        password: String
        photo: String!
        followers: [User]!
        following: [User]!
        posts: [Post!]!
        createdAt: String!
        updatedAt: String!
        endpoint: [EndPoint!]!
    }

    type AuthData {
        userId: ID!
        token: String!
        tokenExpiration: Int!
    }

    type Keys {
        auth: String!
        p256dh: String!
    }

    type EndPoint {
        endpoint: String!
        keys: Keys!
    }

    input UserInput {
        name: String!
        email: String!
        password: String
        photo: String!
    }

    input LoginInput {
        email: String!
        password: String!
    }

    input PostInput {
        title: String!
        body: String!
        photo: String!
    }

    input updatePostInput {
        id: String!
        title: String!
        body: String!
        photo: String!
    }

    input EditProfileInput {
        id: String!
        name: String!
        email: String!
        password: String
        photo: String!
    }

    type RootQuery {
        loginUser(loginInput: LoginInput): AuthData!
        posts: [Post!]!
        comments(postId: String!): [Comment!]!
        singlePost(postId: String!): Post!
        singleUser(userId: String!): User!
        users: [User!]!
    }

    type RootMutation {
        createUser(userInput: UserInput): User!
        createPost(postInput: PostInput): Post!
        updatePost(updatePostInput: updatePostInput): Post!
        deletePost(postId: String!): User!
        insertComment(postId: String!, comment: String!): Comment!
        editUserProfile(editProfileInput: EditProfileInput): User!
        likePost(postId: String!): Post!
        unlikePost(postId: String!): Post!
        followUser(userId: String!): User!
        unFollowUser(userId: String!): User!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);