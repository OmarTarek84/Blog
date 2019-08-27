import React from 'react';
import './UserProfile.css';
import {Link} from 'react-router-dom';
import Button from '../Button/Button';
import UserImage from '../../assets/avatar.jpg';

const userProfile = props => {
    return (
        <div className="userProfile__user-flex">
            <div className="userProfile__user-flex__photo">
                <img src={props.photo} alt="user" />
            </div>
            <div className="userProfile__user-flex__details">
                <p>Name: <span>{props.name}</span></p>
                <p>Email: <span>{props.email}</span></p>
                <p>Joined: <span>{props.date}</span></p>
                <div className="userProfile__user-flex__details__buttons-flex">
                    {props.token
                     ?
                        props.userId === props.profileUserId
                         ?
                         <>
                         <div className="userProfile__user-flex__details__buttons-flex__link">
                            <Link to="/newpost">Create Post</Link>
                        </div>
                        <div className="userProfile__user-flex__details__buttons-flex__link">
                            <Button type="button" click={props.viewBackdrop}>Edit Profile</Button>
                        </div>
                        </>
                         :
                         null
                     :
                     null}
                     {props.token && props.userId !== props.profileUserId
                      ?
                      <div className="userProfile__user-flex__details__buttons-flex__link">
                        <Button type="button" click={props.followUser} disabled={props.followButtonClicked}>
                            <input type="checkbox" className="followInput" />
                            <i className="fas fa-plus"></i> {props.followed ? 'Unfollow' : 'Follow'}
                        </Button>
                      </div>
                      :
                      null}
                </div>
            </div>
        </div>
    )
};

export default userProfile;