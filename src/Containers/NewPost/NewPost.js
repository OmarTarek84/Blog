import React, {Component} from 'react';
import './NewPost.css';
import Button from '../../Components/Button/Button';
import Input from '../../Components/Form/Form';
import axios from 'axios';
import ErrorComponent from '../../hoc/Error';
import {connect} from 'react-redux';
import * as idb from 'idb';
import { ObjectID } from 'bson';
import ReactSnackBar from "react-js-snackbar";

const dbPromise = idb.openDB('allPosts', 1, (db) => {
    if (!db.objectStoreNames.contains('posts')) {
        db.createObjectStore('posts', {keyPath: '_id'});
    }

    if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', {keyPath: '_id'});
    }

    if (!db.objectStoreNames.contains('sync-posts')) {
        db.createObjectStore('sync-posts', {keyPath: '_id'});
    }
});

function createData(st, data) {
    return dbPromise.then(db => {
        var transaction = db.transaction(st, 'readwrite');
        var store = transaction.objectStore(st);
        store.put(data);
        return transaction.complete;
    });
}

class NewPost extends Component {
    signal = axios.CancelToken.source();
    state = {
        showSnackbar: false,
        newPostForm: {
            title: {
                elementType: 'input',
                elementConfig: {
                    placeholder: 'title of your post',
                    type: 'text',
                    name: 'title'
                },
                validationRules: {
                    required: true,
                    maxLength: true
                },
                valid: false,
                touched: false,
                value: '',
                label: 'Title',
                errorMessage: 'Characters should be between 1 and 30'
            },
            body: {
                elementType: 'textarea',
                elementConfig: {
                    placeholder: 'Body of your post',
                    type: 'text',
                    name: 'body'
                },
                validationRules: {
                    required: true
                },
                valid: false,
                touched: false,
                value: '',
                label: 'Body',
                errorMessage: 'This Field Is Required'
            },
            postPhoto: {
                elementType: 'input',
                elementConfig: {
                    type: 'file',
                    name: 'image'
                },
                validationRules: {
                    required: true,
                },
                valid: false,
                touched: false,
                value: '',
                label: 'Image Of Your Post',
                errorMessage: 'This Field Is Required'
            },
        },
        formIsValid: false,
        imageSelected: null,
        buttonClicked: false,
        file: null
    }

    componentWillUnmount() {
        this.signal.cancel('cancel');
    }

    changeInput = (event, inputType) => {
        const newPostForm = {...this.state.newPostForm};
        const stateElement = newPostForm[inputType];
        if (inputType === 'postPhoto' && event.target.files[0]) {
            const file = event.target.files[0];
            this.setState({imageSelected: URL.createObjectURL(file), file: file});
        }
        stateElement.value = event.target.value;
        stateElement.touched = true;
        stateElement.valid = this.checkValidity(stateElement.validationRules, stateElement.value);
        newPostForm[inputType] = stateElement;

        let formIsValid = true;
        for (let key in newPostForm) {
            formIsValid = newPostForm[key].valid && formIsValid;
        }

        this.setState({newPostForm: newPostForm, formIsValid: formIsValid});
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

        if (rules.maxLength) {
            isValid = value.length <= 30 && isValid;
        }

        return isValid;

    }

    //sync new post when offline

    sendNewPostToDB = (event) => {
        event.preventDefault();
        this.setState({buttonClicked: true, showSnackbar: true});
        const formData = new FormData();
        formData.append('image', this.state.file);
        return axios.put('/insertPostImage', formData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.props.token
            }
        }).then(path => {
            const filepath = path.data.filePath;
            const requestBody = {
                query: `
                    mutation CreatePost($title: String!, $body: String!, $photo: String!) {
                        createPost(postInput: {title: $title, body: $body, photo: $photo}) {
                            _id
                            title
                            body
                            photo
                            user {
                              _id
                              name
                              email
                              createdAt
                              updatedAt
                            }
                          }
                    }
                `,
                variables: {
                    title: this.state.newPostForm.title.value,
                    body: this.state.newPostForm.body.value,
                    photo: filepath
                }
            };
    
            return axios.post('/graphql', requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.props.token
                },
                cancelToken: this.signal.token
            }).then(result => {
                const newpost = result.data.data.createPost;
                navigator.serviceWorker.ready.then(reg => {
                    reg.active.postMessage(JSON.stringify({
                        postId: newpost._id,
                        userId: newpost.user._id,
                        postTitle: newpost.title,
                        postPhoto: newpost.photo,
                        userName: newpost.user.name
                    }));
                });
                // if (Notification.permission === 'granted') {
                //     this.configurePushSub(newpost.user._id, newpost.title, newpost.photo, newpost.user.name);
                // }
                this.setState({showSnackbar: false});
                this.props.history.push('/posts');
            })
            .catch(err => {
                this.setState({buttonClicked: false});
            });
        })
        .catch(err => {
            this.setState({buttonClicked: false});
        });
    }

    createNewPost = (event) => {
        if (navigator.onLine) {
            this.sendNewPostToDB(event);
        } else {
            event.preventDefault();
            this.setState({buttonClicked: true});
            if ('serviceWorker' in navigator && 'SyncManager' in window) {
                navigator.serviceWorker.ready.then(sw => {
                    // sw.active.postMessage(JSON.stringify({
                    //     userId: this.props.userId,
                    //     postTitle: this.state.newPostForm.title.value,
                    //     postPhoto: postPhoto,
                    //     userName: userName
                    // }));
                    const newPost = {
                        _id: new ObjectID().toHexString(),
                        title: this.state.newPostForm.title.value,
                        body: this.state.newPostForm.body.value,
                        photo: this.state.file,
                        token: this.props.token,
                        userId: this.props.userId
                    };
                    createData('sync-posts', newPost).then(() => {
                        return sw.sync.register('sync-new-posts');
                    })
                    .then(() => {
                        this.setState({showSnackbar: true});
                    })
                    .then(() => {
                        this.props.history.push('/posts');
                    })
                    .catch(err => {
                        console.log(err);
                    })
                });
            }
        }
    };

    configurePushSub = () => {

    };

    render() {
        let elementArray = [];
        for (let key in this.state.newPostForm) {
            elementArray.push({
                id: key,
                config: this.state.newPostForm[key]
            });
        }
        return (
            <div className="newPost">
                <h1>Create New Post</h1>
                <form className="newPost__form" encType="multipart/form-data">
                    {elementArray.map(element => {
                        return (
                            <>
                            <ReactSnackBar Icon={<i className="fas fa-alarm-clock"></i>} Show={this.state.showSnackbar}>
                                Creating Your Post...
                            </ReactSnackBar>
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
                            </>
                        )
                    })}
                            {this.state.imageSelected
                             ?
                             <div className="imageSelected">
                                <img src={this.state.imageSelected} alt="sdknflsd" />
                             </div>
                             :
                             null
                            }
                    <Button type="submit" click={(event) => this.createNewPost(event)} disabled={!this.state.formIsValid || this.state.buttonClicked}>Create Post</Button>
                </form>
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        token: state.auth.token,
        userId: state.auth.userId
    };
};

export default ErrorComponent(connect(mapStateToProps)(NewPost), axios);