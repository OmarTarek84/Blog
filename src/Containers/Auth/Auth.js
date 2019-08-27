import React, {Component} from 'react';
import './Auth.css';
import Input from '../../Components/Form/Form';
import Button from '../../Components/Button/Button';
import axios from 'axios';
import ErrorComponent from '../../hoc/Error';

class Auth extends Component {

    signal = axios.CancelToken.source();
    state = {
        authForm: {
            name: {
                elementType: 'input',
                elementConfig: {
                    placeholder: 'Type Your Name Here',
                    type: 'text',
                    name: 'name',
                    label: 'Name'
                },
                value: '',
                valid: false,
                validationRules: {
                    required: true
                },
                touched: false,
                errorMessage: 'This Field is Required!'
            },
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
                    minLength: true
                },
                touched: false,
                errorMessage: 'Password should have at least 8 characters'
            },
            confirm_password: {
                elementType: 'input',
                elementConfig: {
                    placeholder: 'Confirm Your Password',
                    type: 'password',
                    name: 'confirmpassword',
                    label: 'Confirm Password'
                },
                value: '',
                valid: false,
                validationRules: {
                    required: true,
                    passwordMatch: true
                },
                touched: false,
                errorMessage: 'Passwords Do Not Match'
            },
            Photo: {
                elementType: 'input',
                elementConfig: {
                    type: 'file',
                    name: 'image',
                    label: 'Pick Your Profile Photo'
                },
                validationRules: {
                    required: true
                },
                value: '',
                valid: true,
                errorMessage: ''
            }
        },
        formIsValid: false,
        imageSelected: null,
        file: null,
        isLogged: false
    }

    componentWillUnmount() {
        this.signal.cancel();
    }

    changeInput = (event, inputType) => {
        const authForm = {...this.state.authForm};
        const stateElement = authForm[inputType];
        stateElement.value = event.target.value;
        stateElement.touched = true;
        if (inputType === 'Photo') {
            const file = event.target.files[0];
            this.setState({imageSelected: URL.createObjectURL(file), file: file});
        }
        if (inputType === 'password') {
            authForm['confirm_password'].value = '';
            authForm['confirm_password'].valid = false;
        }
        if (inputType === 'confirm_password') {
            if (stateElement.value === authForm['password'].value) {
                stateElement.valid = true;
            } else {
                stateElement.valid = false;
            }
        } else {
            stateElement.valid = this.checkValidity(stateElement.validationRules, stateElement.value);
        }
        authForm[inputType] = stateElement;

        let formIsValid = true;
        for (let key in authForm) {
            formIsValid = authForm[key].valid && formIsValid;
        }

        this.setState({authForm: authForm, formIsValid: formIsValid});
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

    signup = (event) => {
        this.setState({isLogged: true});
        event.preventDefault();
        const formData = new FormData();
        formData.append('image', this.state.file);
        axios.put('/insertImage', formData).then(path => {
            const imagePath = path.data.filepath;
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
                    name: this.state.authForm.name.value,
                    email: this.state.authForm.email.value,
                    password: this.state.authForm.password.value,
                    photo: imagePath
                }
            };
    
            return axios.post('/graphql', requestBody, {
                headers: {
                    'Content-Type': 'application/json'
                },
                cancelToken: this.signal.token
            }).then(result => {
                if (result !== undefined) {
                    this.props.history.push('/signin');
                }
                this.setState({isLogged: false});
            })
            .catch(err => {
                this.setState({isLogged: false});
                console.log(err);
            });
        })
    }

    render() {
        let elementsArray = [];
        for (let key in this.state.authForm) {
            elementsArray.push({
                id: key,
                config: this.state.authForm[key]
            });
        }
        return (
            <div className="auth">
                <form>
                    <h1>Sign Up</h1>
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
                    <Button type="submit" centered disabled={!this.state.formIsValid || this.state.isLogged} click={this.signup}>Submit</Button>
                    <div className="image">
                        {this.state.imageSelected
                         ?
                         <img style={{width: '150px', height: '150px'}} src={this.state.imageSelected} alt="sdilhf" />
                         :
                         null
                        }
                    </div>
                </form>
            </div>
        )
    }
}

export default ErrorComponent(Auth, axios);