var about = {
  template: `<div class="root">
  <div class="app" >
    <div><h1>{{$about.welcome}}</h1></div>
    <div ui-view>
  
    </div>
  </div>
</div>
`,
  controller: function AboutController() {
    console.log("Hi from AboutController");
    this.welcome = "You moved to the About page. Everything works. Bye!";
  },
  controllerAs: "$about",
};

angular.module("root").component("about", about);
