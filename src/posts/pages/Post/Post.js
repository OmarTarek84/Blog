import React, { useEffect, useState, useCallback } from "react";
import Button from "../../../shared/UI/Button/Button";
import "./Post.css";
import Backdrop from "../../../shared/UI/Backdrop/Backdrop";
import Modal from "../../../profile/components/EditProfileModal/EditProfileModal";
import CSSTransition from "react-transition-group/CSSTransition";
import Input from "../../../shared/Form/Input/Input";
import Spinner from "../../../shared/UI/Spinner/Spinner";
import { useSelector, useDispatch } from "react-redux";
import SinglePost from "../../components/Post/Post.js";
import Comments from "../../components/Comments/Comments";
import * as idb from "idb";
import ReactSnackBar from "react-js-snackbar";
import { ObjectID } from "bson";
import { useHttpClient } from "../../../shared/http/http";
import * as ActionTypes from "../../../store/actionTypes/ActionTypes";
import { useForm } from "../../../shared/Form/FormState/FormState";
import { REQUIRE, MAXLENGTH } from "../../../shared/Form/Validators/Validators";
import ErrorModal from "../../../shared/UI/ErrorModal/ErrorModal";
import axios from "../../../shared/http/axios";

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

function deleteItemFromData(st, id) {
  return dbPromise.then(db => {
    var transaction = db.transaction(st, "readwrite");
    var store = transaction.objectStore(st);
    store.delete(id);
    return transaction.complete;
  });
}

function createData(st, data) {
  return dbPromise.then(db => {
    var transaction = db.transaction(st, "readwrite");
    var store = transaction.objectStore(st);
    store.put(data);
    return transaction.complete;
  });
}

