import React, {useState} from "react";
import "../Auth/Auth";
import Input from "../../../shared/Form/Input/Input";
import Button from "../../../shared/UI/Button/Button";
import * as UserActionCreators from "../../../store/actionCreators/User.js";
import { Link } from "react-router-dom";
import { useHttpClient } from "../../../shared/http/http";
import { useForm } from "../../../shared/Form/FormState/FormState";
import { REQUIRE, EMAIL } from "../../../shared/Form/Validators/Validators";
import Spinner from "../../../shared/UI/Spinner/Spinner";
import ErrorModal from "../../../shared/UI/ErrorModal/ErrorModal";
import { useDispatch } from "react-redux";

const Signin = props => {
  const { sendRequest, isLoading } = useHttpClient();
  const [signinError, setSigninError] = useState('');
  const dispatch = useDispatch();
  const [initialState, inputHandler] = useForm(
    {
      email: {
        value: "",
        isValid: false
      },
      password: {
        value: "",
        isValid: false
      }
    },
    false
  );

  const signin = async event => {
    event.preventDefault();
    console.log(initialState);
    const requestBody = {
      query: `
                query LoginUser($email: String!, $password: String!) {
                    loginUser(loginInput: {email: $email, password: $password}) {
                        userId
                        token
                      }
                }
            `,
      variables: {
        email: initialState.inputs.email.value,
        password: initialState.inputs.password.value
      }
    };

    try {
      const responseData = await sendRequest("graphql", requestBody, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      const token = responseData.data.data.loginUser.token;
      const userId = responseData.data.data.loginUser.userId;
      dispatch(UserActionCreators.signinSucess(token, userId, null));
      props.history.push("/posts");
    } catch (err) {
      setSigninError(err);
    }
  };

  let form;
  if (isLoading) {
    form = <Spinner />;
  } else {
    form = (
      <>
        <form className="signinForm">
          <h1>Sign In</h1>
          <div className="formParent">
            <Input
              id="email"
              type="text"
              placeholder="Your Email"
              onInput={inputHandler}
              label="Email"
              validators={[REQUIRE(), EMAIL()]}
            />
            <Input
              id="password"
              type="password"
              placeholder="Your Password"
              onInput={inputHandler}
              label="Password"
              validators={[REQUIRE()]}
            />
          </div>
          <Button
            type="submit"
            centered
            disabled={!initialState.formIsValid}
            click={signin}
          >
            Log In
          </Button>
        </form>
        <div className="notUser">
          <p>
            Don't Have An Account? <Link to="/auth">Sign Up</Link>
          </p>
        </div>
      </>
    );
  }

  return (
    <div className="auth">
      {form}
      <ErrorModal
        open={!!signinError}
        onClose={() => setSigninError("")}
        errorMessage={
          signinError.response &&
          signinError.response.data &&
          signinError.response.data.errors[0]
            ? signinError.response.data.errors[0].message
            : "Unknown Error, We'll fix it soon"
        }
      />
    </div>
  );
};

export default Signin;
