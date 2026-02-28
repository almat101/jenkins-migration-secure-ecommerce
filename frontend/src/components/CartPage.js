import { useState, useContext } from "react";
import axios from "axios";
import {
  Container,
  Table,
  Button,
  Alert,
  Card,
  Row,
  Col,
  Form,
} from "react-bootstrap";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const isDev = process.env.REACT_APP_IS_DEV === "true";
const ORDERS_URL = isDev ? "http://localhost:3040/api/orders" : "/api/orders";

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, getTotal } =
    useContext(CartContext);
  const { isAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!isAuth) {
      setMessage("Please login to place an order");
      setVariant("warning");
      return;
    }

    if (cart.length === 0) {
      setMessage("Cart is empty!");
      setVariant("warning");
      return;
    }

    setLoading(true);
    try {
      // Prepara i dati per l'ordine nel formato che orders-service si aspetta
      const orderData = {
        total_price: getTotal().toFixed(2),
        status: "PENDING",
        items: cart.map((item) => ({
          product_id: item.id,
          price: item.price.toString(),
          quantity: item.quantity,
        })),
      };

      await axios.post(ORDERS_URL, orderData, {
        withCredentials: true,
      });

      setMessage("Order placed successfully!");
      setVariant("success");
      clearCart();

      // Redirect dopo 2 secondi
      setTimeout(() => {
        navigate("/products");
      }, 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to place order");
      setVariant("danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4 mb-5">
      <h2 className="mb-4">Your Cart</h2>

      {message && (
        <Alert variant={variant} onClose={() => setMessage("")} dismissible>
          {message}
        </Alert>
      )}

      {cart.length === 0 ? (
        <Card className="text-center p-5">
          <Card.Body>
            <h4>Your cart is empty</h4>
            <p className="text-muted">Add some products to get started!</p>
            <Button variant="primary" onClick={() => navigate("/products")}>
              Browse Products
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead className="table-dark">
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    {item.category && (
                      <small className="text-muted d-block">
                        {item.category}
                      </small>
                    )}
                  </td>
                  <td>${parseFloat(item.price).toFixed(2)}</td>
                  <td style={{ width: "120px" }}>
                    <Form.Control
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.id, parseInt(e.target.value) || 0)
                      }
                      size="sm"
                    />
                  </td>
                  <td>
                    <strong>
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </strong>
                  </td>
                  <td>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                    >
                      ✕ Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Row className="mt-4">
            <Col md={6}>
              <Button
                variant="outline-secondary"
                onClick={clearCart}
                className="me-2"
              >
                Clear Cart
              </Button>
              <Button
                variant="outline-primary"
                onClick={() => navigate("/products")}
              >
                Continue Shopping
              </Button>
            </Col>
            <Col md={6}>
              <Card className="bg-light">
                <Card.Body>
                  <Row className="align-items-center">
                    <Col>
                      <h4 className="mb-0">
                        Total: ${getTotal().toFixed(2)}
                      </h4>
                    </Col>
                    <Col className="text-end">
                      <Button
                        variant="success"
                        size="lg"
                        onClick={handleCheckout}
                        disabled={loading}
                      >
                        {loading ? "Processing..." : "Place Order"}
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default CartPage;
