import React from 'react';
import './Button.css';

const button = props => {
    const classes = ['myButton'];
    if (props.centered) {
        classes.push('centered');
    }

    if (props.red) {
        classes.push('red');
    }
    return (
        <button onClick={props.click} className={classes.join(' ')} type={props.type} disabled={props.disabled}>
            {props.children}
        </button>
    )
};

export default button;