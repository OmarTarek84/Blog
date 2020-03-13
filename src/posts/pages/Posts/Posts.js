import React, { useState, useEffect, useCallback } from "react";
import "./Posts.css";
import AllPosts from "../../components/Posts/Posts";
import Pagination from "react-js-pagination";
import axios from "../../../shared/http/axios";
import Spinner from "../../../shared/UI/Spinner/Spinner";
import OpenWebSocket from "socket.io-client";
import * as idb from "idb";
import { useSelector, useDispatch } from "react-redux";
import * as ActionTypes from "../../../store/actionTypes/ActionTypes";
import { useHttpClient } from "../../../shared/http/http";
import ErrorModal from "../../../shared/UI/ErrorModal/ErrorModal";
require("bootstrap/dist/css/bootstrap.css");

function urlBase64ToUint8Array(base64String) {
  var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  var base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const dbPromise = idb.openDB("allPosts", 1, db => {
  if (!db.objectStoreNames.contains("posts")) {
    db.createObjectStore("posts", { keyPath: "_id" });
  }

  if (!db.objectStoreNames.contains("users")) {
    db.createObjectStore("posts", { keyPath: "_id" });
  }
  if (!db.objectStoreNames.contains("sync-posts")) {
    db.createObjectStore("sync-posts", { keyPath: "body" });
  }
});

function readAllPosts(st) {
  return dbPromise.then(db => {
    var transaction = db.transaction(st, "readonly");
    var store = transaction.objectStore(st);
    return store.getAll();
  });
}

const Posts = props => {
  const [itemPerPage, setItemPerPage] = useState(8);
  const [activePage, setactivePage] = useState(1);
  const [postErr, setPostsError] = useState('');

  const { isLoading, sendRequest } = useHttpClient();

  const token = useSelector(state => state.auth.token);
  const posts = useSelector(state => state.posts.posts);
  const dispatch = useDispatch();

  const configurePushSub = useCallback(() => {
    if (!"serviceWorker" in navigator) {
      return;
    }
    let reg;
    navigator.serviceWorker.ready
      .then(sw => {
        reg = sw;
        return sw.pushManager.getSubscription();
      })
      .then(sub => {
        if (!sub) {
          const publicKey =
            "BLge1u7VbGLVM2pX5awJQlMCWCYk85dIszcMHqwA9MIksA8BPrJrA8x6ZB0OM9QOqbgL-NyqaR9pvKVJYSSgFZM";
          const convertedPublicKey = urlBase64ToUint8Array(publicKey);
          return reg.pushManager
            .subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedPublicKey
            })
            .then(newSub => {
              return newSub;
            });
        } else {
          console.log("endpoint", sub.endpoint);
          return null;
        }
      })
      .then(newSub => {
        console.log("new sub", newSub);
        if (newSub) {
          return axios
            .post("/subscribe", JSON.stringify(newSub), {
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: "Bearer " + token
              }
            })
            .then(res => {
              console.log(res);
            })
            .catch(err => {
              console.log(err);
            });
        }
      });
  }, [token]);

  useEffect(() => {
    if (token) {
      if ("Notification" in window) {
        Notification.requestPermission(result => {
          if (result !== "granted") {
            console.log("not granted");
          } else {
            configurePushSub();
          }
        });
      }
    }
  }, [token, configurePushSub]);

  useEffect(() => {
    const socket = OpenWebSocket("http://localhost:8080");
    socket.on("newpost", data => {
      console.log("data from socket", data);
      // this.setState(prevState => {
      //     return {
      //         posts: prevState.posts.concat(data.newPost)
      //     };
      // });
    });
    socket.on("deletedPost", data => {
      console.log("data from socket", data);
      // const filteredPosts = this.state.posts.filter(p => {
      //     return p._id !== data.deletedPost._id;
      // });
      // this.setState({posts: filteredPosts});
    });
    return () => {
      socket.close();
    };
  }, []);

  const fetchPosts = useCallback(async () => {
    setPostsError('');
    const requestBody = {
      query: `
            query {
                posts {
                    _id
                    title
                    body
                    photo
                    createdAt
                    updatedAt
                    comments {
                        _id
                        comment
                        createdAt
                    }
                    user {
                        _id
                        name
                        email
                        createdAt
                        photo
                    }
                    likes {
                      _id
                      name
                  }
                  comments {
                    _id
                    comment
                    createdAt
                    updatedAt
                    user {
                      _id
                      name
                    }
                  }
                }
            }
        `
    };
    try {
      const response = await sendRequest("graphql", requestBody, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      const posts = response.data.data.posts;
      dispatch({
        type: ActionTypes.FETCH_POSTS,
        posts: posts
      });
    } catch (err) {
      setPostsError(err);
    }
  }, [dispatch, sendRequest]);

  useEffect(() => {
    if (posts.length <= 1) {
      fetchPosts();
    }
  }, [dispatch, fetchPosts, posts]);

  const handlePageChange = pageNumber => {
    setactivePage(pageNumber);
  };

  const onGoToSinglePost = id => {
    props.history.push({
      pathname: "/post/" + id
    });
  };
  //   if ("indexedDB" in window) {
  //     if (!navigator.onLine) {
  //       readAllPosts("posts").then(data => {
  //         this.setState({ posts: data });
  //       });
  //     }
  //   }

  return (
    <>
      <div className="posts">
        <h1>Posts</h1>
        <div className="post_flex">
          {isLoading ? (
            <Spinner />
          ) : (
            <AllPosts
              posts={posts}
              activePage={activePage}
              itemPerPage={itemPerPage}
              isLoading={isLoading}
              onGoToSinglePost={onGoToSinglePost}
            />
          )}
        </div>
      </div>
      {!isLoading && (
        <Pagination
          activePage={activePage}
          itemsCountPerPage={itemPerPage}
          totalItemsCount={posts.length}
          linkClass={"page-link"}
          itemClass={"page-item"}
          activeClass={"active"}
          pageRangeDisplayed={8}
          onChange={handlePageChange}
        />
      )}
      <ErrorModal
        open={!!postErr}
        onClose={() => setPostsError("")}
        errorMessage={
          postErr.response &&
          postErr.response.data &&
          postErr.response.data.errors[0]
            ? postErr.response.data.errors[0].message
            : "Unknown Error, We'll fix it soon"
        }
        firstButton={true}
        firstButtonMethod={fetchPosts}
        firstButtonTitle={'Try Fetching Again'}
      />
    </>
  );
};

export default Posts;
