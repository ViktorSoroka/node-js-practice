require.config({
  baseUrl: 'js/',
  paths: {
    jquery: 'libs/jquery',
    bootstrap: 'libs/bootstrap',
    underscore: 'libs/underscore',
    backbone: 'libs/backbone',
    text: 'libs/text',
  },
  shim: {
    bootstrap: {
      deps: ['jquery'],
    },
  },
});

require(['app/users-list'], function(UsersList) {
  new UsersList().render();
});
