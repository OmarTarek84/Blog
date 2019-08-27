import React, {Component} from 'react';
import Button from '../../Components/Button/Button';
import axios from 'axios';
import './Post.css';
import Backdrop from '../../Components/Backdrop/Backdrop';
import Modal from '../../Components/EditProfileModal/EditProfileModal';
import CSSTransition from 'react-transition-group/CSSTransition';
import Input from '../../Components/Form/Form';
import Spinner from '../../Components/Spinner/Spinner';
import {connect} from 'react-redux';
import SinglePost from '../../Components/Post/Post.js';
import ErrorComponent from '../../hoc/Error';
import Comments from '../../Components/Comments/Comments';
import OpenSocket from 'socket.io-client';
import * as idb from 'idb';
import ReactSnackBar from "react-js-snackbar";
import { ObjectID } from 'bson';

const dbPromise = idb.openDB('allPosts', 1, (db) => {
    if (!db.objectStoreNames.contains('posts')) {
        db.createObjectStore('posts', {keyPath: '_id'});
    }

    if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', {keyPath: '_id'});
    }

    if (!db.objectStoreNames.contains('sync-posts')) {
        db.createObjectStore('sync-posts', {keyPath: 'body'});
    }
});

function deleteItemFromData(st, id) {
    return dbPromise.then(db => {
        var transaction = db.transaction(st, 'readwrite');
        var store = transaction.objectStore(st);
        store.delete(id);
        return transaction.complete;
    });
}

function createData(st, data) {
    return dbPromise.then(db => {
        var transaction = db.transaction(st, 'readwrite');
        var store = transaction.objectStore(st);
        store.put(data);
        return transaction.complete;
    });
}

class Post extends Component {
    signal = axios.CancelToken.source();
    constructor(props) {
        super(props);
        this.inputRef = React.createRef();
    }

