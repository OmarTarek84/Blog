import React, {Component} from 'react';
import '../Auth/Auth';
import Input from '../../Components/Form/Form';
import Button from '../../Components/Button/Button';
import axios, {CancelToken} from 'axios';
import {connect} from 'react-redux';
import * as UserActionCreators from '../../store/actionCreators/User.js';
import ErrorComponent from '../../hoc/Error';
import {Link} from 'react-router-dom';

class Signin extends Component {

    isActive = true;
    state = {
        signinForm: {
            email: {
                elementType: 'input',
                elementConfig: {
                    placeholder: 'Type Your Email Here',
                    type: 'email',
                    name: 'email',
                    label: 'Email',
                    
                },
                value: '',
                valid: false,
                validationRules: {
                    required: true,
                    emailValid: true
                },
                touched: false,
                errorMessage: 'Invalid Email'
            },
            password: {
                elementType: 'input',
                elementConfig: {
                    placeholder: 'Type Your Password Here',
                    type: 'password',
                    name: 'password',
                    label: 'Password'
                },
                value: '',
                valid: false,
                validationRules: {
                    required: true,
                },
                touched: false,
                errorMessage: 'Password is Required'
            },
        },
        formIsValid: false,
        loggedIn: false
    }

    componentWillUnmount() {
        this.isActive = false;
      }

    changeInput = (event, inputType) => {
        const signinForm = {...this.state.signinForm};
        const stateElement = signinForm[inputType];
        stateElement.value = event.target.value;
        stateElement.touched = true;
        stateElement.valid = this.checkValidity(stateElement.validationRules, stateElement.value);
        signinForm[inputType] = stateElement;

        let formIsValid = true;
        for (let key in signinForm) {
            formIsValid = signinForm[key].valid && formIsValid;
        }

        this.setState({signinForm: signinForm, formIsValid: formIsValid});
    }

    checkValidity = (rules, value) => {
        let isValid = true;
        if (rules.required) {
            isValid = value.trim() !== '' && isValid;
        }

        if (rules.emailValid) {
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            isValid = re.test(value) && isValid;
        }

        if (rules.minLength) {
            isValid = value.length >= 8 && isValid;
        }

        return isValid;

    }

    signin = (event) => {
        event.preventDefault();
        this.setState({loggedIn: true});
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
                email: this.state.signinForm.email.value,
                password: this.state.signinForm.password.value,
            }
        };

        return axios.post('/graphql', requestBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(result => {
            const token = result.data.data.loginUser.token;
            const userId = result.data.data.loginUser.userId;
            this.props.onSignIn(token, userId);
        })
        .then(res => {
            this.props.history.push('/posts');
            if (this.isActive) {
                this.setState({loggedIn: false});
            }
        })
        .catch(err => {
            this.props.signinFail(err);
            this.setState({loggedIn: false});
        });
    };

    render() {
        let elementsArray = [];
        for (let key in this.state.signinForm) {
            elementsArray.push({
                id: key,
                config: this.state.signinForm[key]
            });
        }
        return (
            <div className="auth">
                <form className="signinForm">
                    <h1>Sign In</h1>
                    <div className="formParent">
                    {elementsArray.map(element => {
                        return (
                            <div key={element.id}>
                                <Input value={element.config.value}
                                      elementType={element.config.elementType}
                                      elementConfig={element.config.elementConfig}
                                      label={element.config.elementConfig.label}
                                      changed={(event) => this.changeInput(event, element.id)}
                                      invalid={!element.config.valid}
                                      touched={element.config.touched}
                                      errorMessage={element.config.errorMessage} />
                            </div>
                        )
                    })}
                    </div>
                    <Button type="submit" centered disabled={!this.state.formIsValid || this.state.loggedIn} click={this.signin}>Log In</Button>
                </form>
                <div className="notUser">
                    <p>Don't Have An Account? <Link to="/auth">Sign Up</Link></p>
                </div>
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {

    }
};

const mapDispatchToProps = dispatch => {
    return {
        onSignIn: (token, userId) => dispatch(UserActionCreators.signinExpiration(token, userId)),
        signinFail: (err) => dispatch(UserActionCreators.signinFail(err))
    }
};

export default ErrorComponent(connect(mapStateToProps, mapDispatchToProps)(Signin), axios);