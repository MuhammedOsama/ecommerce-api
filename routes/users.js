const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// models
const {User} = require("../models/user");

router.get(`/`, async (req, res) => {
    const userList = await User.find().select('-password');

    if (!userList) return res.status(500).json({success: false});
    res.send(userList);
});

router.get(`/:id`, async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) return res.status(500).json({message: 'User not found'});
    res.status(200).send(user);
});

router.post(`/`, async (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
    });

    if (!user) return res.status(500).send('The user can\'t be created.');
    await user.save();
    res.send(user);
});

router.put('/:id', async (req, res) => {
    const userExist = await User.findById(req.params.id);
    let newPassword;
    if (req.body.password) {
        newPassword = bcrypt.hashSync(req.body.password, 10);
    } else {
        newPassword = userExist.password;
    }

    const user = await User.findByIdAndUpdate(req.params.id, {
        name: req.body.name,
        email: req.body.email,
        password: newPassword,
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
    }, {new: true});

    if (!user) return res.status(400).send('the user cannot be created!')
    res.send(user);
});

router.post('/login', async (req, res) => {
    const user = await User.findOne({email: req.body.email});

    if (!user) return res.status(400).send('User not Found.');
    if (user && bcrypt.compareSync(req.body.password, user.password)) {
        const token = jwt.sign({
            userId: user.id,
            isAdmin: user.isAdmin,
        }, process.env.SECRET, {expiresIn: '1d'});
        res.status(200).send({user: user.email, token: token});
    } else {
        res.status(400).send('Wrong Password.');
    }
});

router.post('/register', async (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
    });

    await user.save();
    if (!user) return res.status(400).send('User can\'t be created!')
    res.send(user);
});

router.delete('/:id', (req, res) => {
    User.findByIdAndRemove(req.params.id)
        .then((user) => {
            if (user) return res.status(200).json({success: true, message: 'Deleted Successfully.'});
            else return res.status(404).json({success: false, message: 'User not Found.'});
        })
        .catch((err) => res.status(400).json({success: false, error: err}));
});

router.get(`/get/count`, async (req, res) => {
    const userCount = await User.countDocuments((count) => count);

    if (!userCount) return res.status(500).json({success: false});
    res.send({count: userCount});
});

module.exports = router;
