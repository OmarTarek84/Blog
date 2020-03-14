import React, { useState } from "react";
import "./NewPost.css";
import Button from "../../../shared/UI/Button/Button";
import Input from "../../../shared/Form/Input/Input";
import { useSelector, useDispatch } from "react-redux";
import * as idb from "idb";
import { ObjectID } from "bson";
import ReactSnackBar from "react-js-snackbar";
import { useForm } from "../../../shared/Form/FormState/FormState";
import { useHttpClient } from "../../../shared/http/http";
import { REQUIRE, MAXLENGTH } from "../../../shared/Form/Validators/Validators";
import * as ActionTypes from "../../../store/actionTypes/ActionTypes";
import ErrorModal from "../../../shared/UI/ErrorModal/ErrorModal";

const dbPromise = idb.openDB("allPosts", 1, db => {
  if (!db.objectStoreNames.contains("posts")) {
    db.createObjectStore("posts", { keyPath: "_id" });
  }

  if (!db.objectStoreNames.contains("users")) {
    db.createObjectStore("users", { keyPath: "_id" });
  }

  if (!db.objectStoreNames.contains("sync-posts")) {
    db.createObjectStore("sync-posts", { keyPath: "_id" });
  }
});

function createData(st, data) {
  return dbPromise.then(db => {
    var transaction = db.transaction(st, "readwrite");
    var store = transaction.objectStore(st);
    store.put(data);
    return transaction.complete;
  });
}

const NewPost = props => {
  const [showSnackbar, setshowSnackbar] = useState(false);
  const [file, setFile] = useState(null);
  const [imageSelected, setimageSelected] = useState(null);
  const [buttonClicked, setbuttonClicked] = useState(false);
  const [newPostError, setnewPostError] = useState(false);

  const token = useSelector(state => state.auth.token);
  const userId = useSelector(state => state.auth.userId);

  const { isLoading, sendRequest } = useHttpClient();
  const dispatch = useDispatch();

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

  //sync new post when offline

  const sendNewPostToDB = async event => {
    event.preventDefault();
    setbuttonClicked(true);
    setshowSnackbar(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const fileResponse = await sendRequest("insertPostImage", formData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        }
      });
      const filepath = fileResponse.data.filePath;
      const requestBody = {
        query: `
                    mutation CreatePost($title: String!, $body: String!, $photo: String!) {
                        createPost(postInput: {title: $title, body: $body, photo: $photo}) {
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
                          }
                    }
                `,
        variables: {
          title: initialState.inputs.title.value,
          body: initialState.inputs.body.value,
          photo: filepath
        }
      };

      const createpostRes = await sendRequest("graphql", requestBody, {
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer " + token
        }
      });
      const newpost = createpostRes.data.data.createPost;
      dispatch({
        type: ActionTypes.ADD_POST,
        post: newpost
      });
      navigator.serviceWorker.ready.then(reg => {
        reg.active.postMessage(
          JSON.stringify({
            postId: newpost._id,
            userId: newpost.user._id,
            postTitle: newpost.title,
            postPhoto: newpost.photo,
            userName: newpost.user.name
          })
        );
      });
      // if (Notification.permission === 'granted') {
      //     this.configurePushSub(newpost.user._id, newpost.title, newpost.photo, newpost.user.name);
      // }
      setshowSnackbar(false);
      props.history.push("/posts");
    } catch (err) {
      setnewPostError('Failed To Create New Post');
      setshowSnackbar(false);
      setbuttonClicked(false);
    }
  };

    const createNewPost = event => {
      if (navigator.onLine) {
        sendNewPostToDB(event);
      } else {
        event.preventDefault();
        setbuttonClicked(true);
        if ("serviceWorker" in navigator && "SyncManager" in window) {
          navigator.serviceWorker.ready.then(sw => {
            // sw.active.postMessage(JSON.stringify({
            //     userId: this.props.userId,
            //     postTitle: this.state.newPostForm.title.value,
            //     postPhoto: postPhoto,
            //     userName: userName
            // }));
            const newPost = {
              _id: new ObjectID().toHexString(),
              title: initialState.inputs.title.value,
              body: initialState.inputs.body.value,
              photo: file,
              token: token,
              userId: userId
            };
            createData("sync-posts", newPost)
              .then(() => {
                return sw.sync.register("sync-new-posts");
              })
              .then(() => {
                setshowSnackbar(true);
              })
              .then(() => {
                props.history.push("/posts");
              })
              .catch(err => {
                console.log(err);
              });
          });
        }
      }
    };

  const configurePushSub = () => {};

  const changeFile = e => {
    const filee = e.target.files[0];
    setFile(filee);
    setimageSelected(URL.createObjectURL(filee));
  };

  return (
    <div className="newPost">
      <h1>Create New Post</h1>
      <form className="newPost__form" encType="multipart/form-data">
        <ReactSnackBar
          Icon={<i className="fas fa-alarm-clock"></i>}
          Show={showSnackbar}
        >
          Creating Your Post...
        </ReactSnackBar>
        <div>
          <Input
            element="input"
            id="title"
            placeholder="Title Of Your Post"
            onInput={inputHandler}
            type="text"
            label="Post Title"
            defaultValue=""
            validators={[REQUIRE()]}
          />
          <Input
            element="textarea"
            id="body"
            placeholder="Body Of Your Post"
            onInput={inputHandler}
            label="Post Body"
            defaultValue=""
            validators={[REQUIRE(), MAXLENGTH(1500)]}
          />
          <input type="file" name="image" onChange={changeFile} />
        </div>
        {imageSelected ? (
          <div className="imageSelected">
            <img src={imageSelected} alt="sdknflsd" />
          </div>
        ) : null}
        <Button
          type="submit"
          click={event => createNewPost(event)}
          disabled={!initialState.formIsValid || !file || buttonClicked}
        >
          Create Post
        </Button>
      </form>
      <ErrorModal
        open={!!newPostError}
        onClose={() => setnewPostError("")}
        errorMessage={newPostError}
      />
    </div>
  );
};

export default NewPost;
