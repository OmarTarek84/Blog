import React from 'react';
import Blog from './Blog/Blog';

const blogs = props => {
    return props.blogs.map(post => {
        return <Blog key={post._id}
                     photo={post.photo}
                     title={post.title}
                     body={post.body.substring(0, 150) + '...'}
                     postCreator={post.user.name}
                     createdAt={post.createdAt}
                     onGoToPost={props.goToPost.bind(this, post._id)} />;
    });
};

export default blogs;