const Post = props => {
  const [backdropShow, setbackdropShow] = useState(false);
  const [showSnackbar, setshowSnackbar] = useState(false);
  const [file, setFile] = useState(null);
  const [imageSelected, setImageSelected] = useState(null);
  const [deleteButtonClicked, setdeleteButtonClicked] = useState(false);
  const [commentButtonDisabled, setcommentButtonDisabled] = useState(false);
  const [buttonClicked, setbuttonClicked] = useState(false);
  const [editPostButtonClicked, seteditPostButtonClicked] = useState(false);
  const [postError, setPostError] = useState("");

  const dispatch = useDispatch();
  const singlePostFromStore = useSelector(state => state.posts.singlePost);

  const changeFile = e => {
    const filee = e.target.files[0];
    setFile(filee);
    setImageSelected(URL.createObjectURL(filee));
  };

  const [initialState, inputHandler] = useForm(
    {
      title: {
        value: "",
        isValid: false
      },
      body: {
        value: "",
        isValid: false
      }
    },
    false
  );

  const [initialForm, handleInput] = useForm(
    {
      comment: {
        value: "",
        isValid: false
      }
    },
    false
  );

  const posts = useSelector(state => state.posts.posts);
  const token = useSelector(state => state.auth.token);
  const userId = useSelector(state => state.auth.userId);
  const { isLoading, sendRequest } = useHttpClient();

  const fetchSinglePost = useCallback(async () => {
    const requestBody = {
      query: `
                query SinglePost($postId: String!) {
                    singlePost(postId: $postId) {
                        _id
                        title
                        body
                        photo
                        createdAt
                        user {
                            _id
                            name
                            email
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
            `,
      variables: {
        postId: props.match.params.id
      }
    };

    try {
      const response = await sendRequest("graphql", requestBody, {
        headers: { "Content-Type": "application/json" }
      });

      const singlePost = response.data.data.singlePost;
      console.log("single post", singlePost);
      dispatch({
        type: ActionTypes.SET_SINGLE_POST,
        singlePost: singlePost
      });
      const input = document.querySelector(".likeInput");
      singlePost.likes.forEach(p => {
        if (p._id === userId) {
          if (input) {
            input.checked = true;
          }
        }
      });
    } catch (err) {
      setPostError(err);
    }
  }, [props.match.params.id, sendRequest, userId]);

  useEffect(() => {
    if (!posts || posts.length <= 0) {
      fetchSinglePost();
    } else {
      const singlepost = posts.find(p => p._id === props.match.params.id);
      setTimeout(() => {
        const input = document.querySelector(".likeInput");
        singlepost.likes.forEach(p => {
          if (p._id === userId) {
            if (input) {
              input.checked = true;
            }
          }
        });
      }, 1);
      dispatch({
        type: ActionTypes.SET_SINGLE_POST,
        singlePost: singlepost
      });
    }
  }, [fetchSinglePost, userId, props.match.params.id]);

  const openBackdrop = () => {
    setbackdropShow(true);
  };

  const closeBackdrop = () => {
    setbackdropShow(false);
  };

  const editPost = async e => {
    e.preventDefault();
    setbackdropShow(false);
    seteditPostButtonClicked(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const editRes = await sendRequest("insertupdatePostImage", formData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        }
      });
      const filepath = editRes.data.filePath;
      let path;
      if (filepath === "notFound") {
        path = singlePostFromStore.photo;
      } else {
        path = filepath;
      }
      const editedPost = {
        ...singlePostFromStore,
        title: initialState.inputs.title.value,
        body: initialState.inputs.body.value,
        photo: imageSelected || singlePostFromStore.photo
      };
      dispatch({
        type: ActionTypes.EDIT_POST,
        id: singlePostFromStore._id,
        editedPost: editedPost
      });
      console.log(editedPost);
      dispatch({
        type: ActionTypes.SET_SINGLE_POST,
        singlePost: editedPost
      });
      seteditPostButtonClicked(false);
      const requestBody22 = {
        query: `
                mutation UpdatePost($id: String!, $title: String!, $body: String!, $photo: String!) {
                    updatePost(updatePostInput: {id: $id, title: $title, body: $body, photo: $photo}) {
                      _id
                      title
                      body
                      photo
                      createdAt
                    }
                }
            `,
        variables: {
          id: singlePostFromStore._id,
          title: initialState.inputs.title.value,
          body: initialState.inputs.body.value,
          photo: path
        }
      };

      await axios.post("graphql", requestBody22, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        }
      });
    } catch (err) {
      setPostError(err);
      seteditPostButtonClicked(false);
    }
  };

  const deletePost = async () => {
    deleteItemFromData("posts", singlePostFromStore._id);
    setdeleteButtonClicked(true);
    try {
      const requestBody = {
        query: `
                  mutation DeletePost($postId: String!) {
                      deletePost(postId: $postId) {
                          _id
                          posts {
                            title
                            body
                            photo
                          }
                        }
                  }
              `,
        variables: {
          postId: singlePostFromStore._id
        }
      };

      await axios.post("graphql", requestBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        }
      });
      setdeleteButtonClicked(false);
      dispatch({
        type: ActionTypes.DELETE_POST,
        id: singlePostFromStore._id
      });
      props.history.push("/posts");
    } catch (err) {
      setPostError(err);
    }
  };

  // insert comment while offline

  const sendCommentInsertedToDB = async e => {
    e.preventDefault();
    setcommentButtonDisabled(true);
    try {
      const requestBody = {
        query: `
                  mutation InsertComment($postId: String!, $comment: String!) {
                      insertComment(postId: $postId, comment: $comment) {
                          _id
                          comment
                          createdAt
                          user {
                            name
                          }
                        }
                  }
              `,
        variables: {
          postId: singlePostFromStore._id,
          comment: initialForm.inputs.comment.value
        }
      };

      const commentRes = await axios.post("graphql", requestBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        }
      });

      const commentResponse = commentRes.data.data.insertComment;

      // if (posts.length <= 0) {
      //   const updatedPost = {
      //     ...singlePostFromStore,
      //     comments: [commentResponse, ...singlePostFromStore.comments]
      //   };
      //   dispatch({
      //     type: ActionTypes.SET_SINGLE_POST,
      //     singlePost: updatedPost
      //   });
      // } else {
      //   dispatch({
      //     type: ActionTypes.INSERT_COMMENT,
      //     id: singlePostFromStore._id,
      //     comment: commentResponse
      //   });
      // }

      setcommentButtonDisabled(false);

      navigator.serviceWorker.ready.then(sw => {
        sw.active.postMessage(
          JSON.stringify({
            postId: singlePostFromStore._id,
            comment: commentResponse.comment,
            userInsertedComment: commentResponse.user.name
          })
        );
      });
    } catch (err) {
      setPostError(err);
    }
  };

  const insertComment = e => {
    if (navigator.onLine) {
      sendCommentInsertedToDB(e);
    } else {
      e.preventDefault();
      setcommentButtonDisabled(true);
      setshowSnackbar(true);
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        navigator.serviceWorker.ready.then(sw => {
          const comment = {
            _id: new ObjectID().toHexString(),
            postId: singlePostFromStore._id,
            comment: this.inputRef.current.value,
            userId: userId,
            token: token
          };
          createData("sync-comments", comment)
            .then(() => {
              return sw.sync.register("sync-new-comments");
            })
            .then(() => {
              setshowSnackbar(false);
            })
            .then(() => {
              setcommentButtonDisabled(false);
            })
            .catch(err => {
              console.log(err);
            });
        });
      } else {
        this.sendCommentInsertedToDB(e);
      }
    }
  };

  const goToProfile = id => {
    props.history.push({
      pathname: "/userprofile/" + id
    });
  };

  const like = async event => {
    const isLiked = event.target.checked;
    setbuttonClicked(true);
    let requestBody;
    if (isLiked) {
      requestBody = {
        query: `
                    mutation LikePost($postId: String!) {
                        likePost(postId: $postId) {
                            _id
                            likes {
                                name
                            }
                        }
                    }
                `,
        variables: {
          postId: props.match.params.id
        }
      };
    } else {
      requestBody = {
        query: `
                    mutation UnlikePost($postId: String!) {
                        unlikePost(postId: $postId) {
                            _id
                            likes {
                                name
                            }
                        }
                    }
                `,
        variables: {
          postId: props.match.params.id
        }
      };
    }

    await axios.post("graphql", requestBody, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      }
    });
    setbuttonClicked(false);

  };

  let thePost;
  if (isLoading) {
    thePost = <Spinner />;
  } else if (!isLoading && singlePostFromStore) {
    thePost = (
      <>
        <SinglePost
          openBackdrop={openBackdrop}
          title={singlePostFromStore.title}
          body={singlePostFromStore.body}
          image={singlePostFromStore.photo}
          date={singlePostFromStore.createdAt}
          postCreator={singlePostFromStore.user.name}
          onGoToProfile={goToProfile}
          deletePost={deletePost}
          disabledd={deleteButtonClicked}
          userId={userId}
          postUserId={singlePostFromStore.user._id}
          like={like}
          numberOfLikes={singlePostFromStore.likes.length}
          buttonClicked={buttonClicked}
          token={token}
          userPostId={singlePostFromStore.user._id}
          disabled={editPostButtonClicked}
        />

        {token ? (
          singlePostFromStore.user._id !== userId ? (
            <div className="post__comments">
              <h2>Leave A Comment</h2>
              <form className="post__comments__form">
                <Input
                  element="input"
                  id="comment"
                  placeholder="comment..."
                  onInput={handleInput}
                  type="text"
                  label="Enter Your Comment"
                  validators={[]}
                />
                <Button
                  type="submit"
                  disabled={!initialForm.formIsValid || commentButtonDisabled}
                  click={e => insertComment(e)}
                >
                  POST
                </Button>
              </form>
            </div>
          ) : null
        ) : null}
        <Comments
          comments={singlePostFromStore.comments.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )}
          numberOfComments={singlePostFromStore.comments.length}
        />
      </>
    );
  }

  return (
    <>
      <ReactSnackBar
        Icon={<i className="fas fa-alarm-clock"></i>}
        Show={showSnackbar}
      >
        Creating Your Comment...
      </ReactSnackBar>
      {thePost}
      <Backdrop show={backdropShow} />
      <CSSTransition
        mountOnEnter
        unmountOnExit
        in={backdropShow}
        timeout={{
          enter: 1000,
          exit: 1000
        }}
        classNames={{
          enter: "",
          enterActive: "ModalOpen",
          exit: "",
          exitActive: "ModalClose"
        }}
      >
        <Modal viewModal={backdropShow}>
          <form className="editPost__form" encType="multipart/form-data">
            <h1>Edit Your Post</h1>
            <div className="editPost__icon" onClick={closeBackdrop}>
              <i className="fas fa-times-circle"></i>
            </div>
            <Input
              element="input"
              id="title"
              placeholder="Title Of Your Post"
              onInput={inputHandler}
              type="text"
              label="Post Title"
              initialValue={singlePostFromStore ? singlePostFromStore.title : ""}
              isValid={true}
              validators={[REQUIRE()]}
            />
            <Input
              element="textarea"
              id="body"
              placeholder="Body Of Your Post"
              onInput={inputHandler}
              isValid={true}
              label="Post Body"
              initialValue={singlePostFromStore ? singlePostFromStore.body : ""}
              validators={[REQUIRE(), MAXLENGTH(1500)]}
            />
            <input type="file" name="image" onChange={changeFile} />
            <Button
              type="submit"
              disabled={!initialState.formIsValid}
              click={editPost}
            >
              Update Post
            </Button>
            {singlePostFromStore && singlePostFromStore.photo ? (
              <img
                src={imageSelected || singlePostFromStore.photo}
                name="image"
                alt="postImage"
                className="imageSelected"
              />
            ) : null}
          </form>
        </Modal>
      </CSSTransition>
      <ErrorModal
        open={!!postError}
        onClose={() => setPostError("")}
        errorMessage={
          postError.response &&
          postError.response.data &&
          postError.response.data.errors[0]
            ? postError.response.data.errors[0].message
            : "Failed to update post or session has timed out"
        }
      />
    </>
  );
};

export default Post;
