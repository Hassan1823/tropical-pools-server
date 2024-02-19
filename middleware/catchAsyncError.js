export const CatchAsyncError = (theFun) => (req, res, next) => {
  Promise.resolve(theFun(req, res, next)).catch(next);
};
