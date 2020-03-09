const REQUIRE_TYPE = "REQUIRE_TYPE";
const MAXLENGTH_TYPE = "MAXLENGTH_TYPE";
const MINLENGTH_TYPE = "MINLENGTH_TYPE";
const EMAIL_TYPE = "EMAIL_TYPE";
const VALIDATOR_TYPE_MATCHPASSWORDS = "VALIDATOR_TYPE_MATCHPASSWORDS";

export const REQUIRE = () => ({ type: REQUIRE_TYPE });
export const MAXLENGTH = val => ({ type: MAXLENGTH_TYPE, val: val });
export const MINLENGTH = val => ({ type: MINLENGTH_TYPE, val: val });
export const EMAIL = () => ({ type: EMAIL_TYPE });
export const MATCHPASSWORDS = val => ({
  type: VALIDATOR_TYPE_MATCHPASSWORDS,
  val: val
});

export const Validators = (validators, value) => {
  let isValid = true;
  let errorMessages = [
    { text: "This Field Is Required", appear: false },
    { text: "This Field Is not number", appear: false },
    { text: "This Field Must Have Maximum 500 characters", appear: false },
    { text: "Email Is Not Valid", appear: false },
    { text: "Passwords do not match", appear: false },
    { text: "Password should have at least 8 characters", appear: false }
  ];
  for (const validator of validators) {
    if (validator.type === REQUIRE_TYPE) {
      isValid = isValid && value.trim().length > 0;
      errorMessages[0].appear = value.trim().length <= 0;
    }
    if (validator.type === MAXLENGTH_TYPE) {
      isValid = isValid && value.trim().length <= validator.val;
      errorMessages[2].appear = value.trim().length > validator.val;
    }
    if (validator.type === MINLENGTH_TYPE) {
      isValid = isValid && value.trim().length >= validator.val;
      errorMessages[5].appear = value.trim().length < validator.val;
    }
    if (validator.type === EMAIL_TYPE) {
      const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      isValid = isValid && re.test(value);
      errorMessages[3].appear = !re.test(value) && value.trim().length > 0;
    }
    if (validator.type === MATCHPASSWORDS) {
      isValid = isValid && value === validator.val;
      errorMessages[4].appear = (value !== validator.val);
    }
  }
  return {isValid: isValid, errorMessages: errorMessages};
};
