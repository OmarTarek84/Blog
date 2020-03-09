import React, {Component} from 'react';
import Backdrop from '../../../shared/UI/Backdrop/Backdrop';
import EditProfileModal from '../../components/EditProfileModal/EditProfileModal';
import './UserProfile.css';
import Button from '../../../shared/UI/Button/Button';
import Input from '../../../shared/Form/Form/Form';
import CSSTransition from 'react-transition-group/CSSTransition';
import ProfilePage from '../../components/UserProfile/UserProfile';
import axios from 'axios';
import Spinner from '../../../shared/UI/Spinner/Spinner';
import {connect} from 'react-redux';
import ErrorComponent from '../../../hoc/Error';

class UserProf extends Component {

    signal = axios.CancelToken.source();
    state = {
        viewBackdrop: false,
        viewModal: false,
        imageSelected: null,
        editprofileForm: {
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
        file: null,
        user: null,
        buttonClicked: false,
        followed: false,
        followButtonClicked: false
    }

    componentDidMount() {
        const requestBody = {
            query: `
                query SingleUser($userId: String!) {
                    singleUser(userId: $userId) {
                        _id
                        name
                        email
                        photo
                        createdAt
                        posts {
                            _id
                            title
                            likes {
                                _id
                                name
                            }
                        }
                        followers {
                            _id
                            name
                        }
                        following {
                            _id
                            name
                        }
                    }
                }
            `,
            variables: {
                userId: this.props.match.params.id
            }
        };
        return axios.post('http://localhost:8080/graphql', requestBody, {
            headers: {
                'Content-Type': 'application/json'
            },
            cancelToken: this.signal.token
        }).then(result => {
            const userProfile = result.data.data.singleUser;
            this.setState({user: userProfile});
            userProfile.followers.forEach(follower => {
                if (follower._id === this.props.userId) {
                    this.setState({followed: true});
                    const followButton = document.querySelector('.userProfile__user-flex__details__buttons-flex__link button');
                    const input = document.querySelector('input[class="followInput"]');
                    input.checked = true;
                    followButton.style.backgroundColor = 'green';
                }
            });
        });
    }

    componentWillUnmount() {
        this.signal.cancel('cancelled');
    }

    changeInput = (event, inputType) => {
        const editprofileForm = {...this.state.editprofileForm};
        const stateElement = editprofileForm[inputType];
        if (inputType === 'Photo') {
            const file = event.target.files[0];
            this.setState({file: file, imageSelected: URL.createObjectURL(file)});
        }
        stateElement.value = event.target.value;
        stateElement.touched = true;
        if (inputType === 'password') {
            editprofileForm['confirm_password'].value = '';
            editprofileForm['confirm_password'].valid = false;
        }
        if (inputType === 'confirm_password') {
            if (stateElement.value === editprofileForm['password'].value) {
                stateElement.valid = true;
            } else {
                stateElement.valid = false;
            }
        } else {
            stateElement.valid = this.checkValidity(stateElement.validationRules, stateElement.value);
        }
        editprofileForm[inputType] = stateElement;

        let formIsValid = true;
        for (let key in editprofileForm) {
            formIsValid = editprofileForm[key].valid && formIsValid;
        }

        this.setState({editprofileForm: editprofileForm, formIsValid: formIsValid});
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

    viewBackdrop = () => {
        const form = {...this.state.editprofileForm};
        const name = form['name'];
        name.value = this.state.user.name;
        name.valid = true;
        form['name'] = name;

        const email = form['email'];
        email.value = this.state.user.email;
        email.valid = true;
        form['email'] = email;

        return this.setState({viewBackdrop: true, viewModal: true, editProfileForm: form, imageSelected: this.state.user.photo});
    }

    closeBackdrop = () => {
        this.setState({viewBackdrop: false, viewModal: false});
    }

    onGoToPost = (post) => {
        this.signal.cancel('cancelled');
        localStorage.setItem('post', JSON.stringify(post));
        this.props.history.push({
            pathname: '/post/' + post._id,
            postId: post._id
        });
    }

    editProfile = (event) => {
        event.preventDefault();
        this.setState(prevState => {
            return {
                editProfileForm: {
                    ...prevState.editProfileForm,
                    photo: {
                        ...prevState.editProfileForm.photo,
                        value: ''
                    }
                }
            }
        })
        this.setState({buttonClicked: true});
        const formData = new FormData();
        formData.append('image', this.state.file);
        return axios.put('/insertupdatePostImage', formData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.props.token
            }
        }).then(filePath => {
            const filepath = filePath.data.filePath;
            let path;
            if (filepath === 'notFound') {
                path = this.state.user.photo;
            } else {
                path = filepath;
            }
            const requestBody = {
                query: `
                    mutation EditUserProfile($id: String!, $name: String!, $email: String!, $password: String, $photo: String!) {
                        editUserProfile(editProfileInput: {
                            id: $id,
                            name: $name,
                            email: $email,
                            password: $password,
                            photo: $photo
                          }) {
                            _id
                            name
                            email
                            photo
                            createdAt
                            posts {
                                _id
                                title
                            }
                          }
                    }
                `,
                variables: {
                    id: this.props.match.params.id,
                    name: this.state.editprofileForm.name.value,
                    email: this.state.editprofileForm.email.value,
                    password: this.state.editprofileForm.password.value,
                    photo: path
                }
            }
            return axios.post('http://localhost:8080/graphql', requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.props.token
                }
            }).then(result => {
                const updatedUser = result.data.data.editUserProfile;
                const userState = {...this.state.user};
                userState.email = updatedUser.email;
                userState.password = updatedUser.password;
                userState.name = updatedUser.name;
                userState.photo = path;
                this.setState({buttonClicked: false, viewBackdrop: false, viewModal: false, user: userState})
            })
        })
    }

    followUser = () => {
        this.setState({followButtonClicked: true});
        let requestBody;
        if (!this.state.followed) {
            requestBody = {
                query: `
                    mutation FollowUser($userId: String!) {
                        followUser(userId: $userId) {
                            _id
                            name
                        }
                    }
                `,
                variables: {
                    userId: this.state.user._id
                }
            };
        } else {
            requestBody = {
                query: `
                    mutation UnfollowUser($userId: String!) {
                        unFollowUser(userId: $userId) {
                            _id
                            name
                        }
                    }
                `,
                variables: {
                    userId: this.state.user._id
                }
            };
        }

        return axios.post('http://localhost:8080/graphql', requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.props.token
            }
        }).then(result => {
            this.setState({followButtonClicked: false})
            if (result.data.data.followUser) {
                this.setState({followed: true});
                const followButton = document.querySelector('.userProfile__user-flex__details__buttons-flex__link button');
                followButton.style.backgroundColor = 'green';
                const userState = {...this.state.user};
                userState.followers.push(result.data.data.followUser)
                this.setState({user: userState});
            } else {
                this.setState({followed: false});
                const followButton = document.querySelector('.userProfile__user-flex__details__buttons-flex__link button');
                followButton.style.backgroundColor = '#05386B';
                const userState = {...this.state.user};
                const filteredFollowers = userState.followers.filter(p => {
                    return p._id !== this.props.userId
                })
                userState.followers = filteredFollowers;
                this.setState({user: userState});
            }
        })
    }

    onGoTofollowerProfile = (id) => {
        this.props.history.push('/userprofile/' + id);
        const requestBody = {
            query: `
                query SingleUser($userId: String!) {
                    singleUser(userId: $userId) {
                        _id
                        name
                        email
                        photo
                        createdAt
                        posts {
                            _id
                            title
                            likes {
                                _id
                                name
                            }
                        }
                        followers {
                            _id
                            name
                        }
                        following {
                            _id
                            name
                        }
                    }
                }
            `,
            variables: {
                userId: id
            }
        };
        return axios.post('http://localhost:8080/graphql', requestBody, {
            headers: {
                'Content-Type': 'application/json'
            },
            cancelToken: this.signal.token
        }).then(result => {
            const userProfile = result.data.data.singleUser;
            if (userProfile.followers.length <= 0) {
                this.setState({followed: false});
                const followButton = document.querySelector('.userProfile__user-flex__details__buttons-flex__link button');
                const input = document.querySelector('input[class="followInput"]');
                if (input) {
                    input.checked = false;
                    followButton.style.backgroundColor = '#05386B';
                }
            }
            this.setState({user: userProfile});
            userProfile.followers.forEach(follower => {
                if (follower._id === this.props.userId) {
                    this.setState({followed: true});
                    const followButton = document.querySelector('.userProfile__user-flex__details__buttons-flex__link button');
                    followButton.style.backgroundColor = 'green';
                }
            });
        });
    }

    render() {
        let elementArray = [];
        for (let key in this.state.editprofileForm) {
            elementArray.push({
                id: key,
                config: this.state.editprofileForm[key]
            });
        }
        const {user} = this.state;
        if (user === null) {
            return <Spinner />
        }
        return (
            <div className="userProfile">
            <h1>Profile</h1>
            <ProfilePage        viewBackdrop={this.viewBackdrop}
                                photo={this.state.user.photo}
                                name={this.state.user.name}
                                email={this.state.user.email}
                                date={this.state.user.createdAt}
                                token={this.props.token}
                                userId={this.props.userId}
                                profileUserId={this.state.user._id}
                                followUser={this.followUser}
                                followed={this.state.followed}
                                followButtonClicked={this.state.followButtonClicked} />
                    <hr />
            <div className="userProfile__userActivities-flex">
                <div className="userProfile__userActivities-flex__activity">
                    <span>{this.state.user.followers.length}</span> Followers
                    <hr />
                    <ul>
                        {this.state.user.followers.map(follower => {
                            return (                                
                                <li key={follower._id}>
                                    <span onClick={this.onGoTofollowerProfile.bind(this, follower._id)}>{follower.name}</span>
                                </li>
                            )
                        })}
                    </ul>
                </div>
                <div className="userProfile__userActivities-flex__activity">
                    <span>{this.state.user.following.length}</span> Following
                    <hr />
                    <ul>
                    {this.state.user.following.map(follower => {
                        return (                                
                            <li key={follower._id}>
                                <span onClick={this.onGoTofollowerProfile.bind(this, follower._id)}>{follower.name}</span>
                            </li>
                        )
                    })}
                    </ul>
                </div>
                <div className="userProfile__userActivities-flex__activity">
                    <span>{this.state.user.posts.length}</span> Posts
                    <hr />
                    <ul>
                        {this.state.user.posts.map(post => {
                            return (
                                <li key={post._id}>
                                    <span onClick={this.onGoToPost.bind(this, post)}>{post.title}</span>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>
            <hr />
            <Backdrop show={this.state.viewBackdrop} />
            <CSSTransition mountOnEnter
                           unmountOnExit
                           timeout={{
                               enter: 1000,
                               exit: 500
                           }}
                           in={this.state.viewModal}
                           classNames={{
                               enter: '',
                               enterActive: 'ModalOpen',
                               exit: '',
                               exitActive: 'ModalClose'
                           }}>
                <EditProfileModal viewModal={this.state.viewModal}>
                    <h1>Edit Your Profile</h1>
                    <div className="editProfile__icon" onClick={this.closeBackdrop}>
                        <i className="fas fa-times-circle"></i>
                    </div>
                    <form className="editProfile__form">
                        {elementArray.map(element => {
                                return (
                                    <div key={element.id}>
                                        <Input elementType={element.config.elementType}
                                            elementConfig={element.config.elementConfig}
                                            value={element.config.value}
                                            invalidN={!element.config.valid}
                                            touched={element.config.touched}
                                            label={element.config.label}
                                            key={element.id}
                                            changed={(event) => this.changeInput(event, element.id)}
                                            errorMessage={element.config.errorMessage} />
                                    </div>
                                )
                            })}
                            {this.state.imageSelected
                             ?
                             <img src={this.state.imageSelected} alt="profileImage" />
                             :
                             null}
                            <Button type="submit" disabled={!this.state.formIsValid || this.state.buttonClicked} click={this.editProfile}>Edit Profile</Button>
                    </form>
                </EditProfileModal>
            </CSSTransition>
        </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        userId: state.auth.userId,
        token: state.auth.token
    }
}

export default connect(mapStateToProps)(UserProf);