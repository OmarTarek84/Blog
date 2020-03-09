import React from 'react';
import {NavLink} from 'react-router-dom';
import './NavigationItem.css';

const navigationItem = props => {
    return (
        <li className="navItemLi" onClick={props.closenav}>
            <NavLink to={props.link} exact>{props.children}</NavLink>
        </li>
    )
};

export default navigationItem;