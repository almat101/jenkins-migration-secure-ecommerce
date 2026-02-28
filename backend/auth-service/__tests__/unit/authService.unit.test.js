import {
  generateJwtToken,
  hashPassword,
  comparePasswords,
  validateJwtPayload,
  validateUserCredentials,
  validateSignupData,
} from "../../services/authService.js";
import jwt from "jsonwebtoken";

describe("unit test for generateJwtToken", () => {
  test("should generate a valid JWT token", () => {
    //Arrange
    const payload = {
      userId: 1,
      username: "alex",
      email: "alex@gmail.com",
    };
    const secret = "secret_test";
    const options = { expiresIn: "1h" };

    //Act
    const token = generateJwtToken(payload, secret, options);

    //Assert
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    //Verify
    const decoded = jwt.verify(token, secret);
    expect(decoded).toMatchObject(payload);
  });
});

describe("unit test for validateJwtPayload", () => {
  test("should not generate a valid JWT token with invalid paylod", () => {
    //Arrange
    const payload = {
      userId: "ciao",
      username: "alex",
      email: "alex@gmail.com",
    };
    const secret = "secret_test";
    const options = { expiresIn: "1h" };

    //Act and assert
    expect(() => validateJwtPayload(payload, secret, options)).toThrow(
      "Invalid payload"
    );
  });

  test("should return true for a valid payload", () => {
    // Arrange
    const payload = {
      userId: 1,
      username: "alex",
      email: "alex@gmail.com",
    };
    const secret = "secret_test";
    const options = { expiresIn: "1h" };

    // Act
    const ret = validateJwtPayload(payload, secret, options);

    // Assert
    expect(ret).toBe(true);
  });

  test("should validate a valid payload without throwing an error", () => {
    // Arrange
    const payload = {
      userId: 1,
      username: "alex",
      email: "alex@gmail.com",
    };
    const secret = "secret_test";
    const options = { expiresIn: "1h" };

    // assert + Act & Assert
    expect(() => validateJwtPayload(payload, secret, options)).not.toThrow();
  });
});

describe("Unit test for hashPassword", () => {
  test("should hash a password from plaintext and verify it matches the plaintext password", async () => {
    //Arrange
    const plaintextPassword = "1teStPasSw0rD2";

    //Act
    const hash = await hashPassword(plaintextPassword);

    //Assert
    expect(hash).toBeDefined();
    expect(typeof hash).toBe("string");
    expect(hash).not.toBe(plaintextPassword);

    //Verify
    const is_the_same = await comparePasswords(plaintextPassword, hash);
    expect(is_the_same).toBe(true);
  });

  test("should not hash a password that is empty", async () => {
    //Arrange
    const plaintextPassword = "";

    //Act e assert
    await expect(hashPassword(plaintextPassword)).rejects.toThrow(
      "Password cannot be empty"
    );
  });

  test("should not hash a password that is too short", async () => {
    //Arrange
    const plaintextPassword = "ciao";

    //Act e assert
    await expect(hashPassword(plaintextPassword)).rejects.toThrow(
      "Password must be at least 8 characters long and contain only letters and numbers."
    );
  });
});

describe("Unit test for comparePasswords", () => {
  test("Should return true if the password is the same as the hashed one", async () => {
    //arrange
    const plaintextPassword = "ciao12testD";

    const hashed = await hashPassword(plaintextPassword);

    //act assert
    await expect(comparePasswords(plaintextPassword, hashed)).resolves.toBe(
      true
    );
  });

  test("Should return false if the password is not the same", async () => {
    //arrange
    const plaintextPassword = "ciao12testD";

    const hashed = "gewagianfdiaiasdfda";

    //act assert
    await expect(comparePasswords(plaintextPassword, hashed)).resolves.toBe(
      false
    );
  });
});

describe("Unit test per validateUserCredentials", () => {
  test("Should validate a user with valid credential and return the user object", async () => {
    //Arrange
    // const schema_login = Joi.object({
    //     email: Joi.string()
    //         .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net','org','edu','gov', 'io', 'co', 'it', 'us', 'uk'] } }),

    //     password: Joi.string()
    //         .pattern(new RegExp('^[a-zA-Z0-9]{8,}$'))
    // })
    const valid_login = {
      email: "alex@gmail.com",
      password: "test2Ciao3",
    };

    //Act
    const result = await validateUserCredentials(valid_login);

    //Assert
    // await expect(fetchData()).resolves.toBe('peanut butter');
    // await expect(validateUserCredentials(valid_login)).resolves.toStrictEqual({ email : 'alex@gmail.com', password : 'test2Ciao3'})

    expect(result).toStrictEqual({
      email: "alex@gmail.com",
      password: "test2Ciao3",
    });
  });

  test("Should not validate a user with invalid credential and throw a specific error", async () => {
    //Arrange
    // const schema_login = Joi.object({
    //     email: Joi.string()
    //         .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net','org','edu','gov', 'io', 'co', 'it', 'us', 'uk'] } }),

    //     password: Joi.string()
    //         .pattern(new RegExp('^[a-zA-Z0-9]{8,}$'))
    // })
    const invalid_email_login = {
      email: "alex@gmail.lol",
      password: "test2Ciao3",
    };

    //Act Assert
    await expect(validateUserCredentials(invalid_email_login)).rejects.toThrow(
      "Invalid login data."
    );
  });

  test("Should not validate a user with invalid credential and throw a specific error", async () => {
    //Arrange
    const invalid_email_login = {
      email: "alex@gmail.com",
      password: "test",
    };

    //Act Assert
    await expect(validateUserCredentials(invalid_email_login)).rejects.toThrow(
      "Invalid login data."
    );
  });

  test("Should not validate a user with empty email", async () => {
    //Arrange
    const empty_email_login = {
      email: "",
      password: "test32ciao",
    };

    //Act Assert
    await expect(validateUserCredentials(empty_email_login)).rejects.toThrow(
      "Invalid login data."
    );
  });

  test("Should not validate a user with empty password", async () => {
    //Arrange
    const empty_password_login = {
      email: "alex@gmail.com",
      password: "",
    };

    //Act Assert
    await expect(validateUserCredentials(empty_password_login)).rejects.toThrow(
      "Invalid login data."
    );
  });
});

