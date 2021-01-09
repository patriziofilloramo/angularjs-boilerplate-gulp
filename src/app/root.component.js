var root = {
  templateUrl: "./root.html",
  controller: function RootController() {
    // testing babel! Check console log
    var hello = () => 'hello Babel!';
    hello();
  },
  controllerAs: '$root'
};

angular.module("root").component("root", root);
