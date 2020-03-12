import axios from '../../shared/http/axios';
import * as  ActionTypes from '../actionTypes/ActionTypes.js';

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

export const signinSucess = (token, userId, expDate) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    const expirDate = expDate || new Date(new Date().getTime() + (1 * 60 * 60 * 1000));
    localStorage.setItem('expDate', expirDate);
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