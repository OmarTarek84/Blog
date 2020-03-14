import * as ActionTypes from '../actionTypes/ActionTypes';

const initialState = {
    users: [],
    singleUser: null
};

const userReducer = (state = initialState, action) => {
    switch(action.type) {
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
                const followerIndex = allUsers.findIndex(user => user._id === action.id);
                allUsers[followerIndex] = action.user;

                if (action.userId) {
                    const followingIndex = allUsers.findIndex(user => user._id === action.userId);
                    const followingUserInd = allUsers[followingIndex].following.findIndex(singleUser => singleUser._id === action.id);
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
                }
            }
        default:
            return state;
    }
};

export default userReducer;