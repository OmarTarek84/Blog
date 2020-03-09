import React from 'react';
import './Blog.css';
import Button from '../../../../shared/UI/Button/Button';

const blog = props => {
    return (
        <div className="recent_posts__flex__post">
            <div className="recent_posts__flex__post__image">
                <img className="lazyload" data-src={props.photo} alt="recent post Pic" />
            </div>
            <h2>{props.title}</h2>
            <p>{props.body}</p>
            <div className="recent_posts__flex__post__postedBy">
                Posted By <span>{props.postCreator}</span> on <span>{props.createdAt}</span>
            </div>
            <Button click={props.onGoToPost}>Read More</Button>
        </div>
    )
};

export default blog;