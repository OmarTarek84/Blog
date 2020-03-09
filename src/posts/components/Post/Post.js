import React from 'react';
import  './Post.css';
import Button from '../../../shared/UI/Button/Button';
import {Link} from 'react-router-dom';

const post = props => {
    let fontAwesomeClasses = ['fas', 'fa-thumbs-up'];
    if (props.buttonClicked) {
        fontAwesomeClasses.push('clicked');
    }
    return (
        <div className="post">
            <h1>{props.title}</h1>
            <div className="post__image">
                <img src={props.image} alt="postImage" />
            </div>
             <div className="post__like">
                <div className="post__like__font">
                {props.token
                 ?
                    props.userId !== props.postUserId
                    ?
                    <>
                        <input type="checkbox" className="likeInput" onChange={props.like} disabled={props.buttonClicked} />
                        <i className={fontAwesomeClasses.join(' ')}></i>
                    </>
                    :
                    null
                 :
                 null}
                    <p><span>{props.numberOfLikes}</span> Likes</p>
                </div>
             </div>
            <div className="post__body">
                <p>{props.body}</p>
            </div>
            <div className="post__postedBy">
                <p>Posted By <span onClick={props.onGoToProfile.bind(this, props.userPostId)} style={{cursor: 'pointer', textDecoration: 'underline'}}>{props.postCreator}</span> On <span>{props.date}</span></p>
            </div>
            <div className="post__buttons">
                <div className="post__buttons__link">
                    <Link to="/posts">Back To Posts</Link>
                </div>
                {props.userId === props.postUserId
                 ?
                 <>
                    <div className="post__buttons__link">
                        <Button type="button" click={props.openBackdrop} disabled={props.disabled}>Update Post</Button>
                    </div>
                    <div className="post__buttons__link">
                        <Button type="button" red click={props.deletePost} disabled={props.disabledd}>Delete Post</Button>
                    </div>
                 </>
                : null
                }
            </div>
        </div>
    )
};

export default post;