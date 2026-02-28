import { describe, expect, jest, test } from "@jest/globals";
// import { hashPassword } from "../../services/authService.js";
// Mock di pg
const mockQuery = jest.fn();

// Create a mock pool object that mimics the pg Pool interface
// This replaces the real database pool with test doubles
// mockPool simula la pool e la connesione al database
const mockPool = {
  query: mockQuery,
  connect: jest.fn(),
  end: jest.fn(),
};

jest.unstable_mockModule("../../config/database.js", () => ({
  getPool: () => mockPool, // Replace real getPool with function that returns our mock
}));

// Importa il repository solo dopo aver configurato il mock
const { findUser, testDatabaseConnection, executePrevQuery, createUser } =
  await import("../../repositories/authRepository.js");

const { hashPassword } = await import("../../services/authService.js");

describe("Unit test for findUser", () => {
  beforeEach(() => {
    mockQuery.mockReset(); //  this clears any previous calls and mock implementations before each test, so they run isolated and cleaned
  });
  test("should find a valid user", async () => {
    //Arrange
    const mockUser = {
      Id: 1,
      username: "alex",
      email: "alex@gmail.com",
    };

    const mockQueryResult = {
      rows: [mockUser],
      rowCount: 1,
    };

    mockQuery.mockResolvedValueOnce(mockQueryResult);

    const email = "alex@gmail.com";

    //Act
    const result = await findUser(email);

    //Assert
    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    //Verify
    expect(result.rows[0]).toEqual(mockUser);
    expect(result.rowCount).toBe(1);
  });

  test("should not find a valid user ", async () => {
    //Arrange
    const mockQueryResult = {
      rows: [],
      rowCount: 0,
    };

    mockQuery.mockResolvedValueOnce(mockQueryResult);

    const email = "adsfsfx@gmail.com";

    //Act
    const result = await findUser(email);

    //Assert
    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    //Verify
    expect(result.rows[0]).toBeUndefined();
    expect(result.rows).toEqual([]);
    expect(result.rowCount).toBe(0);
  });

  test("Should throw an error if the database findUser fails", async () => {
    mockQuery.mockRejectedValueOnce(new Error("Error on findUser"));
    await expect(findUser("alex@gmail.com")).rejects.toThrow(
      /^Error on findUser$/
    );
  });
});

describe("Unit test for testDatabaseConnection", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });
  test("Should return true if the database is online(it will return true because the pg module is mocked)", async () => {
    //Arrange
    mockQuery.mockResolvedValueOnce({}); //empty object to simulate the success of the query if we dont use this, we get undefined as result and a promise that resolve to undefined is also true
    //act
    const result = await testDatabaseConnection();
    const queryResult = await mockQuery.mock.results[0].value;
    //assert
    expect(result).toBe(true);
    expect(queryResult).toEqual({});
  });

  test("Should return false if testdatabase fails", async () => {
    mockQuery.mockRejectedValueOnce(false);
    await expect(testDatabaseConnection()).resolves.toBe(false);
  });
});

describe("Unit test for executePrevQuery", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });
  test("Should return the value of the user(username or email) if is present in the database", async () => {
    //arrange
    // we create a mockUser with fake data
    const mockUser = {
      id: 3,
      username: "alex",
      email: "alex@gmail.com",
    };
    //we create the fake query
    const mockQueryResult = {
      row: [mockUser],
      rowCount: 1,
    };

    // we resolve the query
    mockQuery.mockResolvedValueOnce(mockQueryResult);

    const username = "alex";
    const email = "alex@gmail.com";

    //act
    const result = await executePrevQuery(username, email);

    //assert
    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT * FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );
    //verify the result
    expect(result.row[0]).toEqual(mockUser);
    expect(result.rowCount).toBe(1);
  });

  test("Should return no user if username or email is not present in the database", async () => {
    //arrange
    //we create the fake query
    const mockQueryResult = {
      row: [],
      rowCount: 0,
    };

    // we resolve the query
    mockQuery.mockResolvedValueOnce(mockQueryResult);

    const username = "alex";
    const email = "alex@gmail.com";

    //act
    const result = await executePrevQuery(username, email);

    //assert
    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT * FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );
    //verify the result
    expect(result.row).toEqual([]);
    expect(result.row[0]).toBeUndefined();
    expect(result.rowCount).toBe(0);
  });

  test("Should throw an error if the database prevquery fails", async () => {
    mockQuery.mockRejectedValueOnce(new Error("Error on executePrevQuery"));
    await expect(executePrevQuery("alex", "alex@gmail.com")).rejects.toThrow(
      /^Error on executePrevQuery$/
    );
  });
});

describe("Unit test for createUser", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });
  test("Should create a new user in the database", async () => {
    //arrange
    //create fake data first the mockUser to simulate the user that we insert in the db
    const mockUser = {
      id: "1",
      username: "alex",
      email: "alex@gmail.com",
    };
    //create the query
    const mockQueryResult = {
      row: [mockUser],
      rowCount: 1,
    };

    mockQuery.mockResolvedValueOnce(mockQueryResult);

    // fake data that has to be the same as the mocked query
    const username = "alex";
    const email = "alex@gmail.com";

    const plaintextPassword = "test12Ciao";
    const hash = await hashPassword(plaintextPassword);

    //act
    const result = await createUser(username, email, hash);

    //assert
    expect(mockQuery).toHaveBeenCalledWith(
      "INSERT INTO users (username, email, password_hash) VALUES ($1 ,$2 ,$3 ) returning *",
      [username, email, hash]
    );
    //verify
    expect(result.row[0]).toEqual({
      id: "1",
      username: "alex",
      email: "alex@gmail.com",
    });
    expect(result.rowCount).toBe(1);
  });

  test("Should not create a user if the function does not insert any row", async () => {
    //arrange
    //create fake data first the mockUser to simulate the user that we insert in the db
    //create the query
    const mockQueryResult = {
      row: [],
      rowCount: 0,
    };

    mockQuery.mockResolvedValueOnce(mockQueryResult);

    // fake data that has to be the same as the mocked query
    const username = "alex";
    const email = "alex@gmail.com";

    const plaintextPassword = "test12Ciao";
    const hash = await hashPassword(plaintextPassword);

    //act
    const result = await createUser(username, email, hash);

    //assert
    expect(mockQuery).toHaveBeenCalledWith(
      "INSERT INTO users (username, email, password_hash) VALUES ($1 ,$2 ,$3 ) returning *",
      [username, email, hash]
    );
    //verify
    expect(result.row[0]).toBeUndefined();
    expect(result.rowCount).toBe(0);
  });

  test("Should throw an error if the database insert operation fails", async () => {
    mockQuery.mockRejectedValueOnce(new Error("Error on createUser"));
    await expect(
      createUser("alex", "alex@gmail.com", "uhewafasiorfddu12qw9usjd#@")
    ).rejects.toThrow(/^Error on createUser$/); //strict regular expression match
  });
});

// sintassi import dimamico:
// const { ... } = await import('...');
// Use case:
// 1. nei test quando devi Mockare Dipendenze:
// Ad esempio, quando un modulo crea istanze di classi o oggetti al momento dell'importazione.
// 2. Vuoi Controllare l'Ordine di Esecuzione:
// Assicurarti che il mock sia configurato prima che il modulo venga caricato.
