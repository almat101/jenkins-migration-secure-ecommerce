import request from "supertest";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";

// Mock the repository module before importing app.js
jest.unstable_mockModule("../../repositories/authRepository.js", () => ({
  createUser: jest.fn(),
  executePrevQuery: jest.fn(),
  findUser: jest.fn(),
  testDatabaseConnection: jest.fn(),
}));

jest.unstable_mockModule("../../services/authService.js", () => ({
  loginUser: jest.fn(),
  validateSignupData: jest.fn(),
  comparePasswords: jest.fn(),
  generateJwtToken: jest.fn(),
  hashPassword: jest.fn(),
  validateUserCredentials: jest.fn(),
  validateJwtPayload: jest.fn(),
}));

const { loginUser } = await import("../../services/authService.js");

const { createUser, executePrevQuery, testDatabaseConnection } = await import(
  "../../repositories/authRepository.js"
);

const { validateSignupData, hashPassword } = await import(
  "../../services/authService.js"
);

const { default: app } = await import("../../app.js");

describe("Integration test for /signup", () => {
  beforeEach(() => {
    //mockReset resets the mock implementation for grant isolation in each tests
    validateSignupData.mockReset();
    hashPassword.mockReset();
    executePrevQuery.mockReset();
    createUser.mockReset();
    testDatabaseConnection.mockReset();
  });

  test("Should return 201 and the created user on successful signup.", async () => {
    // Successful signup:
    // - validateSignupData resolves (valid input)
    // - hashPassword resolves (password hashed successfully)
    // - executePrevQuery resolves (no existing user found)
    // - createUser resolves (user created in database)
    validateSignupData.mockResolvedValueOnce({
      username: "alex",
      password: "test12ciao",
      repeat_password: "test12ciao",
      email: "alex@gmail.com",
    });
    hashPassword.mockResolvedValueOnce("hashed_pasword");
    executePrevQuery.mockResolvedValueOnce({ row: [], rowCount: 0 });
    createUser.mockResolvedValueOnce({
      rows: [{ id: "1", username: "alex", email: "alex@gmail.com" }],
      rowCount: 1,
    });
    //arrange
    const mockSignupBody = {
      username: "alex",
      password: "test12ciao",
      repeat_password: "test12ciao",
      email: "alex@gmail.com",
    };

    //act
    const response = await request(app)
      .post("/auth/signup")
      .send(mockSignupBody);

    //assert (successfull signup all function are called and resolve to a valid value)
    expect(validateSignupData).toHaveBeenCalledTimes(1);
    expect(hashPassword).toHaveBeenCalledTimes(1);
    expect(executePrevQuery).toHaveBeenCalledTimes(1);
    expect(createUser).toHaveBeenCalledTimes(1);
    expect(createUser).toHaveBeenCalledWith(
      "alex",
      "alex@gmail.com",
      expect.any(String)
    );
    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      message: "User created",
      user: {
        username: "alex",
        email: "alex@gmail.com",
        id: "1",
      },
    });
  });

  test("Should return 500 if createUser throws an error during signup.", async () => {
    // Error on signup:
    // - validateSignupData resolves (valid input)
    // - hashPassword resolves (password hashed successfully)
    // - executePrevQuery resolves (no existing user found)
    // - createUser reject
    validateSignupData.mockResolvedValueOnce({
      username: "alex",
      password: "test12ciao",
      repeat_password: "test12ciao",
      email: "alex@gmail.com",
    });
    hashPassword.mockResolvedValueOnce("hashed_pasword");
    executePrevQuery.mockResolvedValueOnce({ row: [], rowCount: 0 });
    createUser.mockRejectedValueOnce();

    //arrange
    const mockSignupBody = {
      username: "alex",
      password: "test12ciao",
      repeat_password: "test12ciao",
      email: "alex@gmail.com",
    };

    //act
    const response = await request(app)
      .post("/auth/signup")
      .send(mockSignupBody);

    //assert (successfull signup all function are called and resolve to a valid value)
    expect(validateSignupData).toHaveBeenCalledTimes(1);
    expect(hashPassword).toHaveBeenCalledTimes(1);
    expect(executePrevQuery).toHaveBeenCalledTimes(1);
    expect(createUser).toHaveBeenCalledTimes(1);

    expect(response.statusCode).toBe(500);
    expect(response.body).toMatchObject({ message: "Internal server error" });
  });

  test("Should return 409 Conflict if username or email already exists in the database.", async () => {
    // Error on signup:
    // - validateSignupData resolves (valid input)
    // - hashPassword resolves (password hashed successfully)
    // - executePrevQuery resolves (founding the same user so it goes to 409 same user)
    validateSignupData.mockResolvedValueOnce({
      username: "alex",
      password: "test12ciao",
      repeat_password: "test12ciao",
      email: "alex@gmail.com",
    });
    hashPassword.mockResolvedValueOnce("hashed_pasword");
    executePrevQuery.mockResolvedValueOnce({
      rows: [{ id: "1", username: "alex", email: "alex@gmail.com" }],
      rowCount: 1,
    });
    //arrange
    const mockSignupBody = {
      username: "alex",
      password: "test12ciao",
      repeat_password: "test12ciao",
      email: "alex@gmail.com",
    };

    //act
    const response = await request(app)
      .post("/auth/signup")
      .send(mockSignupBody);

    // assert;
    expect(validateSignupData).toHaveBeenCalledTimes(1);
    expect(hashPassword).toHaveBeenCalledTimes(1);
    expect(executePrevQuery).toHaveBeenCalledTimes(1);
    expect(createUser).toHaveBeenCalledTimes(0);
    expect(response.statusCode).toBe(409);
    expect(response.body).toMatchObject({
      message: "Username or Email already exists",
    });
  });

  test("Should return 500 if executePrevQuery throws an error during signup.", async () => {
    // Error on signup:
    // - validateSignupData resolves (valid input)
    // - hashPassword resolves (password hashed successfully)
    // - executePrevQuery rejects
    validateSignupData.mockResolvedValueOnce({
      username: "alex",
      password: "test12ciao",
      repeat_password: "test12ciao",
      email: "alex@gmail.com",
    });
    hashPassword.mockResolvedValueOnce("hashed_pasword");
    executePrevQuery.mockRejectedValueOnce();
    //arrange
    const mockSignupBody = {
      username: "alex",
      password: "test12ciao",
      repeat_password: "test12ciao",
      email: "alex@gmail.com",
    };

    //act
    const response = await request(app)
      .post("/auth/signup")
      .send(mockSignupBody);

    // assert;
    expect(validateSignupData).toHaveBeenCalledTimes(1);
    expect(hashPassword).toHaveBeenCalledTimes(1);
    expect(executePrevQuery).toHaveBeenCalledTimes(1);
    expect(createUser).toHaveBeenCalledTimes(0);
    expect(response.statusCode).toBe(500);
    expect(response.body).toMatchObject({ message: "ExecutePrevQuery Error" });
  });

  test("Should return 400 if validateSignupData rejects invalid input.", async () => {
    // Error on signup:
    // - validateSignupData rejects (valid input)
    validateSignupData.mockRejectedValueOnce();

    //arrange
    const mockSignupBody = {
      username: "alex",
      password: "test12ciao",
      repeat_password: "test12ciao",
      email: "alex@gmail.com",
    };

    //act
    const response = await request(app)
      .post("/auth/signup")
      .send(mockSignupBody);

    // assert;
    // expect(validateSignupData).toHaveBeenCalledTimes(1);
    // expect(createUser).toHaveBeenCalledTimes(0);
    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({ message: "Validation Error" });
  });

  test("Should return 500 if hashPassword throws an error during signup.", async () => {
    //Error on signup:
    // - validateSignupData rejects
    validateSignupData.mockResolvedValueOnce({
      username: "alex",
      password: "test12ciao",
      repeat_password: "test12ciao",
      email: "alex@gmail.com",
    });
    //mock that reject the promise
    hashPassword.mockRejectedValueOnce();

    //arrange
    const mockSignupBody = {
      username: "alex",
      password: "test12ciao",
      repeat_password: "test12ciao",
      email: "alex@gmail.com",
    };

    //act
    const response = await request(app)
      .post("/auth/signup")
      .send(mockSignupBody);

    // assert;
    expect(validateSignupData).toHaveBeenCalledTimes(1);
    expect(hashPassword).toHaveBeenCalledTimes(1);
    expect(createUser).toHaveBeenCalledTimes(0);
    expect(response.statusCode).toBe(500);
    expect(response.body).toMatchObject({ message: "Hashing Error" });
  });

  test("Should return 400 if empty body was sent.", async () => {
    //Error on signup:
    // - validateSignupData rejects throwing an errro
    validateSignupData.mockRejectedValueOnce({ message: "Validation Error" });

    //arrange
    const mockSignupBody = {};

    //act
    const response = await request(app)
      .post("/auth/signup")
      .send(mockSignupBody);

    // assert;
    expect(validateSignupData).toHaveBeenCalledTimes(1);
    expect(createUser).toHaveBeenCalledTimes(0);
    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({ message: "Validation Error" });
  });
});

