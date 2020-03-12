import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {BrowserRouter} from 'react-router-dom';
import {Provider} from 'react-redux';
import {createStore, applyMiddleware, compose, combineReducers} from 'redux';
import UserReducer from './store/reducers/user';
import thunk from 'redux-thunk';
import PostReducer from './store/reducers/posts';
import AuthReducer from './store/reducers/auth';

const logger = store => {
    return next => {
        return action => {
            return next(action);
        };
    };
};

const rootReducer = combineReducers({
    auth: AuthReducer,
    posts: PostReducer,
    user: UserReducer
});

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(rootReducer, composeEnhancers(
    applyMiddleware(logger, thunk)
  ));

const app = (
    <Provider store={store}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </Provider>
)

ReactDOM.render(app, document.getElementById('root'));
