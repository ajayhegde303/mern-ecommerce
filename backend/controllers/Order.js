const Order = require("../models/Order");
const Product = require("../models/Product");

exports.create = async (req, res) => {
    try {
        const created = new Order(req.body);
        await created.save();

        // 🔹 Reduce stock for each product in the order
        for (const item of req.body.item) {
            const productId = item.product._id || item.product;
            const quantity = item.quantity || 1;

            await Product.findByIdAndUpdate(
                productId,
                { $inc: { stockQuantity: -quantity } }
            );
        }

        res.status(201).json(created);
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ message: "Error creating an order, please try again later" });
    }
}

exports.getByUserId=async(req,res)=>{
    try {
        const {id}=req.params
        const results=await Order.find({user:id})
        res.status(200).json(results)
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:'Error fetching orders, please trying again later'})
    }
}

exports.getAll = async (req, res) => {
    try {
        let skip=0
        let limit=0

        if(req.query.page && req.query.limit){
            const pageSize=req.query.limit
            const page=req.query.page
            skip=pageSize*(page-1)
            limit=pageSize
        }

        const totalDocs=await Order.find({}).countDocuments().exec()
        const results=await Order.find({}).skip(skip).limit(limit).exec()

        res.header("X-Total-Count",totalDocs)
        res.status(200).json(results)

    } catch (error) {
        console.log(error);
        res.status(500).json({message:'Error fetching orders, please try again later'})
    }
};

exports.updateById=async(req,res)=>{
    try {
        const {id}=req.params
        const updated=await Order.findByIdAndUpdate(id,req.body,{new:true})
        res.status(200).json(updated)
    } catch (error) {
        console.log(error);
        res.status(500).json({message:'Error updating order, please try again later'})
    }
}
