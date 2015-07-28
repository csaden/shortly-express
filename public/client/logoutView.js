Shortly.logoutView = Backbone.View.extend({

  template: Templates['logout'],

  render: function() {
    this.$el.html( this.template() );
    return this;
  }
});