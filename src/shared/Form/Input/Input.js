import React, {useReducer, useEffect} from 'react';
import { Validators } from '../Validators/Validators';
import './Input.css';

const inputReducer = (state, action) => {
    switch(action.type) {
        case 'inputChange':
            return {
                ...state,
                value: action.value,
                isValid: Validators(action.validators, action.value).isValid
            };
        case 'blur':
            return {
                ...state,
                isTouched: true
            };
        default:
            return state;
    }
};

const Input = props => {

    const [inputState, dispatch] = useReducer(inputReducer, {
        isValid: props.isValid || false,
        isTouched: false,
        value: props.initialValue || ''
    });

    const {id, onInput} = props;
    const {value, isValid} = inputState;

    useEffect(() => {
        onInput(id, value, isValid);
    }, [onInput, id, value, isValid]);

    const changeHandler = (event) => {
        dispatch({
            type: 'inputChange',
            value: event.target.value,
            validators: props.validators
        });
    };

    const touchHandler = () => {
        dispatch({
            type: 'blur'
        });
    };

    let element;
    switch(props.element) {
        case 'input':
            element = (
                <input id={props.id}
                       placeholder={props.placeholder}
                       type={props.type}
                       value={inputState.value}
                       onChange={changeHandler}
                       onBlur={touchHandler} />
            );
            break;
        case 'textarea':
            element = (
            <textarea id={props.id} 
                      placeholder={props.placeholder}
                      onChange={changeHandler}
                      onBlur={touchHandler}
                      rows='4'
                      value={inputState.value}>
                {inputState.value}</textarea>
            );
            break;
        default:
            element = (
                <input id={props.id}
                       placeholder={props.placeholder}
                       type={props.type}
                       value={inputState.value}
                       onChange={changeHandler}
                       onBlur={touchHandler} />
            )
    }

    return (
        <div
        className={`form-controll ${!inputState.isValid &&
          inputState.isTouched &&
          "form-controll--invalid"}`}
      >
        <label htmlFor={props.id}>{props.label}</label>
        {element}
        {!inputState.isValid && inputState.isTouched && (
          <>
            {Validators(props.validators, inputState.value).errorMessages.map(
              txtObj => {
                if (txtObj.appear) {
                  return <p key={txtObj.text}>{txtObj.text}</p>;
                }
              }
            )}
          </>
        )}
      </div>
    );

};

export default Input;