//LOGIN UNIT TEST API TEST
describe("unit test (api test) for /login", () => {
  beforeEach(() => {
    loginUser.mockReset();
  });

  test("Should return 200, set JWT cookie, and return success message on valid login.", async () => {
    // ripasso data 20 gennaio architettura a strati controller service repository
    // Arrange
    // Mock SOLO il service layer (loginUser) - la dipendenza esterna del controller
    // NON mockiamo setJwtCookie perché è una funzione interna del controller
    // Verifichiamo che il cookie venga impostato nella risposta
    const mockToken = "mocked.jwt.token";

    //mockResolvedValueOnce contiene i valori di ritorno
    loginUser.mockResolvedValueOnce(mockToken);

    const mock_body = {
      email: "alex@gmail.com",
      password: "testciao12",
    };

    // Act
    const response = await request(app).post("/auth/login").send(mock_body);

    // Assert
    expect(loginUser).toHaveBeenCalledTimes(1);
    expect(loginUser).toHaveBeenCalledWith({
      email: "alex@gmail.com",
      password: "testciao12",
    });

    expect(response.statusCode).toBe(200);

    expect(response.body).toMatchObject({
      message: "Login successful",
    });

    const cookies = response.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain("token=");
    expect(cookies[0]).toContain("HttpOnly");
    expect(cookies[0]).toContain(mockToken);
  });

  test("Should return 500 Internal server error if loginUser throws an unexpected error", async () => {
    //arrange
    loginUser.mockRejectedValueOnce(new Error("Invalid payload"));
    //act
    const mock_body = {
      email: "alex@gmail.com",
      password: "testciao12",
    };
    const response = await request(app).post("/auth/login").send(mock_body);
    //assert
    expect(loginUser).toHaveBeenCalledTimes(1);
    expect(loginUser).toHaveBeenCalledWith(mock_body);
    expect(response.statusCode).toBe(500);
    expect(response.body).toMatchObject({ message: "Internal server error" });
  });

  test("Should return 401 Unauthorized if loginUser throws Invalid Credentials error", async () => {
    // Arrange
    loginUser.mockRejectedValueOnce(new Error("Invalid Credentials"));

    const mock_body = {
      email: "alex@gmail.com",
      password: "wrongpassword",
    };

    // Act
    const response = await request(app).post("/auth/login").send(mock_body);

    // Assert
    expect(loginUser).toHaveBeenCalledTimes(1);
    expect(loginUser).toHaveBeenCalledWith(mock_body);
    expect(response.statusCode).toBe(401);
    expect(response.body).toMatchObject({
      message: "Unauthorized",
    });
  });

  test("Should return 400 Bad Request if user try lo login with invalid login data", async () => {
    // Arrange
    loginUser.mockRejectedValueOnce(new Error("Invalid login data."));

    const mock_body = {
      email: "alex@gmail",
      password: "testciao12",
    };

    // Act
    const response = await request(app).post("/auth/login").send(mock_body);

    // Assert
    expect(loginUser).toHaveBeenCalledTimes(1);
    expect(loginUser).toHaveBeenCalledWith(mock_body);
    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({
      message: "Bad Request",
    });
  });

  // test("Should return 401 Unauthorized when comparePasswords resolves to false", async () => {
  //   // Unsuccessful login:
  //   // - validateUserCredential resolves (valid input)
  //   // - findUser resolves (user founded in the db)
  //   // - comparePassword resolve to false
  //   //arrange (mock all function)
  //   validateUserCredentials.mockResolvedValueOnce({
  //     email: "alex@gmail.com",
  //     password: "testciao12",
  //   });
  //   findUser.mockResolvedValueOnce({
  //     rows: [{ Id: 1, username: "alex", email: "alex@gmail.com" }],
  //     rowCount: 1,
  //   });
  //   comparePasswords.mockResolvedValueOnce(false);
  //   //act
  //   const mock_body = {
  //     email: "alex@gmail.com",
  //     password: "testciao12",
  //   };
  //   const response = await request(app).post("/auth/login").send(mock_body);
  //   //assert
  //   expect(validateUserCredentials).toHaveBeenCalledTimes(1);
  //   expect(findUser).toHaveBeenCalledTimes(1);
  //   expect(comparePasswords).toHaveBeenCalledTimes(1);
  //   expect(validateJwtPayload).toHaveBeenCalledTimes(0);
  //   expect(generateJwtToken).toHaveBeenCalledTimes(0);
  //   expect(response.statusCode).toBe(401);
  //   expect(response.body).toMatchObject({
  //     message: "Unauthorized wrong password",
  //   });
  // });

  // test("Should return 500 if comparePasswords throws an error", async () => {
  //   // Unsuccessful login:
  //   // - validateUserCredential resolves (valid input)
  //   // - findUser resolves (user founded in the db)
  //   // - comparePassword rejects
  //   //arrange (mock all function)
  //   validateUserCredentials.mockResolvedValueOnce({
  //     email: "alex@gmail.com",
  //     password: "testciao12",
  //   });
  //   findUser.mockResolvedValueOnce({
  //     rows: [{ Id: 1, username: "alex", email: "alex@gmail.com" }],
  //     rowCount: 1,
  //   });
  //   comparePasswords.mockRejectedValueOnce();
  //   //act
  //   const mock_body = {
  //     email: "alex@gmail.com",
  //     password: "testciao12",
  //   };
  //   const response = await request(app).post("/auth/login").send(mock_body);
  //   //assert
  //   expect(validateUserCredentials).toHaveBeenCalledTimes(1);
  //   expect(findUser).toHaveBeenCalledTimes(1);
  //   expect(comparePasswords).toHaveBeenCalledTimes(1);
  //   expect(validateJwtPayload).toHaveBeenCalledTimes(0);
  //   expect(generateJwtToken).toHaveBeenCalledTimes(0);
  //   expect(response.statusCode).toBe(500);
  //   expect(response.body).toMatchObject({
  //     message: "Internal server error",
  //     context: "Error on comparePasswords",
  //   });
  // });

  // test("Should return 401 if comparePasswords throws an error", async () => {
  //   // Unsuccessful login:
  //   // - validateUserCredential resolves (valid input)
  //   // - findUser resolves (returning [] rows and 0 rowCount)
  //   //arrange (mock all function)
  //   validateUserCredentials.mockResolvedValueOnce({
  //     email: "alex@gmail.com",
  //     password: "testciao12",
  //   });
  //   findUser.mockResolvedValueOnce({
  //     rows: [],
  //     rowCount: 0,
  //   });
  //   //act
  //   const mock_body = {
  //     email: "alex@gmail.com",
  //     password: "testciao12",
  //   };
  //   const response = await request(app).post("/auth/login").send(mock_body);
  //   //assert
  //   expect(validateUserCredentials).toHaveBeenCalledTimes(1);
  //   expect(findUser).toHaveBeenCalledTimes(1);
  //   expect(comparePasswords).toHaveBeenCalledTimes(0);
  //   expect(validateJwtPayload).toHaveBeenCalledTimes(0);
  //   expect(generateJwtToken).toHaveBeenCalledTimes(0);
  //   expect(response.statusCode).toBe(401);
  //   expect(response.body).toMatchObject({ message: "Unauthorized user" });
  // });

  // test("Should return 500 if findUser throws an error", async () => {
  //   // Unsuccessful login:
  //   // - validateUserCredential resolves (valid input)
  //   // - findUser rejects
  //   //arrange (mock all function)
  //   validateUserCredentials.mockResolvedValueOnce({
  //     email: "alex@gmail.com",
  //     password: "testciao12",
  //   });
  //   findUser.mockRejectedValueOnce();

  //   //act
  //   const mock_body = {
  //     email: "alex@gmail.com",
  //     password: "testciao12",
  //   };
  //   const response = await request(app).post("/auth/login").send(mock_body);
  //   //assert
  //   expect(validateUserCredentials).toHaveBeenCalledTimes(1);
  //   expect(findUser).toHaveBeenCalledTimes(1);
  //   expect(comparePasswords).toHaveBeenCalledTimes(0);
  //   expect(validateJwtPayload).toHaveBeenCalledTimes(0);
  //   expect(generateJwtToken).toHaveBeenCalledTimes(0);
  //   expect(response.statusCode).toBe(500);
  //   expect(response.body).toMatchObject({
  //     message: "Internal server error",
  //     context: "Error on findUser",
  //   });
  // });

  // test("Should return 400 if validateUserCredential throws an error", async () => {
  //   // Unsuccessful login:
  //   // - validateUserCredential rejects
  //   //arrange (mock all function)
  //   validateUserCredentials.mockRejectedValueOnce();

  //   //act
  //   const mock_body = {
  //     email: "alex@gmail.com",
  //     password: "testciao12",
  //   };
  //   const response = await request(app).post("/auth/login").send(mock_body);
  //   //assert
  //   expect(validateUserCredentials).toHaveBeenCalledTimes(1);
  //   expect(findUser).toHaveBeenCalledTimes(0);
  //   expect(comparePasswords).toHaveBeenCalledTimes(0);
  //   expect(validateJwtPayload).toHaveBeenCalledTimes(0);
  //   expect(generateJwtToken).toHaveBeenCalledTimes(0);
  //   expect(response.statusCode).toBe(400);
  //   expect(response.body).toMatchObject({ message: "Validation Error" });
  // });

  // test("Should return 500 with an empty body", async () => {
  //   // Unsuccessful login:
  //   // - validateUserCredential rejects thowin the validation Error
  //   //arrange (mock all function)
  //   validateUserCredentials.mockRejectedValueOnce(
  //     new Error("Validation Error")
  //   );

  //   //act
  //   const mock_body = {};
  //   const response = await request(app).post("/auth/login").send(mock_body);
  //   //assert
  //   expect(validateUserCredentials).toHaveBeenCalledTimes(1);
  //   expect(findUser).toHaveBeenCalledTimes(0);
  //   expect(comparePasswords).toHaveBeenCalledTimes(0);
  //   expect(validateJwtPayload).toHaveBeenCalledTimes(0);
  //   expect(generateJwtToken).toHaveBeenCalledTimes(0);
  //   expect(response.statusCode).toBe(400);
  //   expect(response.body).toMatchObject({ message: "Validation Error" });
  // });
});
