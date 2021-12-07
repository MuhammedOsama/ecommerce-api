const express = require('express');
const router = express.Router();

// models
const {Category} = require("../models/category");

router.get(`/`, async (req, res) => {
    const categoryList = await Category.find();

    if (!categoryList) return res.status(500).json({success: false});
    res.status(200).send(categoryList);
});

router.get(`/:id`, async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) return res.status(500).json({message: 'Category not found'});
    res.status(200).send(category);
});

router.post(`/`, async (req, res) => {
    const category = new Category({...req.body});

    if (!category) return res.status(500).send('The category can\'t be created.');
    await category.save();
    res.send(category);
});

router.put('/:id', async (req, res) => {
    const category = await Category.findByIdAndUpdate(req.params.id, {...req.body}, {new: true});

    if (!category) return res.status(500).json({message: 'Category not found'});
    res.status(200).send(category);
});

router.delete('/:id', (req, res) => {
    Category.findByIdAndRemove(req.params.id)
        .then((category) => {
            if (category) return res.status(200).json({success: true, message: 'Deleted Successfully.'});
            else return res.status(404).json({success: false, message: 'Category not Found.'});
        })
        .catch((err) => res.status(400).json({success: false, error: err}));
});

module.exports = router;
