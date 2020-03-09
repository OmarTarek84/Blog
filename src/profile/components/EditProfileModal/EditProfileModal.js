import React from 'react';
import './EditProfileModal.css';

const profileModal = props => {
    return (
        <div className="profileModal">{props.children}</div>
    )
};

export default profileModal;