import React, {Component} from 'react';
import Modal from '../profile/components/EditProfileModal/EditProfileModal';
import Backdrop from '../shared/UI/Backdrop/Backdrop';
import './Error.css';

const error = (WrappedComponent, axios) => {
    return class extends Component {
        state = {
            error: null
        }

        componentWillMount() {
            this.reqInterceptor = axios.interceptors.request.use(req => {
                this.setState({error: null});
                return req;
            });

            this.resInterceptor = axios.interceptors.response.use(res => {
                return res;
            }, err => {
                this.setState({error: err});
            });
        }

        componentWillUnmount() {
            axios.interceptors.request.eject(this.reqInterceptor);
            axios.interceptors.response.eject(this.resInterceptor);
        }

        closeBackdrop = () => {
            this.setState({error: null});
        }

        render() {
            let errormsg;
            if (this.state.error) {
                errormsg = this.state.error.response.data.errors[0].message;
            } else {
                errormsg = null;
            }
            return (
                <>
                <Backdrop show={this.state.error} clicked={this.closeBackdrop}>
                    <Modal>
                        <div className="error">
                            <h1>An Error Occurred</h1>
                            <div className="editProfile__icon" onClick={this.closeBackdrop}>
                                <i className="fas fa-times-circle"></i>
                            </div>
                            <p>{errormsg}</p>
                        </div>
                    </Modal>
                </Backdrop>
                <WrappedComponent {...this.props} />
                </>
            )
        }
    }
};

export default error;