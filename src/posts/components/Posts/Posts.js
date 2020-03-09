import React from 'react';
import './Posts.css';
import Button from '../../Button/Button';
import Spinner from '../../../shared/UI/Spinner/Spinner';

const post = props => {
    var indexOfLastTodo = props.activePage * props.itemPerPage;
    var indexOfFirstTodo = indexOfLastTodo - props.itemPerPage;
    var renderedPosts = props.posts.slice(indexOfFirstTodo, indexOfLastTodo);
    return props.isLoading
    ?
    <Spinner />
    :
    renderedPosts.map(post => {
        return (
                <div className="post" key={post._id}>
                    <div className="post__title">{post.title}</div>
                    <div className="post__desc">{post.body.substring(0,300) + '...'}</div>
                    <div className="post__button__link">
                        <Button click={props.onGoToSinglePost.bind(this, post._id)}>Read More</Button>
                    </div>
                </div>
        )
    }); 
};

export default post;