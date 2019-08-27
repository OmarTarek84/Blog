import React, {Suspense, Component} from 'react';
import {Switch, Route, withRouter, Redirect} from 'react-router-dom';
import './App.css';
import Layout from './Components/Layout/Layout';
import HomePage from './Containers/Home/Home';
import Spinner from './Components/Spinner/Spinner';
import {connect} from 'react-redux';
import * as ActionCreators from './store/actionCreators/User';
import LogoutPage from './Containers/Logout/Logout';
import Conditional from 'react-simple-conditional';
import axios from 'axios';

const Auth = React.lazy(() => {
  return import('./Containers/Auth/Auth.js');
});

const Signin = React.lazy(() => {
  return import('./Containers/Signin/Signin.js');
});

const UserProfile = React.lazy(() => {
  return import('./Containers/UserProfile/UserProfile.js');
});

const NewPost = React.lazy(() => {
  return import('./Containers/NewPost/NewPost.js');
});

const Post = React.lazy(() => {
  return import('./Containers/Post/Post');
});

const Posts = React.lazy(() => {
  return import('./Containers/Posts/Posts');
});

class App extends Component {

  state = {
    installButton: false
  }
  deferredPrompt = null;


  componentDidMount() {
    window.addEventListener('beforeinstallprompt',e=>{
      e.preventDefault();
      this.deferredPrompt = e;
      // See if the app is already installed, in that case, do nothing
      if((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true){
        return false;
      }
      // Set the state variable to make button visible
      this.setState({
        installButton:true
      });
    });
    this.props.onAuth();
  }

  installApp = async() => {
    if(!this.deferredPrompt) {
      return false;
    }
    this.deferredPrompt.prompt();
    let outcome = await this.deferredPrompt.userChoice;
    if(outcome.outcome=='accepted'){
      console.log("App Installed")
    }
    else{
      console.log("App not installed");
    }
    this.deferredPrompt=null;
    this.setState({
      installButton:false
    })
  }

  render() {
      const condStyle = {
        border: 'none',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        cursor: 'pointer',
        padding: '10px 20px',
        display: 'inline-block',
        margin: '15px -25px',
        letterSpacing: '1px',
        fontWeight: 700,
        outline: 'none',
        position: 'relative',
        background: '#cb4e4e',
        color: '#fff',
        boxShadow: '0 6px #ab3c3c',
        borderRadius: '0 0 5px 5px',
        left: '50%',
        transform: 'translateX(-50%)'
      }
    return (
      <Layout>
        <Suspense fallback={<Spinner />}>
          <div style={{
            width: '100%',
            backgroundColor: '#5CDB95'
          }}>
            <Conditional condition={this.state.installButton} style={condStyle} onClick={this.installApp}>
                Install As Application
            </Conditional>
          </div>
          <Switch>
            {!this.props.token ? <Route path="/auth" render={(props) => <Auth {...props} />} exact /> : null }
            {!this.props.token ? <Route path="/signin" render={(props) => <Signin {...props} />} exact /> : null }
            <Route path="/userprofile/:id" render={(props) => <UserProfile {...props} />} exact />
            {this.props.token ? <Route path="/newpost" render={(props) => <NewPost {...props} />} exact /> : null }
            <Route path="/post/:id" render={(props) => <Post {...props} />} exact />
            <Route path="/posts" render={(props) => <Posts {...props} />} exact />
            {this.props.token ? <Route path="/logout" component={LogoutPage} /> : null }
            <Route path="/" component={HomePage} exact />
            <Redirect to="/" />
          </Switch>
        </Suspense>
      </Layout>
    )
  }
}

const mapStateToProps = state => {
  return {
    token: state.auth.token
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onAuth: () => dispatch(ActionCreators.authenticate())
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));