describe("Unit test for validateSignupData", () => {
  test("Should validate a user with valid credential and return the user object", async () => {
    //ARRANGE
    // const schema_signup = Joi.object({
    //     username: Joi.string()
    //         .alphanum()
    //         .min(3)
    //         .max(30)
    //         .required(),

    //     password: Joi.string()
    //         .pattern(new RegExp('^[a-zA-Z0-9]{8,}$'))
    //         .required(),

    //     repeat_password: Joi.ref('password'),

    //     email: Joi.string()
    //         .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net','org','edu','gov', 'io', 'co', 'it', 'us', 'uk'] } })
    //         .required()
    // })
    //     .with('password', 'repeat_password');
    const valid_user_signup = {
      username: "Alex",
      password: "3testPass12",
      repeat_password: "3testPass12",
      email: "alex@gmail.com",
    };
    //ACT
    const result = await validateSignupData(valid_user_signup);
    // console.log(result)
    //ASSERT
    expect(result).toStrictEqual({
      username: "Alex",
      password: "3testPass12",
      repeat_password: "3testPass12",
      email: "alex@gmail.com",
    });
  });

  test("Should not validate a user with passwords that do not match", async () => {
    //arrange
    const invalid_user_signup_wrong_password = {
      username: "Alex",
      password: "3testPass12",
      repeat_password: "3testPass",
      email: "alex@gmail.com",
    };
    // act e assert
    await expect(
      validateSignupData(invalid_user_signup_wrong_password)
    ).rejects.toThrow("Invalid signup data. Please check your input.");
  });

  test("Should not validate a user with invalid email", async () => {
    //arrange
    const invalid_user_signup_email = {
      username: "Alex",
      password: "3testPass12",
      repeat_password: "3testPass",
      email: "alex@l.com",
    };
    // act e assert
    await expect(validateSignupData(invalid_user_signup_email)).rejects.toThrow(
      "Invalid signup data. Please check your input."
    );
  });

  test("Should not validate a user with invalid username", async () => {
    //arrange
    const invalid_user_signup_username = {
      username: "X",
      password: "3testPass12",
      repeat_password: "3testPass",
      email: "alex@gmail.com",
    };
    // act e assert
    await expect(
      validateSignupData(invalid_user_signup_username)
    ).rejects.toThrow("Invalid signup data. Please check your input.");
  });

  test("Should not validate a user with empty username", async () => {
    //arrange
    const invalid_user_signup_empty_username = {
      username: "",
      password: "3testPass12",
      repeat_password: "3testPass",
      email: "alex@gmail.com",
    };
    // act e assert
    await expect(
      validateSignupData(invalid_user_signup_empty_username)
    ).rejects.toThrow("Invalid signup data. Please check your input.");
  });

  test("Should not validate a user with empty password", async () => {
    //arrange
    const invalid_user_signup_empty_password = {
      username: "alex",
      password: "",
      repeat_password: "3testPass",
      email: "alex@gmail.com",
    };
    // act e assert
    await expect(
      validateSignupData(invalid_user_signup_empty_password)
    ).rejects.toThrow("Invalid signup data. Please check your input.");
  });

  test("Should not validate a user with empty email", async () => {
    //arrange
    const invalid_user_signup_empty_email = {
      username: "alex",
      password: "3testPass",
      repeat_password: "3testPass",
      email: "",
    };
    // act e assert
    await expect(
      validateSignupData(invalid_user_signup_empty_email)
    ).rejects.toThrow("Invalid signup data. Please check your input.");
  });

  test("Should not validate a user with all field empty", async () => {
    //arrange
    const invalid_user_signup_empty = {
      username: "",
      password: "",
      repeat_password: "",
      email: "",
    };
    // act e assert
    await expect(validateSignupData(invalid_user_signup_empty)).rejects.toThrow(
      "Invalid signup data. Please check your input."
    );
  });

  test("Should not validate a user with numerical(int) name", async () => {
    //arrange
    const invalid_user_signup_int_username = {
      username: 23,
      password: "3testPass",
      repeat_password: "3testPass",
      email: "alex@gmail.com",
    };
    // act e assert
    await expect(
      validateSignupData(invalid_user_signup_int_username)
    ).rejects.toThrow("Invalid signup data. Please check your input.");
  });
});

// use case:
// funzioni sincrone: expect(() => ...).toThrow(...)
// funzione asincronce: await expect(...).rejects.toThrow(...)

//promise expect resolves
// await expect(validateUserCredentials(valid_login)).resolves.toStrictEqual({ email : 'alex@gmail.com', password : 'test2Ciao3'})

//promise expect rejects
//await expect(validateUserCredentials(invalid_email_login)).rejects.toThrow("Invalid signup data. Please check your input.")
