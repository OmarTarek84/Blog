import React, {useReducer, useCallback} from 'react';

const formReducer = (state, action) => {
    switch(action.type) {
        case 'change':
            let formIsValid = true;
            for (let inputId in state.inputs) {
                if (!state.inputs[inputId]) continue;
                if (inputId === action.inputId) {
                    formIsValid = formIsValid && action.isValid;
                } else {
                    formIsValid = formIsValid && state.inputs[inputId].isValid;
                }
            }
            return {
                ...state,
                formIsValid: formIsValid,
                inputs: {
                    ...state.inputs,
                    [action.inputId]: {
                        value: action.value,
                        isValid: action.isValid
                    }
                }
            };
        default:
            return state;
    }
};

export const useForm = (allInputs, formValidity) => {
    const [initialState, dispatch] = useReducer(formReducer, {
        formIsValid: formValidity,
        inputs: allInputs
    });
    const inputHandler = useCallback((id, value, formIsValid) => {
        dispatch({
          type: 'change',
          value: value,
          isValid: formIsValid,
          inputId: id
        });
      }, []);
    return [initialState, inputHandler];
};