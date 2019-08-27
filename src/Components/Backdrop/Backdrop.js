import React from 'react';
import './Backdrop.css';

const backdrop = props => {
    return props.show ? <div className='backdrop' onClick={props.clicked}>{props.children}</div> : null;
};

export default backdrop;