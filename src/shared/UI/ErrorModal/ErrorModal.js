import React from "react";
import Button from '../Button/Button';
import Modal from "react-responsive-modal";


const ErrorModal = props => {
  return (
    <Modal open={props.open} onClose={props.onClose} center>
      <h2 style={{ textAlign: "center", marginTop: '11%' }}>An Error Occurred</h2>
      <p style={{ marginTop: "12px" }}>
        {props.errorMessage}
      </p>
      <div
        style={{
          marginTop: "25px",
          textAlign: "center",
          display: "flex",
          justifyContent: "space-around"
        }}
      >
        {props.firstButton ? (
          <Button type="button" clicked={props.firstButtonMethod}>
            {props.firstButtonTitle}
          </Button>
        ) : null}
        {props.secondButton ? (
          <Button type="button" clicked={props.secondButtonMethod}>
            {props.secondButtonTitle}
          </Button>
        ) : null}
      </div>
    </Modal>
  );
};

export default ErrorModal;