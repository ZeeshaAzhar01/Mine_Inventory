// Dummy data
let users = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" }
];

// GET all users
exports.getAllUsers = (req, res) => {
    res.json(users);
};

// GET user by ID (req.params)
exports.getUserById = (req, res) => {
    const id = req.params.id;

    const user = users.find(u => u.id == id);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
};

// CREATE user (req.body)
exports.createUser = (req, res) => {
    const newUser = {
        id: users.length + 1,
        name: req.body.name
    };

    users.push(newUser);

    res.status(201).json(newUser);
};