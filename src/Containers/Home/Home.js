import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import axios from 'axios';
import Blogs from '../../Components/Homepage/Blogs/Blogs';
import Spinner from '../../Components/Spinner/Spinner';
import Users from '../../Components/Homepage/Users/Users';
import * as idb from 'idb';
import './Home.css';

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

function readAllPosts(st) {
    return dbPromise.then(db => {
        var transaction = db.transaction(st, 'readonly');
        var store = transaction.objectStore(st);
        return store.getAll();
    });
}

class HomePage extends Component {

    signal = axios.CancelToken.source()
    state = {
        blogs: [],
        mostLikedBlog: null,
        followedUsers: []
    }

    componentDidMount() {
        const requestBody = {
            query: `
                query {
                    posts {
                    _id
                    title
                    body
                    photo
                    createdAt
                    user {
                      _id
                      name
                    }
                    likes {
                        _id
                        name
                    }
                }
                }
            `
        };

        axios.post('/graphql', requestBody, {
            headers: {
                'Content-Type': 'application/json'
            },
            cancelToken: this.signal.token
        }).then(blogs => {
            const posts = blogs.data.data.posts;
            const sortedPost = posts.sort((a, b) => {
                return b.likes.length - a.likes.length;
            }).shift();
            this.setState({blogs: posts, mostLikedBlog: sortedPost});
        });

        const usersRequestBody = {
            query: `
                query {
                    users {
                    _id
                    name
                    photo
                    posts {
                    _id
                    }
                    followers {
                        _id
                    }
                }  
                }
            `
        };

        return axios.post('/graphql', usersRequestBody, {
            headers: {
                'Content-Type': 'application/json'
            },
            cancelToken: this.signal.token
        }).then(result => {
            const users = result.data.data.users;
            this.setState({followedUsers: users});
        });
    }

    componentWillUnmount() {
        this.signal.cancel('cancelled');
    }

    goToPost = (id) => {
        this.props.history.push({
            pathname: '/post/' + id
        });
    }

    goToProfile = (id) => {
        this.props.history.push('/userprofile/' + id);
    };

    render() {
        const {blogs, mostLikedBlog, followedUsers} = this.state;
        if (blogs === null || mostLikedBlog === null || followedUsers === null) {
            return <Spinner />;
        }
        if ('indexedDB' in window) {
            readAllPosts('users').then(data => {
                if (!navigator.onLine) {
                    this.setState({followedUsers: data});
                }
            });
        }
        return (
            <>
            <section className="section-most-viewed">
                <h2>Most Liked Blog</h2>
                <div className="section-most-viewed__blog-parent">
                    <div className="section-most-viewed__blog-parent__blog">
                        <p>Blog Created By {this.state.mostLikedBlog.user.name}</p>
                        <h1>{this.state.mostLikedBlog.title}</h1>
                        <p>{this.state.mostLikedBlog.body.substring(0, 200) + '...'}</p>
                        <Link to={"/post/" + this.state.mostLikedBlog._id}>Read More</Link>
                    </div>
                    <div className="section-most-viewed__blog-parent__image">
                        <img src={this.state.mostLikedBlog.photo} alt="Blog_Pic" />
                    </div>
                </div>
            </section>

            <div className="recent_posts">
                <h1>Recent Blogs</h1>
                <div className="recent_posts__flex">
                    <Blogs blogs={this.state.blogs.sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }).slice(0, 3)}
                           goToPost={this.goToPost} />
                </div>
            </div>

            <div className="mostActiveUsers">
                <h2>Most Followed Users</h2>
                <div className="mostActiveUsers__flex">
                    <Users users={this.state.followedUsers.slice(0, 3).sort((a, b) => {
                        return b.followers.length - a.followers.length;
                    })}
                           goToProfile={this.goToProfile} />
                </div>
            </div>
            </>
        )
    }
}

export default HomePage;