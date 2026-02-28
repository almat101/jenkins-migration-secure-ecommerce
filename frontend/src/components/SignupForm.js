import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Alert, Container, Form, Button } from "react-bootstrap";

const isDev = process.env.REACT_APP_IS_DEV === "true";
const URL = isDev ? "http://localhost:3030/auth/signup" : "auth/signup";

const SignupForm = () => {
  const navigate = useNavigate();
  //stato iniziale del form
  const [FormData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    repeat_password: "",
  });

  const [message, setMessage] = useState(""); // Stato per messaggi di successo o errore
  const [variant, setVariant] = useState(""); // Stato per Alert

  //gestione dei cambiamenti nei campi
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...FormData,
      [name]: value,
    });
  };

  // Gestione del submit del form
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form data:", FormData);
    try {
      const response = await axios.post(`${URL}`, FormData, {
        headers: { "Content-Type": "application/json" },
      });
      setMessage("Signup successful!");
      setVariant("success");
      console.log(response.data); // Per debug
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Signup failed!"); // Mostra un messaggio di errore
      setVariant("danger");
      console.error(error.response?.data); // Per debug
    }
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "80vh" }}
    >
      <Form className="p-4 border rounded shadow" onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formBasicUsername">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            name="username"
            value={FormData.username}
            onChange={handleChange}
            placeholder="Enter username"
            autoComplete="username"
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={FormData.email}
            onChange={handleChange}
            placeholder="Enter email"
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={FormData.password}
            onChange={handleChange}
            placeholder="Password"
            autoComplete="new-password"
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicRepeatPassword">
          <Form.Label>Repeat password</Form.Label>
          <Form.Control
            type="password"
            name="repeat_password"
            value={FormData.repeat_password}
            onChange={handleChange}
            placeholder="Repeat password"
            autoComplete="new-password"
          />
        </Form.Group>

        <Button variant="primary" type="submit" className="w-100">
          Signup
        </Button>
        {message && (
          <Alert variant={variant} className="mt-3">
            {message}
          </Alert>
        )}
      </Form>
    </Container>
  );
};

export default SignupForm;
