import React from 'react';
import './Comment.css';

const comment = props => {
    return (
        <div className="post__comments__comments__comment">
            <p>{props.comment}</p>
            <p>Posted By <span>{props.user}</span> on <span>{props.date}</span></p>
        </div>
    )
};

export default comment;