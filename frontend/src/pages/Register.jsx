function Register() {
  return (
    <div style={{ textAlign: "center", marginTop: "80px" }}>
      <h2>Register Page</h2>

      <input placeholder="Name" style={{ display: "block", margin: "10px auto", padding: "10px" }} />
      <input placeholder="Email" style={{ display: "block", margin: "10px auto", padding: "10px" }} />
      <input type="password" placeholder="Password" style={{ display: "block", margin: "10px auto", padding: "10px" }} />

      <button style={{ padding: "10px 20px" }}>
        Register
      </button>
      <p
  style={{ cursor: "pointer", color: "blue" }}
  onClick={() => window.location.href = "/"}
>
  
  Already have an account? Login
</p>
    </div>
  );
}

export default Register;