import React, {Component} from 'react';
import './Posts.css';
import Post from '../../Components/Posts/Post/Post';
import Pagination from 'react-js-pagination';
import axios from 'axios';
import Spinner from '../../Components/Spinner/Spinner';
import OpenWebSocket from 'socket.io-client';
import * as idb from 'idb';
import {connect} from 'react-redux';
require('bootstrap/dist/css/bootstrap.css');

function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
  
    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);
  
    for (var i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

const dbPromise = idb.openDB('allPosts', 1, (db) => {
    if (!db.objectStoreNames.contains('posts')) {
        db.createObjectStore('posts', {keyPath: '_id'});
    }

    if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('posts', {keyPath: '_id'});
    }
    if (!db.objectStoreNames.contains('sync-posts')) {
        db.createObjectStore('sync-posts', {keyPath: 'body'});
    }
});

function readAllPosts(st) {
    return dbPromise.then(db => {
        var transaction = db.transaction(st, 'readonly');
        var store = transaction.objectStore(st);
        return store.getAll();
    });
}

class Posts extends Component {

    deferredPrompt = null;
    networkDataReceived = false;
    signal = axios.CancelToken.source();
    state = {
        posts: [],
        itemPerPage: 12,
        activePage: 1,
        noPosts: false,
        loading: false
    }

    componentDidMount() {
        if (this.props.token) {
            if ('Notification' in window) {
                Notification.requestPermission((result) => {
                    if (result !== 'granted') {
                    console.log('not granted');
                    } else {
                    this.configurePushSub();
                    }
                });
            }
        }
        const socket = OpenWebSocket('/');
        socket.on('newpost', data => {
            this.setState(prevState => {
                return {
                    posts: prevState.posts.concat(data.newPost)
                };
            });
        });
        socket.on('deletedPost', (data) => {
            const filteredPosts = this.state.posts.filter(p => {
                return p._id !== data.deletedPost._id;
            });
            this.setState({posts: filteredPosts});
        });
        this.setState({loading: true});
        const requestBody = {
            query: `
                query {
                    posts {
                        _id
                        title
                        body
                        photo
                        createdAt
                        updatedAt
                        comments {
                            _id
                            comment
                            createdAt
                        }
                        user {
                            _id
                            name
                            email
                            createdAt
                            photo
                        }
                    }
                }
            `
        };
        return axios.post('/graphql', requestBody, {
            headers: {
                'Content-Type': 'application/json'
            },
            cancelToken: this.signal.token
        }).then(result => {
            const posts = result.data.data.posts;
            this.networkDataReceived = true;
            if (posts.length <= 0) {
                this.setState({noPosts: true});
            } else {
                this.setState({noPosts: false});
            }
            this.setState({posts: posts});
        })
        .then(() => {
                this.setState({loading: false});
        });
    }

    componentWillUnmount() {
        this.signal.cancel('posts signal cancelled');
    }

    handlePageChange = (pageNumber) => {
        this.setState({ activePage: pageNumber })
    }

    onGoToSinglePost = (id) => {
        this.props.history.push({
            pathname: '/post/' + id,
        });
    };

    configurePushSub = () => {
        if (!('serviceWorker') in navigator) {
          return;
      }
      let reg;
      navigator.serviceWorker.ready.then(sw => {
          reg = sw;
          return sw.pushManager.getSubscription();
      })
      .then(sub => {
          if (!sub) {
              const publicKey = 'BLge1u7VbGLVM2pX5awJQlMCWCYk85dIszcMHqwA9MIksA8BPrJrA8x6ZB0OM9QOqbgL-NyqaR9pvKVJYSSgFZM';
              const convertedPublicKey = urlBase64ToUint8Array(publicKey);
              return reg.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: convertedPublicKey
              })
              .then((newSub) => {
                  return newSub;
          })
          } else {
              console.log(sub.endpoint);
              return null;
          }
      })
      .then(newSub => {
          if (newSub){
            return axios.post('/subscribe', JSON.stringify(newSub), {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + this.props.token
                },
                cancelToken: this.signal.token
            }).then(res => {
                console.log(res);
            })
            .catch(err => {
                console.log(err);
            })
          }
      });
      }

    render() {
        const {posts} = this.state;
        if (posts === null) {
            return <Spinner />
        }
        if ('indexedDB' in window) {
            if (!navigator.onLine) {
                readAllPosts('posts').then(data => {
                    this.setState({posts: data});
                });
            }
        }
        return (
            <>
            <div className="posts">
                <h1>Posts</h1>
                <div className="post_flex">
                    {
                     this.state.noPosts
                     ?
                     <h2>No Posts Created Yet</h2>
                     :
                     <Post posts={this.state.posts}
                           activePage={this.state.activePage}
                           itemPerPage={this.state.itemPerPage}
                           isLoading={this.state.loading}
                           onGoToSinglePost={this.onGoToSinglePost} />
                     }
                </div>
            </div>
            {this.state.noPosts 
             ? 
             null 
             : 
             <Pagination
             activePage={this.state.activePage}
             itemsCountPerPage={this.state.itemPerPage}
             totalItemsCount={this.state.posts.length}
             linkClass={'page-link'}
             itemClass={'page-item'}
             activeClass={'active'}
             pageRangeDisplayed={5}
             onChange={this.handlePageChange.bind(this)} />
            }
            </>
        )
    }
}

const mapStateToProps = state => {
    return {
      token: state.auth.token
    };
};

export default connect(mapStateToProps)(Posts);