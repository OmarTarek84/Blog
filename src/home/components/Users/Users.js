import React from 'react';
import User from './User/User';

const users = props => {
    return props.users.map(user => {
        return <User key={user._id}
                     userPhoto={user.photo}
                     name={user.name}
                     postNumber={user.posts.length}
                     onGoToProfile={props.goToProfile.bind(this, user._id)} />;
    });
};

export default users;