import React, { useEffect } from "react";
import { Redirect } from "react-router-dom";
import * as ActionCreators from "../../../store/actionCreators/User";

const Logout = props => {
  useEffect(() => {
    ActionCreators.logout();
  }, []);
  return <Redirect to="/" />;
};

export default Logout;
