import React, { useState } from "react";
import "./Auth.css";
import Input from "../../../shared/Form/Input/Input";
import Button from "../../../shared/UI/Button/Button";
import { useHttpClient } from "../../../shared/http/http";
import { useForm } from "../../../shared/Form/FormState/FormState";
import {
  REQUIRE,
  EMAIL,
  MINLENGTH,
  MATCHPASSWORDS
} from "../../../shared/Form/Validators/Validators";
import ErrorModal from "../../../shared/UI/ErrorModal/ErrorModal";
import Spinner from "../../../shared/UI/Spinner/Spinner";

const Auth = props => {
  const [authErr, setAuthError] = useState("");
  const [file, setFile] = useState(null);
  const [imageSelected, setImageSelected] = useState(null);
  const { isLoading, sendRequest } = useHttpClient();
  const [initialState, inputHandler] = useForm(
    {
      name: {
        value: "",
        valid: false
      },
      email: {
        value: "",
        valid: false
      },
      password: {
        value: "",
        valid: false
      },
      confirmPassword: {
        value: "",
        valid: false
      }
    },
    false
  );

  const changeFile = event => {
    const filee = event.target.files[0];
    setFile(filee);
    setImageSelected(URL.createObjectURL(filee));
  };

  const signup = async event => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await sendRequest("/insertImage", formData, {
        "Content-Type": "application/json"
      });
      const imagePath = response.data.filepath;
      if (response.status >= 400) {
        setAuthError('Server Error');
      } else {
        const requestBody = {
          query: `
                            mutation CreateUser($name: String!, $email: String!, $password: String, $photo: String!) {
                                createUser(userInput: {name: $name, email: $email, password: $password, photo: $photo}) {
                                    _id
                                    name
                                    email
                                    photo
                                  }
                            }
                        `,
          variables: {
            name: initialState.inputs.name.value,
            email: initialState.inputs.email.value,
            password: initialState.inputs.password.value,
            photo: imagePath
          }
        };

        const response2 = await sendRequest("/graphql", requestBody, {
          headers: {
            "Content-Type": "application/json"
          }
        });
        if (response2.status < 400) {
          props.history.push("/signin");
        }
      }
    } catch (err) {
      setAuthError(err);
    }
  };

  let form;
  {
    isLoading
      ? (form = <Spinner />)
      : (form = (
          <>
            <form>
              <h1>Sign Up</h1>
              <div className="formParent">
                <Input
                  id="name"
                  placeholder="Type Your Name Here"
                  onInput={inputHandler}
                  validators={[REQUIRE()]}
                  label="Name"
                  type="text"
                />
                <Input
                  id="email"
                  placeholder="Type Your Email Here"
                  onInput={inputHandler}
                  validators={[REQUIRE(), EMAIL()]}
                  label="Email"
                  type="email"
                />
                <Input
                  id="password"
                  placeholder="Type Your Password Here"
                  onInput={inputHandler}
                  validators={[REQUIRE(), MINLENGTH(8)]}
                  label="Password"
                  type="password"
                />
                <Input
                  id="confirmPassword"
                  placeholder="Re-Enter Your Password"
                  onInput={inputHandler}
                  validators={[
                    REQUIRE(),
                    MATCHPASSWORDS(initialState.inputs.password.value)
                  ]}
                  label="Confirm Password"
                  type="password"
                />
                <input type="file" name="image" onChange={changeFile} />
              </div>
              <Button
                type="submit"
                centered
                disabled={!initialState.formIsValid || !file}
                click={signup}
              >
                Submit
              </Button>
              <div className="image">
                {imageSelected ? (
                  <img
                    style={{ width: "150px", height: "150px" }}
                    src={imageSelected}
                    alt="sdilhf"
                  />
                ) : null}
              </div>
            </form>
          </>
        ));
  }

  return (
    <div className="auth">
      {form}
      <ErrorModal
        open={!!authErr}
        onClose={() => setAuthError("")}
        errorMessage={
          authErr.response &&
          authErr.response.data &&
          authErr.response.data.errors[0]
            ? authErr.response.data.errors[0].message
            : "Unknown Error, We'll fix it soon"
        }
      />
    </div>
  );
};

export default Auth;
