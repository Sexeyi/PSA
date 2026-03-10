import React, { useState } from "react";
import axios from "axios";
import "./MyRequests.css";

const MyRequests = () => {
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState([{ itemName: "", quantity: 0, unit: "", category: "" }]);

    const handleItemChange = (index, field, value) => {
        const updated = [...items];
        updated[index][field] = field === "quantity" ? Number(value) : value;
        setItems(updated);
    };

    const addItem = () => {
        setItems([...items, { itemName: "", quantity: 0, unit: "", category: "" }]);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem("token");
            const payload = { items, notes };

            const res = await axios.post(
                "http://localhost:5000/api/requisitions",
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("Requisition submitted successfully");
            console.log(res.data);
        } catch (error) {
            console.error(error);
            alert("Error submitting requisition");
        }
    };

    return (
        <div className="requisition-container">
            <h2>Requisition Form</h2>

            <form onSubmit={handleSubmit}>
                <table>
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Quantity</th>
                            <th>Unit</th>
                            <th>Category</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td>
                                    <input
                                        type="text"
                                        value={item.itemName}
                                        onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                                        required
                                    />
                                </td>

                                <td>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                    />
                                </td>

                                <td>
                                    <input
                                        type="text"
                                        value={item.unit}
                                        onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                                    />
                                </td>

                                <td>
                                    <input
                                        type="text"
                                        value={item.category}
                                        onChange={(e) => handleItemChange(index, "category", e.target.value)}
                                    />
                                </td>

                                <td>
                                    {items.length > 1 && (
                                        <button type="button" onClick={() => removeItem(index)}>
                                            Remove
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <button type="button" onClick={addItem}>
                    Add Item
                </button>

                <br />

                <textarea
                    placeholder="Notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />

                <br />

                <button type="submit">Submit Requisition</button>
            </form>
        </div>
    );
};

export default MyRequests;