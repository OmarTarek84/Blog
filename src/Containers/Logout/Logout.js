import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Redirect} from 'react-router-dom';
import * as ActionCreators from '../../store/actionCreators/User';
import axios from 'axios';

class Logout extends Component {

    componentDidMount() {
        this.props.onLogout();
    }
    render() {
        return (
            <Redirect to="/" />
        )
    }
}

const mapStateToProps = state => {
    return {
        token: state.auth.token,
        userId: state.auth.userId
    };
};

const mapDispatchToProps = dispatch => {
    return {
        onLogout: () => dispatch(ActionCreators.logout())
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Logout);