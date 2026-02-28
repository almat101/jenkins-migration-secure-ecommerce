import { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Alert, Container, Form, Button } from "react-bootstrap";

const isDev = process.env.REACT_APP_IS_DEV === "true";
const URL = isDev ? "http://localhost:3030/auth/login" : "/auth/login";
const DEMO_URL = isDev ? "http://localhost:3030/auth/demo" : "/auth/demo";

const LoginForm = () => {
  const { login } = useContext(AuthContext);

  const navigate = useNavigate();
  const [FormData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState(""); // Stato per messaggi di successo o errore
  const [variant, setVariant] = useState(""); // Stato per Alert

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...FormData,
      [name]: value,
    });
  };

  // Gestione del submit del form
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${URL}`, FormData, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      login(); //aggiorna l'authcontext
      setMessage("Login successful!");
      setVariant("success");
      navigate("/home", { replace: true });
    } catch (error) {
      setMessage(error.response?.data?.message || "Signup failed!"); // Mostra un messaggio di errore
      setVariant("danger");
      console.error(error.response?.data);
    }
  };

  const handleDemoLogin = async (e) => {
    e.preventDefault();
    try {
      await axios.get(`${DEMO_URL}`, {
        withCredentials: true,
      });
      login();
      setMessage("Demo login successful!");
      setVariant("success");
      // console.log("handledemologin", document.cookie);
      navigate("/home", { replace: true });
    } catch (error) {
      setMessage(error.response?.data?.message || "Signup failed!"); // Mostra un messaggio di errore
      setVariant("danger");
      console.error(error.response?.data);
    }
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "80vh" }}
    >
      <Form className="p-4 border rounded shadow" onSubmit={handleLogin}>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={FormData.email}
            onChange={handleChange}
            placeholder="Enter email"
            autoComplete="email"
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
            autoComplete="current-password"
          />
        </Form.Group>
        <Button variant="primary" type="submit" className="w-100">
          Login
        </Button>
        <Button
          variant="primary"
          onClick={handleDemoLogin}
          className="w-100 mt-3"
        >
          Live demo
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

export default LoginForm;
