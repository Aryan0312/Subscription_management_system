import generator from "generate-password";

export const generateRandomPassword = () => {

  const password = generator.generate({
    length: 12,
    numbers: true,
    symbols: true,
    uppercase: true,
    lowercase: true,
    strict: true,
  });

  return password;
};
