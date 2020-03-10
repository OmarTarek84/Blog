import React, { useState } from "react";
import "./NavigationButton.css";
import NavigationItem from "../../components/Navigation/NavigationItem/NavigationItem";
import CSSTransition from "react-transition-group/CSSTransition";
import { useSelector } from "react-redux";

const NavigationButton = props => {
  const [navOpen, setNavOpen] = useState(false);
  const token = useSelector(state => state.auth.token);
  const userId = useSelector(state => state.auth.userId);

  const closeNav = () => {
    setNavOpen(false);
  };

  const openNav = () => {
    setNavOpen(true);
  };
  let navlinks;
  if (!token) {
    navlinks = (
      <>
        <NavigationItem link="/" closenav={closeNav}>
          Home
        </NavigationItem>
        <NavigationItem link="/auth" closenav={closeNav}>
          Sign Up
        </NavigationItem>
        <NavigationItem link="/signin" closenav={closeNav}>
          Sign In
        </NavigationItem>
        <NavigationItem link="/posts" closenav={closeNav}>
          Posts
        </NavigationItem>
      </>
    );
  } else {
    navlinks = (
      <>
        <NavigationItem link="/" closenav={closeNav}>
          Home
        </NavigationItem>
        <NavigationItem link="/posts" closenav={closeNav}>
          Posts
        </NavigationItem>
        <NavigationItem link="/newpost" closenav={closeNav}>
          Create New Post
        </NavigationItem>
        <NavigationItem link={"/userprofile/" + userId} closenav={closeNav}>
          My Profile
        </NavigationItem>
        <NavigationItem link="/logout" closenav={closeNav}>
          Logout
        </NavigationItem>
      </>
    );
  }
  return (
    <nav className="nav">
      <label htmlFor="menu">menu</label>
      <input type="checkbox" id="menu" />
      <div className="navigationButton__marks" onClick={openNav}>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <CSSTransition
        mountOnEnter
        unmountOnExit
        in={navOpen}
        timeout={700}
        classNames={{
          enter: "",
          enterActive: "OpenNav",
          exit: "",
          exitActive: "CloseNav"
        }}
      >
        <div className="nav__navItems">
          <div className="nav__navItems__close">
            <div className="nav__navItems__close__marks" onClick={closeNav}>
              <div></div>
              <div></div>
            </div>
          </div>
          <ul className="nav__navItems__items">{navlinks}</ul>
        </div>
      </CSSTransition>
    </nav>
  );
};

export default NavigationButton;
