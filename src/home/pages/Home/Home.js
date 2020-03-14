import React, { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import Blogs from "../../components/Blogs/Blogs";
import Spinner from "../../../shared/UI/Spinner/Spinner";
import axios from "../../../shared/http/axios";
import Users from "../../components/Users/Users";
import * as idb from "idb";
import * as ActionTypes from "../../../store/actionTypes/ActionTypes";
import "./Home.css";
import { useHttpClient } from "../../../shared/http/http";
import { useDispatch, useSelector } from "react-redux";
import ErrorModal from "../../../shared/UI/ErrorModal/ErrorModal";

const dbPromise = idb.openDB("allPosts", 1, db => {
  if (!db.objectStoreNames.contains("posts")) {
    db.createObjectStore("posts", { keyPath: "_id" });
  }
  if (!db.objectStoreNames.contains("users")) {
    db.createObjectStore("users", { keyPath: "_id" });
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

const HomePage = props => {
  const [mostLikedBlog, setMostLikedBlog] = useState(null);
  const [postsErr, setPostsError] = useState("");
  const [userErr, setuserError] = useState("");
  const [usersLoading, setusersLoading] = useState(false);
  const [userErrorMessage, setuserErrorMessage] = useState("");
  const [postErrorMessage, setpostErrorMessage] = useState("");
  const { sendRequest, isLoading } = useHttpClient();
  const dispatch = useDispatch();
  const posts = useSelector(state => state.posts.posts);
  const users = useSelector(state => state.user.users);

  const fetchPosts = useCallback(async () => {
    if (posts && posts.length > 0) {
      const mostLikedPost = posts.reduce((prev, current) => {
        return prev.likes.length > current.likes.length ? prev : current;
      });
      setMostLikedBlog(mostLikedPost);
    } else {
      setPostsError("");
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
                              likes {
                                _id
                                name
                            }
                          }
                      }
                  `
      };
      try {
        const response = await sendRequest("graphql", requestBody, {
          "Content-Type": "application/json"
        });
        const postsRes = response.data.data.posts;
        dispatch({
          type: ActionTypes.FETCH_POSTS,
          posts: postsRes
        });
        const mostLikedPost = postsRes.reduce((prev, current) => {
          return prev.likes.length > current.likes.length ? prev : current;
        });
        console.log(mostLikedPost);
        setMostLikedBlog(mostLikedPost);
      } catch (err) {
        setPostsError("Posts Fetching Failed");
        setpostErrorMessage("User Fetching Failed");
      }
    }
  }, [dispatch, sendRequest]);

  const fetchUsers = useCallback(async () => {
    setusersLoading(true);
    setuserError("");
    const usersRequestBody = {
      query: `
                query {
                    users {
                      _id
                      name
                      email
                      photo
                      createdAt
                      posts {
                          _id
                          title
                          likes {
                              _id
                              name
                          }
                      }
                      followers {
                          _id
                          name
                      }
                      following {
                          _id
                          name
                      }
                }  
                }
            `
    };
    try {
      const response = await axios.post("graphql", usersRequestBody, {
        "Content-Type": "application/json"
      });
      const allUsers = response.data.data.users;
      setuserErrorMessage("");
      dispatch({
        type: ActionTypes.FETCH_USERS,
        users: allUsers
      });
      setusersLoading(false);
    } catch (err) {
      setusersLoading(false);
      setuserError("User Fetching Failed");
      setuserErrorMessage("User Fetching Failed");
    }
  }, [dispatch]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, dispatch]);

  useEffect(() => {
    if (users.length <= 0) {
      fetchUsers();
    }
  }, [fetchUsers, dispatch]);

  const goToPost = id => {
    props.history.push({
      pathname: "/post/" + id
    });
  };

  const goToProfile = id => {
    props.history.push("/userprofile/" + id);
  };
  // if ('indexedDB' in window) {
  //     readAllPosts('users').then(data => {
  //         if (!navigator.onLine) {
  //             this.setState({followedUsers: data});
  //         }
  //     });
  // }

  let allThePosts;
  if (isLoading && !postsErr) {
    allThePosts = <Spinner />;
  } else if (mostLikedBlog && !isLoading && !postsErr) {
    allThePosts = (
      <>
        <section className="section-most-viewed">
          <h2>{postsErr ? postsErr : "Most Liked Blog"}</h2>
          <div className="section-most-viewed__blog-parent">
            <div className="section-most-viewed__blog-parent__blog">
              <p>Blog Created By {mostLikedBlog.user.name}</p>
              <h1>{mostLikedBlog.title}</h1>
              <p>{mostLikedBlog.body.substring(0, 200) + "..."}</p>
              <Link to={"/post/" + mostLikedBlog._id}>Read More</Link>
            </div>
            <div className="section-most-viewed__blog-parent__image">
              <img src={mostLikedBlog.photo} alt="Blog_Pic" />
            </div>
          </div>
        </section>

        <div className="recent_posts">
          <h1>Recent Blogs</h1>
          <div className="recent_posts__flex">
            <Blogs blogs={posts.slice(0, 3)} goToPost={goToPost} />
          </div>
        </div>
      </>
    );
  } else if (postErrorMessage && !isLoading) {
    allThePosts = <h2>{"Fetching Post Failed"}</h2>;
  }

  let allTheUsers;
  if (usersLoading && !userErr) {
    allTheUsers = <Spinner />;
  } else if (!usersLoading && !userErr) {
    allTheUsers = (
      <div className="mostActiveUsers">
        <h2>{userErrorMessage ? userErrorMessage : "Most Followed Users"}</h2>
        <div className="mostActiveUsers__flex">
          <Users
            users={users
              .sort((a, b) => {
                return b.followers.length - a.followers.length;
              })
              .slice(0, 3)}
            goToProfile={goToProfile}
          />
        </div>
      </div>
    );
  } else if (!usersLoading && userErr) {
    allTheUsers = <h2>{"Fetching User Failed"}</h2>;
  }

  return (
    <>
      {allThePosts}
      {allTheUsers}
      <ErrorModal
        open={!!userErr}
        onClose={() => {
          setuserError("");
        }}
        errorMessage="User Fetching Failed"
        firstButton={true}
        firstButtonMethod={fetchUsers}
        firstButtonTitle={"Try Fetching Again"}
      />
      <ErrorModal
        open={!!postsErr}
        onClose={() => {
          setPostsError("");
        }}
        errorMessage="Posts Fetching Failed"
        firstButton={true}
        firstButtonMethod={fetchPosts}
        firstButtonTitle={"Try Fetching Again"}
      />
    </>
  );
};

export default HomePage;
