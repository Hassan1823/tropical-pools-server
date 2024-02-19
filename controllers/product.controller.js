import { CatchAsyncError } from "../middleware/catchAsyncError.js";
import productModel from "../models/product.model.js";
import reviewModel from "../models/review.model.js";
import userModel from "../models/user.model.js";
import ErrorHandler from "../utils/errorHandler.js";

// ! create product
export const createProduct = CatchAsyncError(async (req, res, next) => {
  try {
    const user = req.user;

    if (user) {
      if (user.role !== "admin") {
        return next(
          new ErrorHandler("You are not authorized to perform this action", 400)
        );
      }

      const { image, title, description, price, quantity } = req.body;

      const createProduct = await productModel.create({
        image,
        title,
        description,
        price,
        quantity,
      });

      res.status(200).json({
        success: true,
        product: createProduct,
      });
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// ! delete products
export const deleteProduct = CatchAsyncError(async (req, res, next) => {
  try {
    const user = req.user;

    if (user.role !== "admin") {
      return next(
        new ErrorHandler("You are not authorized to perform this action", 400)
      );
    }

    const productId = req.body.productId;

    const product = await productModel.findById(productId);

    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    // Remove the product and its reviews from all users
    await userModel.updateMany(
      { products: { $elemMatch: { _id: productId } } },
      { $pull: { products: { _id: productId } } }
    );
    await userModel.updateMany(
      { reviews: { $elemMatch: { product: productId } } },
      { $pull: { reviews: { product: productId } } }
    );
    await reviewModel.deleteMany({ product: productId });

    // Remove the product's reviews from the current user
    user.products = user.products.filter((p) => p.toString() !== productId);
    await user.save();

    // Delete the product
    await productModel.findByIdAndDelete(productId);

    res.status(200).json({
      success: true,
      message: "Product and associated reviews deleted successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// ! add product review
export const productReview = CatchAsyncError(async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return next(new ErrorHandler("Please Login To Access", 400));
    }

    const { rating, review, product } = req.body;

    const existingReview = await reviewModel.findOne({
      user: user._id,
      product: product,
    });

    if (existingReview) {
      return next(
        new ErrorHandler("You have already reviewed this product", 400)
      );
    }

    const productExist = await productModel.findById(product);

    if (!productExist) {
      return next(new ErrorHandler("Product Not Found", 404));
    }

    const createReview = await reviewModel.create({
      rating,
      review,
      name: user.name,
      user: user._id,
      product,
    });

    user.reviews.push(createReview._id);

    await user.save();

    res.status(200).json({
      success: true,
      review: createReview,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// ! add to cart

export const addToCart = CatchAsyncError(async (req, res, next) => {
  try {
    const user = req.user;

    if (user) {
      const { product } = req.body;

      user.products.push(product);

      await user.save();

      res.status(200).json({
        success: true,
        message: "Product Added To Cart",
      });
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});
