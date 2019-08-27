import axios from 'axios';
const ActionTypes = require('../actionTypes/ActionTypes.js');

export const signinInit = () => {
    return {
        type: ActionTypes.SIGNINSTART,
    };
};

export const signinFail = (error) => {
    return {
        type: ActionTypes.SIGNINFAIL,
        error: error
    };
};

export const signinSucess = (token, userId) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('expDate', new Date().getTime() + (1 * 60 * 60 * 1000));
    return {
        type: ActionTypes.SIGNINSUCCESS,
        token: token,
        userId: userId
    };
};

export const logout = () => {
    navigator.serviceWorker.ready.then(function(reg) {
        reg.pushManager.getSubscription().then(function(subscription) {
            if (subscription) {
                subscription.unsubscribe().then(function(successful) {
                    const formData = new FormData();
                    formData.append('endpoint', subscription.endpoint);
                    formData.append('userId', localStorage.getItem('userId'));
                    return axios.post('/unsubscribe', formData, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        }
                    }).then(res => {
                        console.log(res);
                    })
                    .catch(err => {
                        console.log(err);
                    });
                }).catch(function(e) {
                    console.log(e);
                });
            }
        });
    }).then(() => {
        setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('expDate');
        }, 500);
    })
    return {
        type: ActionTypes.LOGOUT,
    };
};

export const signinExpiration = (token, userId) => {
    return dispatch => {
        dispatch(signinSucess(token, userId));
        setTimeout(() => {
            dispatch(logout());
        }, 3600 * 1000);
    };
};

export const authenticate = () => {
    return dispatch => {
        const token = localStorage.getItem('token');
        if (!token) {
            dispatch(logout());
        } else {
            const expDate = new Date(localStorage.getItem('expDate'));
            if (expDate < new Date()) {
                dispatch(logout());
            } else {
                const token = localStorage.getItem('token');
                const userId = localStorage.getItem('userId');
                dispatch(signinExpiration(token, userId));
            }
        }
    };
};