import React from 'react';
import Comment from './Comment/Comment';

const comments = props => {
    return (
        <div className="post__comments__comments">
            <h3><span>{props.numberOfComments}</span> Comments</h3>
            {props.comments.map(comment => {
                return <Comment key={comment._id}
                                comment={comment.comment}
                                user={comment.user.name}
                                date={comment.createdAt} />
            })}
        </div>
    )
};

export default comments;