import * as ActionTypes from "../actionTypes/ActionTypes";

const initialState = {
  posts: [],
  singlePost: null
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
        posts: [action.post, ...state.posts].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
      };
    case ActionTypes.EDIT_POST:
      const thePosts = [...state.posts];
      const targetPostIndex = thePosts.findIndex(
        post => post._id === action.id
      );
      thePosts[targetPostIndex] = action.editedPost;
      return {
        ...state,
        posts: thePosts
      };
    case ActionTypes.DELETE_POST:
      const thePostss = [...state.posts];
      const targetPostIndexx = thePostss.findIndex(
        post => post._id === action.id
      );
      thePostss.splice(targetPostIndexx, 1);
      return {
        ...state,
        posts: thePostss
      };
    case ActionTypes.INSERT_COMMENT:
      const postss = [...state.posts];
      const targetPostIndexxx = postss.findIndex(
        post => post._id === action.id
      );
      postss[targetPostIndexxx].comments = [
        action.comment,
        ...postss[targetPostIndexxx].comments
      ];
      return {
        ...state,
        posts: postss
      };
    case ActionTypes.SET_SINGLE_POST:
      return {
        ...state,
        singlePost: action.singlePost
      };
    case ActionTypes.LIKE_POSTS:
      if (state.posts.length <= 0) {
        return {
          ...state,
          singlePost: {
            ...state.singlePost,
            likes: state.singlePost.likes.concat(action.likeObj)
          }
        };
      } else {
        const allposts = [...state.posts];
        const index = allposts.findIndex(p => p._id === action.id);
        allposts[index].likes.concat(action.likeObj);
        return {
          ...state,
          posts: allposts,
          singlePost: {
            ...state.singlePost,
            likes: state.singlePost.likes.concat(action.likeObj)
          }
        };
      };
    case ActionTypes.UNLIKE_POSTS:
      if (state.posts.length <= 0) {
        return {
          ...state,
          singlePost: {
            ...state.singlePost,
            likes: state.singlePost.likes.filter(p => p._id !== action.likeObj._id)
          }
        };
      } else {
        const allposts = [...state.posts];
        const index = allposts.findIndex(p => p._id === action.id);
        allposts[index].likes.filter(p => p._id !== action.likeObj._id);
        return {
          ...state,
          posts: allposts,
          singlePost: {
            ...state.singlePost,
            likes: state.singlePost.likes.filter(p => p._id !== action.likeObj._id)
          }
        };
      };
    default:
      return state;
  }
};

export default PostReducer;
