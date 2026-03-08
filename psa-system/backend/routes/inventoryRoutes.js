const router = require("express").Router();
const inventoryController = require("../controllers/inventoryController");
const auth = require("../middleware/auth");

router.get("/", auth, inventoryController.getInventory);

router.post("/", auth, inventoryController.createItem);

router.put("/:id", auth, inventoryController.updateItem);

router.delete("/:id", auth, inventoryController.deleteItem);

module.exports = router;