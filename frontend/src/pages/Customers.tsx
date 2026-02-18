import { useState } from "react";
import axios from "axios";

export default function Customers() {
  const [form, setForm] = useState({
    salutation: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    shipping_address: "",
    billing_address: "",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await axios.post("http://localhost:8080/api/customers", form);
      alert("Customer created successfully!");
    } catch (error) {
      alert("Error creating customer");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Create Customer</h2>

      <div style={{ display: "grid", gap: "15px", maxWidth: "600px" }}>
        <input name="salutation" placeholder="Salutation" onChange={handleChange} />
        <input name="first_name" placeholder="First Name *" onChange={handleChange} />
        <input name="middle_name" placeholder="Middle Name" onChange={handleChange} />
        <input name="last_name" placeholder="Last Name *" onChange={handleChange} />
        <input name="email" placeholder="Email *" onChange={handleChange} />
        <input name="phone" placeholder="Phone *" onChange={handleChange} />
        <input name="shipping_address" placeholder="Shipping Address" onChange={handleChange} />
        <input name="billing_address" placeholder="Billing Address" onChange={handleChange} />

        <button onClick={handleSubmit}>Save</button>
      </div>
    </div>
  );
}