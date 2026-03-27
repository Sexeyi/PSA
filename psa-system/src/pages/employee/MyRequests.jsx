import React, { useState, useEffect } from "react";
import axios from "axios";

// shadcn/ui inspired components with Tailwind v4
const Input = ({ label, error, icon, className = "", ...props }) => (
    <div className="space-y-2">
        {label && (
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {label}
            </label>
        )}
        <div className="relative">
            {icon && (
                <div className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {icon}
                </div>
            )}
            <input
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? "border-red-500 focus-visible:ring-red-500" : ""
                    } ${icon ? "ps-10" : ""} ${className}`}
                {...props}
            />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
);

const Select = ({ label, options, error, className = "", ...props }) => (
    <div className="space-y-2">
        {label && (
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {label}
            </label>
        )}
        <select
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? "border-red-500" : ""
                } ${className}`}
            {...props}
        >
            <option value="">Select unit</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
);

const Textarea = ({ label, error, className = "", ...props }) => (
    <div className="space-y-2">
        {label && (
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {label}
            </label>
        )}
        <textarea
            className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? "border-red-500" : ""
                } ${className}`}
            {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
);

const Button = ({ children, variant = "default", size = "default", loading, className = "", ...props }) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
    };

    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={loading}
            {...props}
        >
            {loading && (
                <svg className="animate-spin -ms-1 me-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            )}
            {children}
        </button>
    );
};

const Card = ({ children, className = "" }) => (
    <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
        {children}
    </div>
);

const CardHeader = ({ children, className = "" }) => (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
        {children}
    </div>
);

const CardTitle = ({ children, className = "" }) => (
    <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
        {children}
    </h3>
);

const CardDescription = ({ children, className = "" }) => (
    <p className={`text-sm text-muted-foreground ${className}`}>
        {children}
    </p>
);

const CardContent = ({ children, className = "" }) => (
    <div className={`p-6 pt-0 ${className}`}>
        {children}
    </div>
);

const CardFooter = ({ children, className = "" }) => (
    <div className={`flex items-center p-6 pt-0 ${className}`}>
        {children}
    </div>
);

const Badge = ({ children, variant = "default", className = "" }) => {
    const variants = {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border border-input",
        success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

const Table = ({ children, className = "" }) => (
    <div className={`relative w-full overflow-auto ${className}`}>
        <table className="w-full caption-bottom text-sm">
            {children}
        </table>
    </div>
);

const TableHeader = ({ children, className = "" }) => (
    <thead className={`[&_tr]:border-b ${className}`}>
        {children}
    </thead>
);

const TableBody = ({ children, className = "" }) => (
    <tbody className={`[&_tr:last-child]:border-0 ${className}`}>
        {children}
    </tbody>
);

const TableRow = ({ children, className = "", ...props }) => (
    <tr className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`} {...props}>
        {children}
    </tr>
);

