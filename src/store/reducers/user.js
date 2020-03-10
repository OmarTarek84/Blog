import * as ActionTypes from'../actionTypes/ActionTypes.js';

const initialState = {
    userId: null,
    token: null,
    loading: false,
    error: null
};

const userReducer = (state = initialState, action) => {
    switch(action.type) {
        case ActionTypes.SIGNINSTART:
            return {
                ...state,
                loading: true
            };
        case ActionTypes.SIGNINSUCCESS:
            return {
                ...state,
                userId: action.userId,
                token: action.token,
                loading: false
            };
        case ActionTypes.SIGNINFAIL:
                return {
                    ...state,
                    error: action.error
                };
        case ActionTypes.LOGOUT:
                return {
                    ...state,
                    userId: null,
                    token: null,
                    loading: false
                };
        default:
            return state;
    }
};

export default userReducer;