    state = {
        commentEntered: '',
        backdropShow: false,
        modalShow: true,
        showSnackbar: false,
        editPostForm: {
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
                    required: true,
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
                    
                },
                valid: true,
                touched: false,
                value: '',
                label: 'Image Of Your Post',
                errorMessage: 'This Field Is Required'
            },
        },
        formIsValid: false,
        post: null,
        imageSelected: null,
        file: null,
        deleteButtonClicked: false,
        buttonSelected: false,
        commentButtonDisabled: true,
        comments: [],
        numberOfComments: 0,
        likes: 0,
        buttonClicked: false,
        editPostButtonClicked: false
    }

    componentDidMount() {
        const socket = OpenSocket('/');
        socket.on('newcomment', data => {
            this.setState(prevState => {
                return {
                    comments: prevState.comments.concat(data.comment)
                };
            });
        });
        socket.on('likePost', data => {
            const postState = {...this.state.post};
            postState.likes.push(data.like);
            this.setState(prevState => {
                return {
                    likes: prevState.likes + 1,
                    post: postState
                };
            });
        })

        socket.on('unLikePost', data => {
            const likesFiltered = this.state.post.likes.filter(p => {
                return p._id !== this.props.userId;
            })
            this.setState(prevState => {
                return {
                    likes: prevState.likes - 1,
                    post: {
                        ...prevState.post,
                        likes: likesFiltered
                    }
                };
            });
        })
        const requestBody = {
            query: `
                query SinglePost($postId: String!) {
                    singlePost(postId: $postId) {
                        _id
                        title
                        body
                        photo
                        createdAt
                        user {
                            _id
                            name
                            email
                            photo
                        }
                        likes {
                            _id
                            name
                        }
                    }
                }
            `,
            variables: {
                postId: this.props.match.params.id
            }
            };
            axios.post('/graphql', requestBody, {
                headers: {
                    'Content-Type': 'application/json'
                },
                cancelToken: this.signal.token
            }).then(result => {
                if (!result) {
                    return;
                }
                const singlePost = result.data.data.singlePost;
                this.setState({post: singlePost, likes: singlePost.likes.length});
                const input = document.querySelector('.likeInput');
                singlePost.likes.forEach(p => {
                    if (p._id === this.props.userId) {
                        if (input) {
                            input.checked = true;
                        }
                    }
                });
            });
            const requestBody2 = {
                query: `
                    query Comments($postId: String!) {
                        comments(postId: $postId) {
                            _id
                            comment
                            createdAt
                            user {
                              name
                            }
                          }
                    }
                `,
                variables: {
                    postId: this.props.match.params.id
                }
            };
    
            return axios.post('/graphql', requestBody2, {
                headers: {
                    'Content-Type': 'application/json',
                },
                cancelToken: this.signal.token
            }).then(res => {
                this.setState({comments: res.data.data.comments});
            });
        }

    componentWillUnmount() {
        this.signal.cancel('cancelled');
    }

    changeCommentInput = () => {
        if (this.inputRef.current.value === '') {
            this.setState({commentButtonDisabled: true});
        } else {
            this.setState({commentButtonDisabled: false});
        }
    }

    openBackdrop = () => {
        this.setState({backdropShow: true});
        const editPostForm = {...this.state.editPostForm};
        
        const title = {...editPostForm['title']};
        title.value = this.state.post.title;
        title.valid = true;
        editPostForm['title'] = title;

        const body = {...editPostForm['body']};
        body.value = this.state.post.body;
        body.valid = true;
        editPostForm['body'] = body;

        this.setState({editPostForm: editPostForm, imageSelected: this.state.post.photo, formIsValid: true});
    }

    closeBackdrop = () => {
        this.setState({backdropShow: false });
    }

    changeInput = (event, inputType) => {
        const editPostForm = {...this.state.editPostForm};
        const stateElement = editPostForm[inputType];
        stateElement.value = event.target.value;
        if (inputType === 'postPhoto') {
            const file = event.target.files[0];
            this.setState({file: file, imageSelected: URL.createObjectURL(file)});
        }
        stateElement.touched = true;
        stateElement.valid = this.checkValidity(stateElement.validationRules, stateElement.value);
        editPostForm[inputType] = stateElement;

        let formIsValid = true;
        for (let key in editPostForm) {
            formIsValid = editPostForm[key].valid && formIsValid;
        }

        this.setState({editPostForm: editPostForm, formIsValid: formIsValid});
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

    editPost = (e) => {
        e.preventDefault();
        this.setState(prevState => {
            return {
                editPostForm: {
                    ...prevState.editPostForm,
                    postPhoto: {
                        ...prevState.editPostForm.postPhoto,
                        value: ''
                    }
                }
            }
        })
        this.setState({buttonSelected: true, backdropShow: false, editPostButtonClicked: true});
        const formData = new FormData();
        formData.append('image', this.state.file);
        return axios.put('/insertupdatePostImage', formData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.props.token
            },
            cancelToken: this.signal.token
        }).then(result => {
            const filepath = result.data.filePath;
            let path;
            if (filepath === 'notFound') {
                path = this.state.post.photo;
            } else {
                path = filepath;
            }
            const requestBody = {
                query: `
                    mutation UpdatePost($id: String!, $title: String!, $body: String!, $photo: String!) {
                        updatePost(updatePostInput: {id: $id, title: $title, body: $body, photo: $photo}) {
                            _id
                            title
                            body
                            photo
                            user {
                            _id
                            name
                            }
                        }
                    }  
                `,
                variables: {
                    id: this.state.post._id,
                    title: this.state.editPostForm.title.value,
                    body: this.state.editPostForm.body.value,
                    photo: path
                }
            };

            return axios.post('/graphql', requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.props.token
                },
                cancelToken: this.signal.token
            }).then(res => {
                const updatedPost = res.data.data.updatePost;
                const post = {...this.state.post};
                post.title = updatedPost.title;
                post.body = updatedPost.body;
                post.photo = path;
                this.setState({post: post, buttonSelected: false, editPostButtonClicked: false});
            });
        })
        .catch(err => {
            console.log(err);
        })
    }

    deletePost = () => {
        deleteItemFromData('posts', this.state.post._id)
        this.setState({deleteButtonClicked: true});
        const requestBody = {
            query: `
                mutation DeletePost($postId: String!) {
                    deletePost(postId: $postId) {
                        _id
                        posts {
                          title
                          body
                          photo
                        }
                      }
                }
            `,
            variables: {
                postId: this.state.post._id
            }
        };

        return axios.post('/graphql', requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.props.token
            },
            cancelToken: this.signal.token
        }).then(res => {
            this.setState({deleteButtonClicked: false});
            this.props.history.push('/posts');
        });
    };

    // insert comment while offline

    sendCommentInsertedToDB = (e) => {
        e.preventDefault();
        this.setState({commentButtonDisabled: true, showSnackbar: true});
        const requestBody = {
            query: `
                mutation InsertComment($postId: String!, $comment: String!) {
                    insertComment(postId: $postId, comment: $comment) {
                        _id
                        comment
                        createdAt
                        user {
                          name
                        }
                      }
                }
            `,
            variables: {
                postId: this.state.post._id,
                comment: this.inputRef.current.value
            }
        };

        return axios.post('/graphql', requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.props.token
            },
            cancelToken: this.signal.token
        }).then(res => {
            const insertedComment = res.data.data.insertComment;
            navigator.serviceWorker.ready.then(sw => {
                sw.active.postMessage(JSON.stringify({
                    postId: this.state.post._id,
                    comment: insertedComment.comment,
                    userInsertedComment: insertedComment.user.name
                }));
            })
            this.inputRef.current.value = '';
            this.setState(prevState => {
                return {
                    commentButtonDisabled: false,
                    showSnackbar: false
                    // comments: prevState.comments.concat(res.data.data.insertComment),
                }
            })
        });
    }

    insertComment = (e) => {
        if (navigator.onLine) {
            this.sendCommentInsertedToDB(e);
        } else {
            e.preventDefault();
            this.setState({commentButtonDisabled: true, showSnackbar: true});
            if ('serviceWorker' in navigator && 'SyncManager' in window) {
                navigator.serviceWorker.ready.then(sw => {
                    const comment = {
                        _id: new ObjectID().toHexString(),
                        postId: this.state.post._id,
                        comment: this.inputRef.current.value,
                        userId: this.props.userId,
                        token: this.props.token
                    };
                    createData('sync-comments', comment).then(() => {
                        return sw.sync.register('sync-new-comments');
                    })
                    .then(() => {
                        this.setState({showSnackbar: false})
                    })
                    .then(() => {
                        this.setState({commentButtonDisabled: false})
                    })
                    .catch(err => {
                        console.log(err);
                    })
                });
            } else {
                this.sendCommentInsertedToDB(e);
            }
        }
    }

    goToProfile = (id) => {
        this.props.history.push({
            pathname: '/userprofile/' + id,
        })
    }

    like = (event) => {
        const isLiked = event.target.checked;
        this.setState({buttonClicked: true});
        let requestBody;
        if (isLiked) {
            requestBody = {
                query: `
                    mutation LikePost($postId: String!) {
                        likePost(postId: $postId) {
                            _id
                            likes {
                                name
                            }
                        }
                    }
                `,
                variables: {
                    postId: this.props.match.params.id
                }
            }
        } else {
            requestBody = {
                query: `
                    mutation UnlikePost($postId: String!) {
                        unlikePost(postId: $postId) {
                            _id
                            likes {
                                name
                            }
                        }
                    }
                `,
                variables: {
                    postId: this.props.match.params.id
                }
            }
        }

        return axios.post('/graphql', requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.props.token
            },
            cancelToken: this.signal.token
        }).then(result => {
            if (result.data.data.likePost) {
                this.setState(prevState => {
                    return {
                        // likes: prevState.likes + 1,
                        buttonClicked: false
                    }
                })
            } else {
                this.setState(prevState => {
                    return {
                        // likes: prevState.likes - 1,
                        buttonClicked: false
                    }
                })
            }
        });
    }

    render() {
        let elementArray = [];
        for (let key in this.state.editPostForm) {
            elementArray.push({
                id: key,
                config: this.state.editPostForm[key]
            });
        }
        const {post, comments} = this.state
        if (post === null || comments === null) {
            return <Spinner />
        }
        return (
            <>
                <ReactSnackBar Icon={<i className="fas fa-alarm-clock"></i>} Show={this.state.showSnackbar}>
                    Creating Your Comment...
                </ReactSnackBar>
                <SinglePost openBackdrop={this.openBackdrop}
                            title={this.state.post.title}
                            body={this.state.post.body}
                            image={this.state.post.photo}
                            date={this.state.post.createdAt}
                            postCreator={this.state.post.user.name}
                            onGoToProfile={this.goToProfile}
                            deletePost={this.deletePost}
                            disabledd={this.state.deleteButtonClicked}
                            userId={this.props.userId}
                            postUserId={this.state.post.user._id}
                            like={this.like}
                            numberOfLikes={this.state.likes}
                            buttonClicked={this.state.buttonClicked}
                            token={this.props.token}
                            userPostId={this.state.post.user._id}
                            disabled={this.state.editPostButtonClicked} />

                {this.props.token
                 ?
                    this.state.post.user._id !== this.props.userId
                    ?
                    <div className="post__comments">
                        <h2>Leave A Comment</h2>
                        <form className="post__comments__form">
                            <input ref={this.inputRef} name="comment" onChange={this.changeCommentInput} placeholder="Leave A comment Here" />
                            <Button type="submit" disabled={this.state.commentButtonDisabled} click={(e) => this.insertComment(e)}>POST</Button>
                        </form>
                    </div>
                    :
                    null
                 :
                 null}
                 <Comments comments={this.state.comments}
                           numberOfComments={this.state.comments.length} />
                <Backdrop show={this.state.backdropShow} />
                <CSSTransition mountOnEnter
                               unmountOnExit
                               in={this.state.backdropShow}
                               timeout={{
                                   enter: 1000,
                                   exit: 1000
                               }}
                               classNames={{
                                   enter: '',
                                   enterActive: 'ModalOpen',
                                   exit: '',
                                   exitActive: 'ModalClose'
                               }}>
                    <Modal viewModal={this.state.backdropShow}>
                        <form className="editPost__form" encType="multipart/form-data">
                            <h1>Edit Your Post</h1>
                            <div className="editPost__icon" onClick={this.closeBackdrop}>
                                <i className="fas fa-times-circle"></i>
                            </div>
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
                        <Button type="submit" disabled={!this.state.formIsValid || this.state.buttonSelected} click={this.editPost}>Update Post</Button>
                        {this.state.imageSelected
                         ?
                         <img src={this.state.imageSelected} name="image" alt='postImage' className="imageSelected" />
                        :
                        null}
                        </form>
                    </Modal>
                </CSSTransition>
            </>
        )
    }
}

const mapStateToProps = state => {
    return {
        token: state.auth.token,
        userId: state.auth.userId
    };
};

export default ErrorComponent(connect(mapStateToProps)(Post), axios);