import React, { Suspense, useState, useEffect, useCallback } from "react";
import { Switch, Route, withRouter } from "react-router-dom";
import "./App.css";
import Layout from "./shared/Layout/Layout/Layout";
import HomePage from "./home/pages/Home/Home";
import Spinner from "./shared/UI/Spinner/Spinner";
import { useSelector, useDispatch } from "react-redux";
import * as ActionCreators from "./store/actionCreators/User";
import LogoutPage from "./auth/page/Logout/Logout";
import Conditional from "react-simple-conditional";
import OpenSocket from "socket.io-client";
import * as ActionTypes from "./store/actionTypes/ActionTypes";

const Auth = React.lazy(() => {
  return import("./auth/page/Auth/Auth");
});

const Signin = React.lazy(() => {
  return import("./auth/page/Signin/Signin.js");
});

const UserProfile = React.lazy(() => {
  return import("./profile/pages/UserProfile/UserProfile.js");
});

const NewPost = React.lazy(() => {
  return import("./posts/pages/NewPost/NewPost");
});

const Post = React.lazy(() => {
  return import("./posts/pages/Post/Post");
});

const Posts = React.lazy(() => {
  return import("./posts/pages/Posts/Posts");
});

const App = props => {
  const [installButton, setInstallButton] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const singlePostFromStore = useSelector(state => state.posts.singlePost);
  const token = useSelector(state => state.auth.token);
  const userId = useSelector(state => state.auth.userId);
  const dispatch = useDispatch();
  let logoutTimer;

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", e => {
      setDeferredPrompt(e);
      e.preventDefault();
      // See if the app is already installed, in that case, do nothing
      if (
        (window.matchMedia &&
          window.matchMedia("(display-mode: standalone)").matches) ||
        window.navigator.standalone === true
      ) {
        return false;
      }
      // Set the state variable to make button visible
      setInstallButton(true);
    });
  }, []);

  const logout = useCallback(() => {
    dispatch(ActionCreators.logout());
  }, [dispatch]);

  const login = useCallback(
    (token, userId, firstName, expDate) => {
      dispatch(ActionCreators.signinSucess(token, userId, expDate));
    },
    [dispatch]
  );

  useEffect(() => {
    const socket = OpenSocket("http://localhost:8080");
    socket.on("newcomment", data => {
      console.log("data from socket", data);
      const currentRoute = props.location.pathname.split("/");
      console.log("curretn", currentRoute);
      if (currentRoute[2] && data.postId === currentRoute[2]) {
        const updatedPost = {
          ...singlePostFromStore,
          comments: [data.comment, ...singlePostFromStore.comments]
        };
        dispatch({
          type: ActionTypes.SET_SINGLE_POST,
          singlePost: updatedPost
        });
      } else {
        dispatch({
          type: ActionTypes.INSERT_COMMENT,
          id: data.postId,
          comment: data.comment
        });
      }
    });
    socket.on("likePost", data => {
      console.log("data from socket", data);
      const currentRoute = props.location.pathname.split("/");
      console.log(currentRoute[2]);
      if (currentRoute[2] && data.like.postId === currentRoute[2]) {
        dispatch({
          type: ActionTypes.LIKE_POSTS,
          id: singlePostFromStore._id,
          likeObj: data.like
        });
        const input = document.querySelector(".likeInput");
        if (data.like._id === userId) {
          console.log("el mafrood");
          if (input) {
            input.checked = true;
          }
        }
      } else {
        dispatch({
          type: ActionTypes.LIKE_POSTS,
          id: data.postId,
          likeObj: data.like
        });
      }
    });
    socket.on("unLikePost", data => {
      console.log("data from socket", data);
      const currentRoute = props.location.pathname.split("/");
      console.log(currentRoute[2]);
      if (currentRoute[2] && data.like.postId === currentRoute[2]) {
        dispatch({
          type: ActionTypes.UNLIKE_POSTS,
          id: singlePostFromStore._id,
          likeObj: data.like
        });
        const input = document.querySelector(".likeInput");
        if (data.like._id === userId) {
          if (input) {
            input.checked = false;
          }
        }
      } else {
        dispatch({
          type: ActionTypes.UNLIKE_POSTS,
          id: data.postId,
          likeObj: data.like
        });
      }
    });
    return () => {
      socket.close();
    };
  }, [singlePostFromStore, props.location.pathname, userId, dispatch]);

  useEffect(() => {
    const expirationDate = localStorage.getItem("expDate");
    const tokenStorage = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (tokenStorage && userId) {
      const timeRemaining =
        new Date(expirationDate).getTime() - new Date().getTime();
      logoutTimer = setTimeout(logout, timeRemaining);
    } else {
      clearTimeout(logoutTimer);
    }
  }, [localStorage.getItem("token"), localStorage.getItem("expDate"), logout]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedExpDate = localStorage.getItem("expDate");
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId && storedToken && new Date(storedExpDate) > new Date()) {
      login(storedToken, storedUserId, storedExpDate);
    }
  }, [login]);

  const installApp = async () => {
    if (!deferredPrompt) {
      return false;
    }
    deferredPrompt.prompt();
    let outcome = await deferredPrompt.userChoice;
    if (outcome.outcome == "accepted") {
      console.log("App Installed");
    } else {
      console.log("App not installed");
    }
    setDeferredPrompt(null);
    setInstallButton(false);
  };

  const condStyle = {
    border: "none",
    fontFamily: "inherit",
    fontSize: "inherit",
    cursor: "pointer",
    padding: "10px 20px",
    display: "inline-block",
    margin: "15px -25px",
    letterSpacing: "1px",
    fontWeight: 700,
    outline: "none",
    position: "relative",
    background: "#cb4e4e",
    color: "#fff",
    boxShadow: "0 6px #ab3c3c",
    borderRadius: "0 0 5px 5px",
    left: "50%",
    transform: "translateX(-50%)"
  };
  return (
    <Layout>
      
      <Suspense fallback={<Spinner />}>
        <div
          style={{
            width: "100%",
            backgroundColor: "#5CDB95"
          }}
        >
          <Conditional
            condition={installButton}
            style={condStyle}
            onClick={() => installApp()}
          >
            Install As Application
          </Conditional>
        </div>
        <Switch>
          {!token ? (
            <Route path="/auth" render={props => <Auth {...props} />} exact />
          ) : null}
          {!token ? (
            <Route
              path="/signin"
              render={props => <Signin {...props} />}
              exact
            />
          ) : null}
          <Route
            path="/userprofile/:id"
            render={props => <UserProfile {...props} />}
            exact
          />
          {token ? (
            <Route
              path="/newpost"
              render={props => <NewPost {...props} />}
              exact
            />
          ) : null}
          <Route path="/post/:id" render={props => <Post {...props} />} exact />
          <Route path="/posts" render={props => <Posts {...props} />} exact />
          {token ? <Route path="/logout" component={LogoutPage} /> : null}
          <Route path="/" component={HomePage} exact />
        </Switch>
      </Suspense>
    </Layout>
  );
};

export default withRouter(App);
