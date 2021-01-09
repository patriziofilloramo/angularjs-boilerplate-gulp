var home = {
    template: `<div class="root">
    <div class="app" >
      <div><h1>{{$home.welcome}}</h1></div>
      <div ui-view>
    
      </div>
    </div>
  </div>
  `,
    controller: function HomeController() {
      console.log("Hi from HomeController");
      this.welcome = "Home page. AngularJs seems to work";
    },
    controllerAs: "$home",
  };
  
  angular.module("root").component("home", home);
  