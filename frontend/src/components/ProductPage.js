import { useState, useEffect, useCallback, useContext } from "react";
import axios from "axios";
import { CartContext } from "../context/CartContext";

import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Row,
} from "react-bootstrap";

const isDev = process.env.REACT_APP_IS_DEV === "true";
const URL = isDev ? "http://localhost:3020/api/products/my-home/" : "/api/products/my-home/";

const ProductPage = () => {
  const { addToCart } = useContext(CartContext);
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");

  // Fetch all products
  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get(`${URL}`, {
        withCredentials: true,
      });
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMessage("Failed to fetch products");
    }
  }, []);

  // Fetch all products on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Products for Sale</h2>
      {message && (
        <Alert variant="info" onClose={() => setMessage("")} dismissible>
          {message}
        </Alert>
      )}
      <Row>
        {products.length > 0 ? (
          products.map((product) => (
            <Col key={product.id} sm={12} md={6} lg={4} className="mb-4">
              <Card style={{ width: "18rem" }}>
                <Card.Body>
                  <Card.Title>{product.name}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    ${product.price}
                  </Card.Subtitle>
                  <Card.Text>Category: {product.category}</Card.Text>
                  <Card.Text className="text-muted">
                    Available: {product.quantity}
                  </Card.Text>

                  <Button
                    variant="success"
                    onClick={() => {
                      addToCart(product);
                      setMessage(`${product.name} added to cart!`);
                    }}
                    disabled={product.quantity <= 0}
                  >
                    Add to Cart
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <div className="text-center">
            <p>No products available</p>
          </div>
        )}
      </Row>
    </Container>
  );
};

export default ProductPage;
