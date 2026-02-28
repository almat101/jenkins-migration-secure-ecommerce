## Jest Testing Principles and Patterns

### The AAA Pattern (Arrange, Act, Assert)

A best practice in writing tests is to follow the **AAA pattern**:
- **Arrange:** Set up the data and environment for your test.
- **Act:** Execute the function or code under test.
- **Assert:** Check that the result matches your expectations.

**Example:**
```js
test("should hash a password from plaintext and verify it matches the plaintext password", async () => {
  // Arrange
  const plaintextPassword = "1teStPasSw0rD2";

  // Act
  const hash = await hashPassword(plaintextPassword);

  // Assert
  expect(hash).toBeDefined();
  expect(typeof hash).toBe("string");
  expect(hash).not.toBe(plaintextPassword);

  // Verify
  const is_the_same = await comparePasswords(plaintextPassword, hash);
  expect(is_the_same).toBe(true);
});
```

---

### Using `expect` and Matchers

- **`.toBe(value)`**: Checks strict equality (===), used for primitives.
- **`.toStrictEqual(value)`**: Checks deep equality, used for objects/arrays.
- **`.not`**: Negates the matcher (e.g., `expect(a).not.toBe(b)`).
- **`.toThrow(error)`**: Checks that a function throws an error.
- **`.resolves` / `.rejects`**: Used for testing async functions that return promises.

#### Testing Promises

- **`.resolves`**: Asserts that a promise resolves to a value.
  ```js
  await expect(comparePasswords(plaintextPassword, hashed)).resolves.toBe(true);
  ```
- **`.rejects`**: Asserts that a promise rejects with an error.
  ```js
  await expect(hashPassword(plaintextPassword)).rejects.toThrow("Custom error thrown");
  ```

#### Examples from `authService.test.js`

- **Testing a resolved promise:**
  ```js
  await expect(comparePasswords(plaintextPassword, hashed)).resolves.toBe(true);
  ```
- **Testing a rejected promise:**
  ```js
  await expect(hashPassword(plainTextPassword)).rejects.toThrow("Custom error thrown");
  ```
- **Testing synchronous errors:**
  ```js
  expect(() => validateJwtPayload(payload, secret, options)).toThrow("Invalid payload");
  ```
- **Testing deep equality:**
  ```js
  expect(result).toStrictEqual({
    email: "alex@gmail.com",
    password: "test2Ciao3",
  });
  ```

---

### Summary Table

| Matcher                        | Use Case                                 |
|---------------------------------|------------------------------------------|
| `.toBe(value)`                  | Primitives, strict equality              |
| `.toStrictEqual(value)`         | Objects/arrays, deep equality            |
| `.not`                          | Negate any matcher                       |
| `.toThrow(error)`               | Function throws error (sync)             |
| `.resolves.toBe(value)`         | Promise resolves to value                |
| `.rejects.toThrow(error)`       | Promise rejects with error               |

---

**Tip:**  
Use the AAA pattern for clarity and maintainability.  
Use `.resolves` and `.rejects` for async code, and choose the matcher that best fits your expected result.