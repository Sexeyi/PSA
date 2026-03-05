import React, { useState } from "react";
import "./MyRequests.css";

const MyRequests = () => {
    const [formData, setFormData] = useState({
        employeeName: "",
        department: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
    });

    const [items, setItems] = useState([
        {
            category: "",
            itemName: "",
            description: "",
            quantity: 1,
        },
    ]);

    const categories = [
        "Office Supplies",
        "Consumables",
        "COVID-19 Response Item",
    ];

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...items];
        updatedItems[index][field] =
            field === "quantity" ? Number(value) : value;
        setItems(updatedItems);
    };

    const addItemRow = () => {
        setItems([
            ...items,
            { category: "", itemName: "", description: "", quantity: 1 },
        ]);
    };

    const removeItemRow = (index) => {
        const updatedItems = items.filter((_, i) => i !== index);
        setItems(updatedItems);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            ...formData,
            items,
        };

        console.log("Requisition Submitted:", payload);
        // axios.post("/api/requisitions", payload)
    };

    return (
        <div className="requisition-container">
            <h2>Requisition Form</h2>

            <form onSubmit={handleSubmit}>
                {/* Employee Info */}
                <div className="form-grid">
                    <div className="form-group">
                        <label>Employee Name</label>
                        <input
                            type="text"
                            name="employeeName"
                            value={formData.employeeName}
                            onChange={handleFormChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Department</label>
                        <input
                            type="text"
                            name="department"
                            value={formData.department}
                            onChange={handleFormChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleFormChange}
                            required
                        />
                    </div>
                </div>

                {/* Items Table */}
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Item Name</th>
                                <th>Description</th>
                                <th>Qty</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index}>
                                    <td>
                                        <select
                                            value={item.category}
                                            onChange={(e) =>
                                                handleItemChange(index, "category", e.target.value)
                                            }
                                            required
                                        >
                                            <option value="">Select</option>
                                            {categories.map((cat, i) => (
                                                <option key={i} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                    </td>

                                    <td>
                                        <input
                                            type="text"
                                            value={item.itemName}
                                            onChange={(e) =>
                                                handleItemChange(index, "itemName", e.target.value)
                                            }
                                            required
                                        />
                                    </td>

                                    <td>
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) =>
                                                handleItemChange(index, "description", e.target.value)
                                            }
                                        />
                                    </td>

                                    <td>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                handleItemChange(index, "quantity", e.target.value)
                                            }
                                            required
                                        />
                                    </td>

                                    <td>
                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                className="btn-remove"
                                                onClick={() => removeItemRow(index)}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <button
                    type="button"
                    className="btn-add"
                    onClick={addItemRow}
                >
                    + Add Item
                </button>

                {/* Notes */}
                <div className="form-group notes-section">
                    <label>Purpose / Notes to Admin</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleFormChange}
                        rows="4"
                        placeholder="Explain why these items are needed..."
                    />
                </div>

                <button type="submit" className="btn-submit">
                    Submit Requisition
                </button>
            </form>
        </div>
    );
};

export default MyRequests;