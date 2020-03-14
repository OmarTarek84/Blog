import React, { useState, useEffect, useCallback } from "react";
import Backdrop from "../../../shared/UI/Backdrop/Backdrop";
import EditProfileModal from "../../components/EditProfileModal/EditProfileModal";
import "./UserProfile.css";
import Button from "../../../shared/UI/Button/Button";
import Input from "../../../shared/Form/Input/Input";
import CSSTransition from "react-transition-group/CSSTransition";
import ProfilePage from "../../components/UserProfile/UserProfile";
import axios from "../../../shared/http/axios";
import Spinner from "../../../shared/UI/Spinner/Spinner";
import { useSelector, useDispatch } from "react-redux";
import { useHttpClient } from "../../../shared/http/http";
import * as ActionTypes from "../../../store/actionTypes/ActionTypes";

const UserProf = props => {
  const [viewBackdrop, setviewBackdrop] = useState(false);
  const [viewModal, setviewModal] = useState(false);
  const [file, setFile] = useState(false);
  const [imageSelected, setImageSelected] = useState(null);
  const [buttonClicked, setbuttonClicked] = useState(false);
  const [followButtonClicked, setfollowButtonClicked] = useState(false);
  const [followed, setfollowed] = useState(false);
  const [userErr, setUserErr] = useState("");

  const token = useSelector(state => state.auth.token);
  const userId = useSelector(state => state.auth.userId);
  const singleUserFromStore = useSelector(state => state.user.singleUser);
  const usersFromStore = useSelector(state => state.user.users);

  const { isLoading, sendRequest } = useHttpClient();
  const dispatch = useDispatch();

  const fetchUser = useCallback(async () => {
    const requestBody = {
      query: `
                query SingleUser($userId: String!) {
                    singleUser(userId: $userId) {
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
            `,
      variables: {
        userId: props.match.params.id
      }
    };

    try {
      const response = await sendRequest("graphql", requestBody, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      const userProfile = response.data.data.singleUser;
      dispatch({
        type: ActionTypes.SET_SINGLE_USER,
        user: userProfile,
        id: props.match.params.id
      });
      const followButton = document.querySelector(
        ".userProfile__user-flex__details__buttons-flex__link button"
      );
      const input = document.querySelector('input[class="followInput"]');
      const foll = userProfile.followers.find(
        follower => follower._id === userId
      );
      console.log("foll", foll);
      if (foll) {
        setfollowed(true);
        if (input) {
          input.checked = true;
        }
        if (followButton) {
          followButton.style.backgroundColor = "green";
        }
      } else {
        setfollowed(false);
        if (input) {
          input.checked = false;
        }
        if (followButton) {
          followButton.style.backgroundColor = "rgb(5, 56, 107)";
        }
      }
    } catch (err) {}
  }, [dispatch, userId, props.match.params.id]);

  useEffect(() => {
    if (usersFromStore.length <= 0) {
      fetchUser();
    } else {
      const targetedUser = usersFromStore.find(
        user => user._id === props.match.params.id
      );
      console.log(usersFromStore);
      console.log(props.match.params.id);
      console.log("targetedUser", targetedUser);
      dispatch({
        type: ActionTypes.SET_SINGLE_USER,
        user: targetedUser,
        id: props.match.params.id
      });
      const foll = targetedUser.followers.find(
        follower => follower._id === userId
      );
      console.log("foll", foll);
      if (foll) {
        setTimeout(() => {
          const followButton = document.querySelector(
            ".userProfile__user-flex__details__buttons-flex__link button"
          );
          const input = document.querySelector('input[class="followInput"]');
          setfollowed(true);
          if (input) {
            input.checked = true;
          }
          if (followButton) {
            followButton.style.backgroundColor = "green";
          }
        }, 1);
      } else {
        setfollowed(false);
        const followButton = document.querySelector(
          ".userProfile__user-flex__details__buttons-flex__link button"
        );
        const input = document.querySelector('input[class="followInput"]');
        if (input) {
          input.checked = false;
        }
        if (followButton) {
          followButton.style.backgroundColor = "rgb(5, 56, 107)";
        }
      }
    }
  }, [dispatch, fetchUser, props.match.params.id, userId]);

  const viewBackdropp = () => {
    setviewBackdrop(true);
    setviewModal(true);
  };

  const closeBackdrop = () => {
    setviewBackdrop(false);
    setviewModal(false);
  };

  const onGoToPost = post => {
    props.history.push({
      pathname: "/post/" + post._id,
      postId: post._id
    });
  };

  const editProfile = async event => {
    event.preventDefault();
    setbuttonClicked(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await axios.post("/insertupdatePostImage", formData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        }
      });
      const filepath = res.data.filePath;
      let path;
      if (filepath === "notFound") {
        path = singleUserFromStore.photo;
      } else {
        path = filepath;
      }
      const requestBody = {
        query: `
                        mutation EditUserProfile($id: String!, $name: String!, $email: String!, $password: String, $photo: String!) {
                            editUserProfile(editProfileInput: {
                                id: $id,
                                name: $name,
                                email: $email,
                                password: $password,
                                photo: $photo
                              }) {
                                _id
                                name
                                email
                                photo
                                createdAt
                                posts {
                                    _id
                                    title
                                }
                              }
                        }
                    `,
        variables: {
          id: this.props.match.params.id,
          name: this.state.editprofileForm.name.value,
          email: this.state.editprofileForm.email.value,
          password: this.state.editprofileForm.password.value,
          photo: path
        }
      };

      const editResponse = await axios.post(
        "http://localhost:8080/graphql",
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
          }
        }
      );
      const updatedUser = editResponse.data.data.editUserProfile;
      dispatch({
        type: ActionTypes.SET_SINGLE_USER,
        user: updatedUser,
        id: props.match.params.id
      });
      setbuttonClicked(false);
      setviewBackdrop(false);
      setviewModal(false);
    } catch (err) {
      setUserErr(err);
      setbuttonClicked(false);
    }
  };

  const followUser = async () => {
    setfollowButtonClicked(true);
    let requestBody;
    if (!followed) {
      requestBody = {
        query: `
                    mutation FollowUser($userId: String!) {
                        followUser(userId: $userId) {
                            _id
                            name
                        }
                    }
                `,
        variables: {
          userId: singleUserFromStore._id
        }
      };
    } else {
      requestBody = {
        query: `
                    mutation UnfollowUser($userId: String!) {
                        unFollowUser(userId: $userId) {
                            _id
                            name
                        }
                    }
                `,
        variables: {
          userId: singleUserFromStore._id
        }
      };
    }

    const followResponse = await axios.post("graphql", requestBody, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      }
    });
    setfollowButtonClicked(false);
    if (followResponse.data.data.followUser) {
      setfollowed(true);
      const followButton = document.querySelector(
        ".userProfile__user-flex__details__buttons-flex__link button"
      );
      followButton.style.backgroundColor = "green";
      const userState = { ...singleUserFromStore };
      userState.followers.push(followResponse.data.data.followUser);
      dispatch({
        type: ActionTypes.SET_SINGLE_USER,
        user: userState,
        id: props.match.params.id,
        userId: userId
      });
    } else {
      setfollowed(false);
      const followButton = document.querySelector(
        ".userProfile__user-flex__details__buttons-flex__link button"
      );
      followButton.style.backgroundColor = "#05386B";
      const userState = { ...singleUserFromStore };
      const filteredFollowers = userState.followers.filter(p => {
        return p._id !== userId;
      });
      userState.followers = filteredFollowers;
      dispatch({
        type: ActionTypes.SET_SINGLE_USER,
        user: userState,
        id: props.match.params.id,
        userId: userId
      });
    }
  };

  const onGoTofollowerProfile = id => {
    props.history.push("/userprofile/" + id);
  };

  return (
    <div className="userProfile">
      <h1>Profile</h1>
      {isLoading ? (
        <Spinner />
      ) : (
        singleUserFromStore && (
          <>
            <ProfilePage
              viewBackdrop={viewBackdropp}
              photo={singleUserFromStore.photo}
              name={singleUserFromStore.name}
              email={singleUserFromStore.email}
              date={singleUserFromStore.createdAt}
              token={token}
              userId={userId}
              profileUserId={singleUserFromStore._id}
              followUser={followUser}
              followed={followed}
              followButtonClicked={followButtonClicked}
            />
            <hr />
            <div className="userProfile__userActivities-flex">
              <div className="userProfile__userActivities-flex__activity">
                <span>{singleUserFromStore.followers.length}</span> Followers
                <hr />
                <ul>
                  {singleUserFromStore.followers.map(follower => {
                    return (
                      <li key={follower._id}>
                        <span
                          onClick={onGoTofollowerProfile.bind(
                            this,
                            follower._id
                          )}
                        >
                          {follower.name}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="userProfile__userActivities-flex__activity">
                <span>{singleUserFromStore.following.length}</span> Following
                <hr />
                <ul>
                  {singleUserFromStore.following.map(follower => {
                    return (
                      <li key={follower._id}>
                        <span
                          onClick={onGoTofollowerProfile.bind(
                            this,
                            follower._id
                          )}
                        >
                          {follower.name}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="userProfile__userActivities-flex__activity">
                <span>{singleUserFromStore.posts.length}</span> Posts
                <hr />
                <ul>
                  {singleUserFromStore.posts.map(post => {
                    return (
                      <li key={post._id}>
                        <span onClick={onGoToPost.bind(this, post)}>
                          {post.title}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </>
        )
      )}
      <hr />
      <Backdrop show={viewBackdrop} />
      <CSSTransition
        mountOnEnter
        unmountOnExit
        timeout={{
          enter: 1000,
          exit: 500
        }}
        in={viewModal}
        classNames={{
          enter: "",
          enterActive: "ModalOpen",
          exit: "",
          exitActive: "ModalClose"
        }}
      >
        <EditProfileModal viewModal={viewModal}>
          <h1>Edit Your Profile</h1>
          <div className="editProfile__icon" onClick={closeBackdrop}>
            <i className="fas fa-times-circle"></i>
          </div>
          <form className="editProfile__form">
            {imageSelected ? (
              <img src={imageSelected} alt="profileImage" />
            ) : null}
            <Button type="submit" disabled={buttonClicked} click={editProfile}>
              Edit Profile
            </Button>
          </form>
        </EditProfileModal>
      </CSSTransition>
    </div>
  );
};

export default UserProf;
