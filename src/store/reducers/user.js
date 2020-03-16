import * as ActionTypes from "../actionTypes/ActionTypes";

const initialState = {
  users: [],
  singleUser: null
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case ActionTypes.FETCH_USERS:
      return {
        ...state,
        users: action.users
      };
    case ActionTypes.SET_SINGLE_USER:
      if (state.users.length <= 0) {
        return {
          ...state,
          singleUser: action.user
        };
      } else {
        const allUsers = [...state.users];
        const followerIndex = allUsers.findIndex(
          user => user._id === action.id
        );
        allUsers[followerIndex] = action.user;

        if (action.userId) {
          const followingIndex = allUsers.findIndex(
            user => user._id === action.userId
          );
          const followingUserInd = allUsers[followingIndex].following.findIndex(
            singleUser => singleUser._id === action.id
          );
          if (followingUserInd > -1) {
            allUsers[followingIndex].following.splice(followingUserInd, 1);
          } else {
            allUsers[followingIndex].following.push(action.user);
          }
        }
        return {
          ...state,
          singleUser: action.user,
          users: allUsers
        };
      }
    case ActionTypes.ADD_POST_TO_USER:
      let allUsers;
      if (state.users.length > 0) {
        allUsers = [...state.users];
        const targetedUserindex = allUsers.findIndex(
          user => user._id === action.userid
        );
        allUsers[targetedUserindex].posts.push(action.newpost);
      } else {
        allUsers = [];
      }

      let singleuserToAddPost = { ...state.singleUser };
      if (state.singleUser && state.singleUser._id === action.userid) {
        singleuserToAddPost.posts.push(action.newpost);
      } else if (state.singleUser && state.singleUser._id !== action.userid) {
        singleuserToAddPost = { ...state.singleUser };
      } else {
        singleuserToAddPost = null;
      }
      return {
        ...state,
        users: allUsers,
        singleUser: singleuserToAddPost
      };
    case ActionTypes.DELETE_POST_FROM_USER:
      let allUserss;
      if (state.users.length > 0) {
        allUserss = [...state.users];
        const targetedUserindex = allUserss.findIndex(
          user => user._id === action.userid
        );
        allUserss[targetedUserindex].posts.splice(targetedUserindex, 1);
      } else {
        allUserss = [];
      }

      let singleuserToAddPostt = { ...state.singleUser };
      if (state.singleUser && state.singleUser._id === action.userid) {
        singleuserToAddPostt = {
            ...state.singleUser,
            posts: state.singleUser.posts.filter(post => {
                return post._id !== action.deletepost._id;
            })
        };
      } else if (state.singleUser && state.singleUser._id !== action.userid) {
        singleuserToAddPostt = { ...state.singleUser };
      } else {
        singleuserToAddPostt = null;
      }
      return {
        ...state,
        users: allUserss,
        singleUser: singleuserToAddPostt
      };
    default:
      return state;
  }
};

export default userReducer;
