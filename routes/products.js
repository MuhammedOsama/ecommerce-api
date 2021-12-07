const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const router = express.Router();

// models
const {Product} = require("../models/product");
const {Category} = require("../models/category");

// multer
const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpg': 'jpg',
    'image/jpeg': 'jpeg',
};

const storage = multer.diskStorage({
    destination: (req, file, cd) => {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('Invalid image type');

        if (isValid) uploadError = null;
        cd(uploadError, 'public/uploads');
    },
    filename: (req, file, cd) => {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cd(null, `${fileName}-${Date.now()}.${extension}`);
    },
});
const uploadOptions = multer({storage: storage});

router.get(`/`, async (req, res) => {
    let filter = {};
    if (req.query.categories) {
        filter = {
            category: req.query.categories.split(','),
        };
    }

    const productList = await Product.find(filter).populate('category');

    if (!productList) return res.status(500).json({success: false});
    res.send(productList);
});

router.get(`/:id`, async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category');

    if (!product) return res.status(500).json({success: false});
    res.send(product);
});

router.post(`/`, uploadOptions.single('image'), async (req, res) => {
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(500).send('Invalid category.');

    const file = req.file;
    if (!file) return res.status(500).send('Invalid file.');

    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    const product = await new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    });

    if (!product) return res.status(500).send('The category can\'t be created.');
    await product.save();
    res.send(product);
});

router.put('/:id', uploadOptions.single('image'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(500).send('Invalid product id.');
    }

    const category = await Category.findById(req.body.category);
    if (!category) return res.status(500).send('Invalid category.');

    const product = await Product.findById(req.param.id);
    if (!product) return res.status(400).send('Invalid product');

    const file = req.file;
    let imagePath;

    if (file) {
        const fileName = req.file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagePath = `${basePath}${fileName}`
    } else {
        imagePath = product.image
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, {
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: imagePath,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    }, {new: true});

    if (!updatedProduct) return res.status(500).json({message: 'Product not found'});
    res.status(200).send(updatedProduct);
});

router.delete('/:id', (req, res) => {
    Product.findByIdAndRemove(req.params.id)
        .then((product) => {
            if (product) return res.status(200).json({success: true, message: 'Deleted Successfully.'});
            else return res.status(404).json({success: false, message: 'Product not Found.'});
        })
        .catch((err) => res.status(400).json({success: false, error: err}));
});

router.get(`/get/count`, async (req, res) => {
    const productCount = await Product.countDocuments((count) => count);

    if (!productCount) return res.status(500).json({success: false});
    res.send({count: productCount});
});

router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0;
    const product = await Product.find({isFeatured: true}).limit(+count);

    if (!product) return res.status(500).json({success: false});
    res.send({count: product});
});

router.put('/gallery-images/:id', uploadOptions.array('images', 10), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(500).send('Invalid product id.');
    }

    const files = req.files;
    let imagePath = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    
    if (files) {
        files.map((file) => {
            imagePath.push(`${basePath}${file.filename}`)
        });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {images: imagePath},
        {new: true}
    );

    if (!updatedProduct) return res.status(500).json({message: 'Product not found'});
    res.status(200).send(updatedProduct);
});

module.exports = router;
