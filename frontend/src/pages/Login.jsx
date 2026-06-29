import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const data = await loginUser({
        email,
        password,
      });

      // Save token and user
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      alert("Login Successful");
window.location.href = "/dashboard";
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Login Failed"
      );
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "80px" }}>
      <h2>Login Page</h2>

      <input
        type="text"
        placeholder="Enter Email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
        style={{
          display: "block",
          margin: "10px auto",
          padding: "10px",
        }}
      />

      <input
        type="password"
        placeholder="Enter Password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
        style={{
          display: "block",
          margin: "10px auto",
          padding: "10px",
        }}
      />

      <button
        onClick={handleLogin}
        style={{ padding: "10px 20px" }}
      >
        Login
      </button>

      <p
        style={{ cursor: "pointer", color: "blue" }}
        onClick={() =>
          navigate("/register")
        }
      >
        Don't have an account? Register
      </p>
    </div>
  );
}

export default Login;