module.exports = () => {

  return (error, req, res, next) => {
    if (error.status > 499) {
      console.error(error);
    }
    res.status(error.status || 500);
    res.json({ message: error.message });
  };

};
