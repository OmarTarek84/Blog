import * as ActionTypes from "../actionTypes/ActionTypes";

const initialState = {
  posts: []
};

const PostReducer = (state = initialState, action) => {
  switch (action.type) {
    case ActionTypes.FETCH_POSTS:
      return {
        ...state,
        posts: action.posts.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        })
      };
    case ActionTypes.ADD_POST:
      return {
        ...state,
        posts: [
            action.post,
            ...state.posts
        ]
      };
    default:
      return state;
  }
};

export default PostReducer;
