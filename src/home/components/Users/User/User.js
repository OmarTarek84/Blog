import React from 'react';
import './User.css';
import Button from '../../../../shared/UI/Button/Button';

const user = props => {
    return (
        <div className="mostActiveUsers__flex__user">
            <div className="mostActiveUsers__flex__user__image">
                <img className="lazyload" data-src={props.userPhoto} alt="userPic" />
            </div>
            <h4>{props.name}</h4>
            <p>Number of Blogs: <span>{props.postNumber}</span></p>
            <Button click={props.onGoToProfile}>View Profile</Button>
        </div>
    )
};

export default user;