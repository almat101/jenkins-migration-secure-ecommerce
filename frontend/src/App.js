import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
// import Header from './components/Header';
import BSNavbar from './components/BSNavbar'
import Footer from './components/Footer';
import SignupForm from './components/SignupForm';
import LoginForm from './components/LoginForm';
import ProductPage from './components/ProductPage'
import CartPage from './components/CartPage';
import NotFound from './components/NotFound';
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import 'bootstrap/dist/css/bootstrap.min.css';
import MyHome from './components/MyHome';

function App() {
  return (

    <AuthProvider>
    <CartProvider>

    <Router>
      <div className="App">
        {/* <Header /> */}
        <BSNavbar />
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<MyHome/>} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path='/products' element={<ProductPage />} />
          <Route path='/cart' element={<CartPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </div>
    </Router>

    </CartProvider>
    </AuthProvider>
  );
}

export default App;