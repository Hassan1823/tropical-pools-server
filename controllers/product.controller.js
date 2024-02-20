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

    const productExist = await productModel.findById(product);

    if (!productExist) {
      return next(new ErrorHandler("Product Not Found", 404));
    }

    const productRating = productExist.rating;

    if (rating > 5 || rating < 1) {
      return next(new ErrorHandler("Invalid Ratings", 400));
    }

    const existingReview = await reviewModel.findOne({
      user: user._id,
      product: product,
    });

    if (existingReview) {
      // ~ if review is already added then update the it
      existingReview.rating = rating;
      existingReview.review = review;

      await reviewModel.findByIdAndUpdate(
        { _id: existingReview._id },
        existingReview
      );

      //! Update the product's rating based on all reviews
      const allReviews = await reviewModel.find({ product: product });
      let totalRating = 0;
      allReviews.forEach((review) => {
        totalRating += review.rating;
      });
      productExist.rating = totalRating / allReviews.length;
      await productExist.save();

      await res.status(200).json({
        success: true,
        message: "Review Updated successfully",
        review: existingReview,
      });
    } else {
      const createReview = await reviewModel.create({
        rating,
        review,
        name: user.name,
        user: user._id,
        product,
      });

      user.reviews.push(createReview._id);

      await user.save();

      // Update the product's rating based on all reviews
      const allReviews = await reviewModel.find({ product: product });
      let totalRating = 0;
      allReviews.forEach((review) => {
        totalRating += review.rating;
      });
      productExist.rating = totalRating / allReviews.length;
      await productExist.save();

      res.status(200).json({
        success: true,
        message: "Review Added successfully",
        review: createReview,
      });
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// ! add to cart

export const addToCart = CatchAsyncError(async (req, res, next) => {
  try {
    const user = req.user;

    if (user) {
      const { product, quantity } = req.body;

      const productExist = await productModel.findById(product);

      if (!productExist) {
        return next(new ErrorHandler("Product Not Found", 404));
      }

      const productQuantity = productExist.quantity;

      if ((productExist.quantity ?? 0) < quantity) {
        return next(new ErrorHandler("You do not have enough quantity", 400));
      }
      const newProductQuantity = productQuantity - quantity;
      console.log("newProductQuantity :");
      console.log(newProductQuantity);

      productExist.quantity = newProductQuantity;
      await productExist.save();

      const data = { product, quantity, status: "pending" };

      user.products.push(data);
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

// ! product check out
export const checkOut = CatchAsyncError(async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return next(new ErrorHandler("Please Login To Access"));
    }

    const { checkoutId } = req.body;
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});
