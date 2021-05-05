const { resolve } = require("path");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req,res,next) {
    res.json({data: dishes});
}

function isValidDish(req,res,next) {
    const requiredFields = ["name", "description", "price", "image_url"];
    const {dishId} = req.params;

    for (let field of requiredFields) {
        if(!req.body.data[field]) {
            next({
                status: 400,
                message: `Dish must include a ${field}`,
            })
            return;
        }
    }
    
    if (req.body.data.price < 0 || typeof(req.body.data.price) !== 'number') {
        next({
            status: 400,
            message: `Field "price" must be a number greater than zero`,
        })
    }

    if(dishId && req.body.data.id && req.body.data.id!==dishId){
        next({
            status: 400,
            message: `${req.body.data.id} does not match route id`,
        })
    }

    res.locals.newDish = req.body.data;
    next();
}

function dishExists(req,res,next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);

    if(!foundDish) {
      next({
          status: 404,
          message: "Dish not found",
      })
    } else {
     res.locals.foundDish = foundDish;
     next();
    }
}

function create(req,res,next) {
    const { name, price, description, image_url } = res.locals.newDish;

    const newDish = {
    id: nextId(),
    name,
    price,
    description,
    image_url,
    }
    
    dishes.push(newDish);
    res.status(201).json({data: newDish});
}

function read(req,res,next){       
    const {dishId} = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    res.json({data: foundDish});
}

function update(req,res,next){
   const foundDish = dishes.find((dish) => dish.id === res.locals.foundDish.id);
   const { name, price, description, image_url } = res.locals.newDish;

   foundDish.name = name;
   foundDish.description = description;
   foundDish.price = price;
   foundDish.image_url = image_url;


   res.json({data: foundDish});   
}

module.exports = {
    list,
    create: [isValidDish, create],
    read: [dishExists, read],
    update: [dishExists, isValidDish, update],
}