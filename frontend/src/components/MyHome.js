import { useState, useEffect, useCallback } from "react";
import axios from "axios";

import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Row,
  Modal,
  Form,
} from "react-bootstrap";

const isDev = process.env.REACT_APP_IS_DEV === "true";
const PRODUCTS_URL = isDev ? "http://localhost:3020/api/products" : "/api/products";

//invocazione dell interceptor che aggiunge il token bearer ad ogni richiesta
// Interceptor();

const MyHome = () => {
  const [products, setProducts] = useState([]);
  const [addFormData, setAddFormData] = useState({
    name: "",
    price: "",
    category: "",
    quantity: "",
  });
  const [editFormData, setEditFormData] = useState({
    id: null,
    name: "",
    price: "",
    category: "",
    quantity: "",
  });
  const [message, setMessage] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const commonCategories = [
    "Electronics",
    "Furniture",
    "Accessories",
    "Clothing",
    "Home",
    "Sports",
    "Toys",
    "Beauty",
  ];
  const [categories] = useState(commonCategories);

  // Fetch all products
  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get(`${PRODUCTS_URL}`, {
        withCredentials: true,
      });
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMessage("Failed to fetch products");
    }
  }, []);

  // Add a new product
  const addProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${PRODUCTS_URL}`, addFormData, {
        withCredentials: true,
      });
      setMessage("Product added successfully!");
      fetchProducts();
      setAddFormData({ name: "", price: "", category: "", quantity: "" });
    } catch (error) {
      setMessage("Failed to add product");
    } finally {
      setShowAddModal(false);
    }
  };

  const handleShowDeleteModal = (productId) => {
    setSelectedProductId(productId);
    setShowDeleteModal(true);
  };

  const handleShowEditModal = (product) => {
    setEditFormData({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      quantity: product.quantity,
    });
    setShowEditModal(true);
  };

  const updateProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`${PRODUCTS_URL}/${editFormData.id}`, {
        name: editFormData.name,
        price: editFormData.price,
        category: editFormData.category,
        quantity: editFormData.quantity,
      }, {
        withCredentials: true,
      });
      setMessage("Product updated successfully!");
      fetchProducts();
    } catch (error) {
      setMessage("Failed to update product");
    } finally {
      setShowEditModal(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${PRODUCTS_URL}/${selectedProductId}`, {
        withCredentials: true,
      });
      setMessage("Product deleted successfully!");
      fetchProducts(); // Refresh the product list
    } catch (error) {
      setMessage("Failed to delete product");
    } finally {
      setShowDeleteModal(false);
    }
  };

  // Fetch all products on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Products</h2>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          Add New Product
        </Button>
      </div>
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
                    Quantity: {product.quantity}
                  </Card.Text>

                  <Button
                    variant="outline-primary"
                    className="me-2"
                    onClick={() => handleShowEditModal(product)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline-danger"
                    onClick={() => handleShowDeleteModal(product.id)}
                  >
                    Delete
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <div className="text-center w-100">
            <p>You don't have any products yet</p>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              Add Your First Product
            </Button>
          </div>
        )}
      </Row>

      {/* Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this product?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirmation Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add a New Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={addProduct}>
            <Form.Group className="mb-3" controlId="formProductName">
              <Form.Label>Product Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter product name"
                value={addFormData.name}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, name: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formProductPrice">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter product price"
                value={addFormData.price}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, price: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formProductCategory">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={addFormData.category}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, category: e.target.value })
                }
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formProductQuantity">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter quantity"
                min="1"
                value={addFormData.quantity}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, quantity: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" onClick={addProduct}>
            Add Product
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={updateProduct}>
            <Form.Group className="mb-3" controlId="editProductName">
              <Form.Label>Product Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter product name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="editProductPrice">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                placeholder="Enter product price"
                value={editFormData.price}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, price: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="editProductCategory">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={editFormData.category}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, category: e.target.value })
                }
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="editProductQuantity">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter quantity"
                min="0"
                value={editFormData.quantity}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, quantity: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={updateProduct}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MyHome;