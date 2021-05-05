const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function isValidCreateOrder(req,res,next) {
    const requiredFields = ["deliverTo", "mobileNumber", "dishes"];

    const { data: { deliverTo, mobileNumber, dishes } = {}} = req.body;

    for (let field of requiredFields) {
        if(!req.body.data[field]) {
            next({
                status: 400,
                message: `Dish must include a ${field}`,
            })
            return;
        }
    }
    
    if (!deliverTo.length) {
        next({
            status: 400,
            message: `Delivery address required.`,
        })
    }

    if (!mobileNumber.length) {
        next({
            status: 400,
            message: `Mobile number required.`,
        })
    }

    if(!Array.isArray(dishes) || !dishes.length){
        next({
            status: 400,
            message: `Dishes must include a dish`,
        })
    }

    for(let dish of dishes){
        const index = dishes.findIndex((test) => test.id === dish.id);
        const { quantity } = dish;

        if(!quantity || !(typeof(quantity)==="number") || quantity<1){
            next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`,
            })
        }
    }
    res.locals.newOrder = req.body.data;
    next();
}

function isValidOrderUpdate(req,res,next) {
    const requiredFields = ["deliverTo", "mobileNumber", "dishes"];
    const {orderId} = req.params;

    const { data: { deliverTo, mobileNumber, dishes, status, id } = {}} = req.body;

    for (let field of requiredFields) {
        if(!req.body.data[field]) {
            next({
                status: 400,
                message: `Dish must include a ${field}`,
            })
            return;
        };
    }

    if (id && orderId !== id){
        next({
            status: 400,
            message: `Route id: ${orderId} does not match order id: ${id}.`
        });
    }
    
    if (!deliverTo.length) {
        next({
            status: 400,
            message: `Delivery address required.`,
        });
    }

    if (!mobileNumber.length) {
        next({
            status: 400,
            message: `Mobile number required.`,
        });
    }

    if(!Array.isArray(dishes) || !dishes.length){
        next({
            status: 400,
            message: `Dishes must include a dish`,
        });
    }
    
    if(!status || !status.length || !(status==="pending" || status==="preparing" || status==="out-for-delivery" || status==="delivered")) {
        next({
            status: 400,
            message: "Order must have a valid status of pending, preparing, out-for-delivery, or delivered."
        });
    }



    if(status==="delivered"){
        next({
            status: 400,
            message: "A delivered order cannot be changed."
        });
    }

    for(let dish of dishes){
        const index = dishes.findIndex((test) => test.id === dish.id);
        const { quantity } = dish;

        if(!quantity || !(typeof(quantity)==="number") || quantity<1){
            next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`,
            });
        }
    }

    res.locals.newOrder = req.body.data;
    next();
}

function orderExists(req,res,next) {
    const {orderId} = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);

    if (!foundOrder) {
        next({
            status: 404,
            message: `Order "${orderId}" cannot be found.`,
        })
    } else {
       res.locals.order = foundOrder;
       next();
    }
}

function isValidDelete(req,res,next) {
    const {status} = res.locals.order;
    if (status !== "pending"){
        next({
            status: 400,
            message: "Only pending orders can be deleted."
        })
    } else {
     next();
    }
}

function list(req,res,next) {
    res.json({data: orders});
}

function read(req,res,next) {
   res.json({data: res.locals.order})
}

function create(req,res,next) {
    const { deliverTo, mobileNumber, dishes} = res.locals.newOrder;

    const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes,
    }
    
    orders.push(newOrder);
    res.status(201).json({data: newOrder});
}

function update(req,res, next) {
const originalOrder = orders.find((order) => order.id === res.locals.order.id)
const { deliverTo, mobileNumber, dishes, status} = res.locals.newOrder;

originalOrder.deliverTo = deliverTo;
originalOrder.mobileNumber = mobileNumber;
originalOrder.dishes = dishes;
originalOrder.status = status;

res.status(200).json({data: originalOrder});
}

function destroy(req,res,next) {
    const index = orders.findIndex((order) => order.id === Number(res.locals.order.id));

    if (index > -1) {
      orders.splice(index, 1);
    }

    res.sendStatus(204);
}


module.exports = {
    list,
    read: [orderExists, read],
    create: [isValidCreateOrder, create],
    update: [orderExists, isValidOrderUpdate, update],
    delete: [orderExists, isValidDelete, destroy],
}