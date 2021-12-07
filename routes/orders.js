const express = require('express');
const router = express.Router();

// models
const {Order} = require("../models/order");
const {OrderItem} = require('../models/orderItem');

router.get(`/`, async (req, res) => {
    const orderList = await Order.find().populate('user', 'name').sort({dateOrdered: -1});

    if (!orderList) return res.status(500).json({success: false});
    res.send(orderList);
});

router.get(`/:id`, async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name')
        .populate({
            path: 'orderItems', populate: {
                path: 'product', populate: 'category'
            }
        });

    if (!order) return res.status(500).json({success: false});
    res.send(order);
});

router.post(`/`, async (req, res) => {
    const orderItemIds = Promise.all(req.body.OrderItem.map(async (orderItem) => {
        const newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product,
        });
        await newOrderItem.save();
        return newOrderItem._id;
    }));
    const orderItemIdsResolved = await orderItemIds;

    const totalPrices = await Promise.all(orderItemIdsResolved.map(async (orderItemId) => {
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        return orderItem.product.price * orderItem.quantity
    }));
    const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

    const order = new Order({
        orderItems: orderItemIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user,
    });

    if (!order) return res.status(500).send('The order can\'t be created.');
    await order.save();
    res.send(order);
});

router.put('/:id', async (req, res) => {
    const order = await Order.findByIdAndUpdate(req.params.id, {status: req.body.status}, {new: true});

    if (!order) return res.status(500).json({message: 'Order not found'});
    res.status(200).send(order);
});

router.delete('/:id', (req, res) => {
    Order.findByIdAndRemove(req.params.id)
        .then(async (order) => {
            if (order) {
                order.orderItems.map(async (orderItem) => {
                    await OrderItem.findByIdAndRemove(orderItem);
                });
                return res.status(200).json({success: true, message: 'Deleted Successfully.'})
            } else {
                return res.status(404).json({success: false, message: 'Order not Found.'});
            }
        })
        .catch((err) => res.status(400).json({success: false, error: err}));
});

router.get('/get/totalSales', async (req, res) => {
    const totalSales = await Order.aggregate([
        {$group: {_id: null, totalSales: {$sum: 'totalPrice'}}},
    ]);

    if (!totalSales) return res.status(400).send('The order sales can\'t be generated');
    res.send({totalSales: totalSales.pop().totalSales});
});

router.get(`/get/count`, async (req, res) => {
    const orderCount = await Order.countDocuments((count) => count);

    if (!orderCount) return res.status(500).json({success: false});
    res.send({count: orderCount});
});

router.get(`/get/userorders/:userid`, async (req, res) => {
    const userOrderList = await Order.find({user: req.params.userid})
        .populate({
            path: 'orderItems', populate: {
                path: 'product', populate: 'category'
            }
        })
        .sort({dateOrdered: -1});

    if (!userOrderList) return res.status(500).json({success: false});
    res.send(userOrderList);
});

module.exports = router;
