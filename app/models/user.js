var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  allSessions: function(){
    return this.hasMany(Session);
  }
});

module.exports = User;

////////////////////////////////////////
// Advanced Version of the User Model
////////////////////////////////////////
// * when using this version of the user model
// * need to refactor the post routes for '/login' and '/signup'
// * to use user.comparePasswords and user.hashPassword functions

// var User = db.Model.extend({
//   tableName: 'users',
//   hasTimestamps: true,
//   intialize: function() {
//     this.on('creating', this.hashPassword);
//   },
//   comparePasswords: function(attemptedPassword, callback) {
//     bcrypt.compare(attemptedPassword, null, null, function(err, isMatch) {
//       callback(isMatch);
//     });
//   },
//   hashPassword: function() {
//     var cipher = Promise.promisify(bcrypt.hash);
//     // return a promise - bookshelf will wait for the promise
//     // to resolve before completing the create action
//     return cipher(this.get('password'), null, null)
//      .bind(this)
//      .then(function(hash) {
//       this.set('password', hash);
//      });
//   }
// });