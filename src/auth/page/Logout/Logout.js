import React, { useEffect } from "react";
import { Redirect } from "react-router-dom";
import * as ActionCreators from "../../../store/actionCreators/User";
import { useDispatch } from "react-redux";

const Logout = props => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(ActionCreators.logout());
  }, []);
  return <Redirect to="/" />;
};

export default Logout;
