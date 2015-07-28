module.exports = function (req, res, next) {
  
  // if no session redirect to '/login'
  if (!(req.session && req.session.login)) {
    return res.redirect('/login');
  }
  next();
};