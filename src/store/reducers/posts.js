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
      if (postss.length > 0) {
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
      } else {
        return {
          ...state,
          posts: []
        };
      }
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
        allposts[index].likes.push(action.likeObj);
        console.log(allposts[index]);
        return {
          ...state,
          posts: allposts,
        };
      }
    case ActionTypes.UNLIKE_POSTS:
      if (state.posts.length <= 0) {
        return {
          ...state,
          singlePost: {
            ...state.singlePost,
            likes: state.singlePost.likes.filter(
              p => p._id !== action.likeObj._id
            )
          }
        };
      } else {
        const allposts = [...state.posts];
        const postIndex = allposts.findIndex(p => p._id === action.id);
        const likeIndex = allposts[postIndex].likes.findIndex(p => {
          return p._id === action.likeObj._id;
        });
        allposts[postIndex].likes.splice(likeIndex, 1);
        return {
          ...state,
          posts: allposts,
        };
      }
    default:
      return state;
  }
};

export default PostReducer;
