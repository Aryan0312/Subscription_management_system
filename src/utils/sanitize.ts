import validator from 'validator';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { ApiError } from './apiError.js'; 

export const trimString = (value: string): string => {
  return value.trim();
};


export const validateEmail = (email: string): string => {
  if (!email || !validator.isEmail(email)) {
    throw new ApiError(400, "Please provide a valid email address.");
  }
  return email.toLowerCase().trim();
};

// need to understand this 

export const validateIndianPhone = (phone: string): string => {
  const phoneNumber = parsePhoneNumberFromString(phone, 'IN');

  if (!phoneNumber || !phoneNumber.isValid()) {
    throw new ApiError(400, "Please provide a valid 10-digit Indian phone number.");
  }

  // Returns the number in international format: +91XXXXXXXXXX
  return phoneNumber.format("E.164");
};

export const validatePassword = (password: string): string => {
  
  password = trimString(password);

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const rules = [
    { regex: /.{8,}/, message: "Password must be at least 8 characters long" },
    { regex: /[A-Z]/, message: "Password must contain at least one uppercase letter" },
    { regex: /[a-z]/, message: "Password must contain at least one lowercase letter" },
    { regex: /[0-9]/, message: "Password must contain at least one number" },
    { regex: /[^A-Za-z0-9]/, message: "Password must contain at least one special character" },
  ];

  for (const rule of rules) {
    if (!rule.regex.test(password)) {
      throw new ApiError(400, rule.message);
    }
  }

  return password;
};
