import React from 'react';
import './Form.css';

const form = props => {
    let element = null;
    let errorMessage;
    const classes = []
    if (props.touched && props.invalid) {
        classes.push('invalid');
        errorMessage = props.errorMessage
    }

    if (props.touched && !props.invalid && !props.invalidN) {
        classes.push('valid');
        errorMessage = ''
    }

    if (props.touched && props.invalidN) {
        classes.push('invalid-newpost');
        errorMessage = props.errorMessage
    }

    if (props.touched && !props.invalidN && !props.invalid) {
        classes.push('valid-newpost');
        errorMessage = ''
    }
    switch(props.elementType) {
        case 'input':
            element = (
                <>
                <input value={props.value}
                       {...props.elementConfig}
                       onChange={props.changed}
                       className= {classes.join(' ')}/>
                </>
            )
            break;
        case 'textarea':
            element = (
                <>
                    <textarea {...props.elementConfig}
                              onChange={props.changed}
                              className={classes.join(' ')}
                              value={props.value}></textarea>
                </>
            )
            break;
        case 'select':
            element = (
                <select value={props.value} onChange={props.changed}>
                    {props.elementConfig.options.map(option => {
                        return (
                            <option value={option.value}>
                                {option.displayValue}
                            </option>
                        )
                    })}
                </select>
            )
            break;
        default:
            element = (
                <input value={props.value}
                        {...props.elementConfig}
                        onChange={props.changed} />
            )
            break;
    }
    return (
        <>
            <label>{props.label}</label>
            {element}
            <p style={{color: 'red'}}>{errorMessage}</p>
        </>
    )
};

export default form;