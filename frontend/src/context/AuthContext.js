import { createContext, useState, useEffect } from "react";
import axios from "axios";

const isDev = process.env.REACT_APP_IS_DEV === "true";
const URL = isDev
  ? "http://localhost:3030/auth/checkIsAuth"
  : "/auth/checkIsAuth";

//impostato auth context a null ( questo avviene all'avvio dell app )
export const AuthContext = createContext(null);

// provider che deve avvolgere l app e mostrare lo stato ai suoi componenti figli(prende children come argomento)
export const AuthProvider = ({ children }) => {
  const [isAuth, setAuth] = useState(false);

  const authorize = async () => {
    try {
      const response = await axios.get(`${URL}`, { withCredentials: true });
      // console.log(response.data.isAuth);
      setAuth(response.data.isAuth);
    } catch (error) {
      console.error(
        "Authorization failed:",
        error.response?.data || error.message
      );
      setAuth(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await authorize();
    };

    fetchData();
  }, []);

  const login = async () => {
    setAuth(true);
  };

  const logout = () => {
    setAuth(false);
  };

  //ritorno il provider con il valore da condividere ai figli
  return (
    <AuthContext.Provider value={{ isAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
