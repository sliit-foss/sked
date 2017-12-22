angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, $ionicHistory) {
  $ionicHistory.clearHistory();
})

.controller('ChatsCtrl', function($scope) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  var lecRef = firebase.database().ref('lecturers');

  lecRef.once('value', function(snap){
    $scope.lecturers = snap.val();
    console.log($scope.lecturers);
    $scope.$apply();
  });

  $scope.searchText = "";
})

.controller('ChatDetailCtrl', function($scope, $stateParams, $ionicLoading) {
  var uid = $stateParams.lecturerId
  var ref = firebase.database().ref('lecturers');

  $ionicLoading.show({
    template: '<ion-spinner icon="lines"></ion-spinner><br>Loading data...'
  });

  ref.orderByChild("uid").equalTo(uid).on('value', function(snap){
    if(snap.val().length == 1){
      $scope.lecturer = snap.val()[0];
    }else{
      $scope.lecturer = snap.val()[1];
    }

    console.log(snap.val());
    console.log($scope.lecturer);
    $scope.$apply();
    $ionicLoading.hide();
  })
})

.controller('AccountCtrl', function($scope, $location, $ionicPopup, $window) {
  $scope.settings = {
    enableFriends: true
  };

  $scope.logout = function(){
    var confirmPopup = $ionicPopup.confirm({
      title: 'Logout',
      template:'Are you sure you want to logout?'
    });

    confirmPopup.then(function(res){
      if(res){
        firebase.auth().signOut().then(function(){
          $window.sessionStorage.removeItem('uid');
          $window.sessionStorage.removeItem('displayName');
          $window.sessionStorage.removeItem('emailVerified');
          $location.path('/#/login');
          $scope.$apply();
        }).catch(function(err){
          console.error(err);
        })
      }
    })
  }
})

.controller('LoginCtrl', function($scope, $location, $ionicLoading, $window, $ionicHistory){

  $ionicHistory.clearHistory();

  $scope.isLoading = true;

  var user = firebase.auth.currentUser;

  $ionicLoading.show({
    template: '<ion-spinner icon="lines"></ion-spinner><br>Loading application data...'
  });

  if(user){
    $ionicLoading.hide();
    $window.sessionStorage.setItem('uid', user.uid);
    $window.sessionStorage.setItem('name', user.displayName);
    $window.sessionStorage.setItem('emailVerified', user.emailVerified);
    goToDashboard();
  }else{
    $scope.isLoading = false;
    $ionicLoading.hide();
  }

  $scope.login = function(){
    console.log('login called');
    //validation
    if($scope.email == "" || $scope.email == undefined){
      $scope.isInvalidEmail = true;
      $scope.isInvalidPassword = false;
    }else if ($scope.password == "" || $scope.password == undefined){
      $scope.isInvalidPassword = true;
      $scope.isInvalidEmail = false;
    }else{
      $scope.isInvalidEmail = false;
      $scope.isInvalidPassword = false;

      $ionicLoading.show({
        template: '<ion-spinner icon="lines"></ion-spinner><br>Logging in ...'
      });

      firebase.auth().signInWithEmailAndPassword($scope.email, $scope.password)
        .then(function(user){
          $ionicLoading.hide();
          if(user.emailVerified){
            $window.sessionStorage.setItem('uid', user.uid);
            $window.sessionStorage.setItem('name', user.displayName);
            $window.sessionStorage.setItem('emailVerified', user.emailVerified);
            goToDashboard();
          }else{
            $location.path('/verify');
            $scope.$apply();
          }
        }).catch(function(err){
          console.error(err);
        })
    }
  };

  function goToDashboard(){
    console.log('goto dashboard called');
    $location.path('/tab/dash');
    $scope.$apply();
  }
})

.controller('SignUpCtrl', function($scope, $location){

  $scope.isInvalidName = false;
  $scope.isInvalidEmail = false;
  $scope.isInvalidPassword = false;
  $scope.isInvalidConfirmPassword = false;

  $scope.year = "1";

  $scope.signUp = function(){

    console.log('sign up called');

    $scope.isInvalidName = false;
    $scope.isInvalidEmail = false;
    $scope.isInvalidPassword = false;
    $scope.isInvalidConfirmPassword = false;

    if($scope.name == undefined || $scope.name == "") {
      $scope.isInvalidName = true;
    }else if($scope.email == undefined || $scope.email == ""){
      $scope.isInvalidEmail = true;
    }else if($scope.password == undefined || $scope.password == ""){
      $scope.isInvalidPassword = true;
    }else if($scope.passwordConfirm == undefined || $scope.passwordConfirm == ""){
      $scope.isInvalidConfirmPassword = true;
    }else if ($scope.password != $scope.passwordConfirm){
      $scope.isInvalidPassword = true;
      $scope.isInvalidConfirmPassword = true;
    }else{
      firebase.auth().createUserWithEmailAndPassword($scope.email, $scope.passwordConfirm).then(function(user){
        user.updateProfile({
          displayName: $scope.name
        }).then(function(){
            user.sendEmailVerification().then(function(){
              console.log('email verification sent');
              $location.path('/verify');
              $scope.$apply();
            }).catch(function(err){
              console.error(err);
            })
        }).catch(function(err){
          console.error(err);
        })
      }).catch(function(err){
        console.error(err);
      })
    }
  };
});