const TableHead = ({ children, className = "" }) => (
    <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`}>
        {children}
    </th>
);

const TableCell = ({ children, className = "" }) => (
    <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}>
        {children}
    </td>
);

// Icons
const Icons = {
    Plus: () => (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    ),
    Trash: () => (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    ),
    Package: () => (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
    ),
    Currency: () => (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Search: () => (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    Refresh: () => (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    ),
};

const unitOptions = [
    { value: "piece", label: "Piece" },
    { value: "roll", label: "Roll" },
    { value: "ream", label: "Ream" },
    { value: "box", label: "Box" },
    { value: "book", label: "Book" },
    { value: "pack", label: "Pack" },
    { value: "set", label: "Set" },
    { value: "bottle", label: "Bottle" },
    { value: "toner", label: "Toner" }
];

const MyRequests = () => {
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState([{
        id: 1,
        itemName: "",
        quantity: "",
        unit: "",
        category: "",
        unitPrice: 0,
        totalPrice: 0,
        errors: {}
    }]);
    const [submitting, setSubmitting] = useState(false);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchInventoryItems();
    }, []);

    const fetchInventoryItems = async () => {
        setLoadingInventory(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_BASE_URL}/api/inventory`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const inventoryData = response.data.data || response.data || [];
            setInventoryItems(inventoryData);
        } catch (error) {
            console.error("Error fetching inventory:", error);
        } finally {
            setLoadingInventory(false);
        }
    };

    const validateItem = (item, index) => {
        const errors = {};
        if (!item.itemName || !item.itemName.trim()) {
            errors.itemName = "Item name is required";
        }
        if (!item.quantity || item.quantity <= 0) {
            errors.quantity = "Quantity must be greater than 0";
        }
        if (!item.unit) {
            errors.unit = "Unit is required";
        }

        setItems(prev => prev.map((i, idx) =>
            idx === index ? { ...i, errors } : i
        ));

        return Object.keys(errors).length === 0;
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...items];

        if (field === "itemName") {
            const selectedInventory = inventoryItems.find(item =>
                (item.name === value || item.itemName === value) ||
                (item.name?.toLowerCase() === value.toLowerCase() || item.itemName?.toLowerCase() === value.toLowerCase())
            );

            if (selectedInventory) {
                updated[index].itemName = selectedInventory.name || selectedInventory.itemName;
                updated[index].unit = selectedInventory.unit || "";
                updated[index].category = selectedInventory.category || "office";
                updated[index].unitPrice = selectedInventory.unitPrice || selectedInventory.price || 0;
                const quantity = updated[index].quantity || 0;
                updated[index].totalPrice = quantity * updated[index].unitPrice;
            } else {
                updated[index].itemName = value;
            }
        } else if (field === "quantity") {
            const quantity = Number(value) || 0;
            updated[index].quantity = quantity;
            updated[index].totalPrice = quantity * (updated[index].unitPrice || 0);
        } else {
            updated[index][field] = value;
        }

        setItems(updated);
        validateItem(updated[index], index);
    };

    const addItem = () => {
        const newId = Math.max(...items.map(i => i.id), 0) + 1;
        setItems([...items, {
            id: newId,
            itemName: "",
            quantity: "",
            unit: "",
            category: "",
            unitPrice: 0,
            totalPrice: 0,
            errors: {}
        }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const calculateGrandTotal = () => {
        return items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    };

    const calculateTotalQuantity = () => {
        return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let isValid = true;
        items.forEach((item, index) => {
            if (!validateItem(item, index)) {
                isValid = false;
            }
        });

        if (!isValid) {
            alert("Please fix the errors before submitting");
            return;
        }

        setSubmitting(true);

        try {
            const token = localStorage.getItem("token");
            const payload = {
                items: items.map(item => ({
                    itemName: item.itemName,
                    quantity: Number(item.quantity),
                    unit: item.unit,
                    category: item.category,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice
                })),
                notes,
                grandTotal: calculateGrandTotal()
            };

            await axios.post(
                `${API_BASE_URL}/api/requisitions`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("✅ Requisition submitted successfully!");

            setItems([{
                id: 1,
                itemName: "",
                quantity: "",
                unit: "",
                category: "",
                unitPrice: 0,
                totalPrice: 0,
                errors: {}
            }]);
            setNotes("");

        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Error submitting requisition");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClear = () => {
        if (window.confirm("Are you sure you want to clear the form?")) {
            setItems([{
                id: 1,
                itemName: "",
                quantity: "",
                unit: "",
                category: "",
                unitPrice: 0,
                totalPrice: 0,
                errors: {}
            }]);
            setNotes("");
        }
    };

    if (loadingInventory) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading inventory...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        Create New Requisition
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Fill out the form below to submit your request for approval
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Items Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Request Items</CardTitle>
                            <CardDescription>
                                Add the items you need to request. Unit prices are automatically populated from inventory.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[280px]">Item Name <span className="text-red-500">*</span></TableHead>
                                            <TableHead className="min-w-[120px]">Quantity <span className="text-red-500">*</span></TableHead>
                                            <TableHead className="min-w-[120px]">Unit <span className="text-red-500">*</span></TableHead>
                                            <TableHead className="min-w-[100px]">Unit Price</TableHead>
                                            <TableHead className="min-w-[100px]">Total</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="relative">
                                                        <div className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                            <Icons.Search />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            list={`inventory-list-${index}`}
                                                            value={item.itemName}
                                                            onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                                                            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ps-10 ${item.errors.itemName ? "border-red-500" : ""
                                                                }`}
                                                            placeholder="Search inventory..."
                                                            autoComplete="off"
                                                        />
                                                        <datalist id={`inventory-list-${index}`}>
                                                            {inventoryItems.map(invItem => (
                                                                <option key={invItem._id} value={invItem.name || invItem.itemName}>
                                                                    {invItem.name || invItem.itemName} - {formatCurrency(invItem.unitPrice || invItem.price)} / {invItem.unit}
                                                                </option>
                                                            ))}
                                                        </datalist>
                                                    </div>
                                                    {item.errors.itemName && (
                                                        <p className="text-sm text-red-500 mt-1">{item.errors.itemName}</p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                                        className={`flex h-10 w-full max-w-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${item.errors.quantity ? "border-red-500" : ""
                                                            }`}
                                                        placeholder="0"
                                                    />
                                                    {item.errors.quantity && (
                                                        <p className="text-sm text-red-500 mt-1">{item.errors.quantity}</p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <select
                                                        value={item.unit}
                                                        onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                                                        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${item.errors.unit ? "border-red-500" : ""
                                                            }`}
                                                    >
                                                        <option value="">Select unit</option>
                                                        {unitOptions.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                    {item.errors.unit && (
                                                        <p className="text-sm text-red-500 mt-1">{item.errors.unit}</p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-medium">{formatCurrency(item.unitPrice)}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-semibold text-primary">{formatCurrency(item.totalPrice)}</span>
                                                </TableCell>
                                                <TableCell>
                                                    {items.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(index)}
                                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                                            title="Remove item"
                                                        >
                                                            <Icons.Trash />
                                                        </button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="mt-4 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={addItem}>
                                    <Icons.Plus className="me-2" />
                                    Add Another Item
                                </Button>
                            </div>

                            {/* Summary Row */}
                            <div className="mt-4 flex justify-end">
                                <div className="bg-muted/50 rounded-lg p-4 min-w-[250px]">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Grand Total:</span>
                                        <span className="text-lg font-bold text-primary">{formatCurrency(calculateGrandTotal())}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Notes</CardTitle>
                            <CardDescription>Any special instructions or comments</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Enter any additional notes or special requirements here..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                            />
                        </CardContent>
                    </Card>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 rounded-lg p-3">
                                        <Icons.Package />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Items</p>
                                        <p className="text-2xl font-bold">{items.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 rounded-lg p-3">
                                        <Icons.Package />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Quantity</p>
                                        <p className="text-2xl font-bold">{calculateTotalQuantity()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 rounded-lg p-3">
                                        <Icons.Currency />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Grand Total</p>
                                        <p className="text-2xl font-bold text-primary">{formatCurrency(calculateGrandTotal())}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={handleClear}>
                            Clear Form
                        </Button>
                        <Button type="submit" loading={submitting}>
                            {submitting ? "Submitting..." : "Submit Requisition"}
                        </Button>
                    </div>

                    {/* Help Text */}
                    <div className="text-center space-y-1">
                        <p className="text-xs text-muted-foreground">
                            Fields marked with <span className="text-red-500">*</span> are required.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Your request will be reviewed by the approver before processing.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MyRequests;