const myApp = angular
  .module('root', [
    'common',
    'templates'
  ]);


  
myApp.config(function($stateProvider) {

  var initState = {
    name: 'init',
    url: '/',
    redirectTo: () => 'home'
  }

  var homeState = {
    name: 'home',
    url: '/home',
    component: 'home',
  }

  var aboutState = {
    name: 'about',
    url: '/about',
    component: 'about'
  }

  $stateProvider.state(initState);
  $stateProvider.state(homeState);
  $stateProvider.state(aboutState);
});