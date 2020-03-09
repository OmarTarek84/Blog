import React, {Component} from 'react';
import './NavigationButton.css';
import NavigationItem from '../../components/Navigation/NavigationItem/NavigationItem';
import CSSTransition from 'react-transition-group/CSSTransition';
import {connect} from 'react-redux';

class NavigationButton extends Component {
    state = {
        navOpen: false
    }

    closeNav = () => {
        this.setState({navOpen: false})
    }

    openNav = () => {
        this.setState({navOpen: true})
    }
    render() {
        let navlinks;
        if (!this.props.token) {
            navlinks = (
                <>
                    <NavigationItem link="/" closenav={this.closeNav}>Home</NavigationItem>
                    <NavigationItem link="/auth" closenav={this.closeNav}>Sign Up</NavigationItem>
                    <NavigationItem link="/signin" closenav={this.closeNav}>Sign In</NavigationItem>
                    <NavigationItem link="/posts" closenav={this.closeNav}>Posts</NavigationItem>
                </>
            )
        } else {
            navlinks = (
                <>
                    <NavigationItem link="/" closenav={this.closeNav}>Home</NavigationItem>
                    <NavigationItem link="/posts" closenav={this.closeNav}>Posts</NavigationItem>
                    <NavigationItem link="/newpost" closenav={this.closeNav}>Create New Post</NavigationItem>
                    <NavigationItem link={"/userprofile/" + this.props.userId} closenav={this.closeNav}>My Profile</NavigationItem>
                    <NavigationItem link="/logout" closenav={this.closeNav}>Logout</NavigationItem>
                </>
            )
        }
        return (
            <nav className="nav">
                <label htmlFor="menu">menu</label>
                <input type="checkbox" id="menu" />
                <div className="navigationButton__marks" onClick={this.openNav}>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <CSSTransition mountOnEnter 
                               unmountOnExit
                               in={this.state.navOpen}
                               timeout={700}
                               classNames={{
                                   enter: '',
                                   enterActive: 'OpenNav',
                                   exit: '',
                                   exitActive: 'CloseNav'
                               }}>
                    <div className="nav__navItems">
                        <div className="nav__navItems__close">
                            <div className="nav__navItems__close__marks" onClick={this.closeNav}>
                                <div></div>
                                <div></div>
                            </div>
                        </div>
                        <ul className="nav__navItems__items">
                               {navlinks}
                        </ul>
                    </div>
                </CSSTransition>
            </nav>
        )
    }
}

const mapStateToProps = state => {
    return {
        token: state.auth.token,
        userId: state.auth.userId
    };
};

export default connect(mapStateToProps)(NavigationButton);