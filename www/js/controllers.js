angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, $ionicHistory, $window, $ionicLoading) {
  $ionicHistory.clearHistory();

  var ref = firebase.database().ref('appointments');

  var uid = $window.sessionStorage.getItem('uid');

  $ionicLoading.show({
    template: '<ion-spinner icon="lines"></ion-spinner><br>Loading data...'
  });

  ref.orderByChild("student_id").equalTo(uid).on('value', function(snap){
    $scope.appointments = snap.val();
    $scope.$apply();
    $ionicLoading.hide();
  });
})

.controller('ChatsCtrl', function($scope, $ionicLoading, $firebaseArray) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  var lecRef = firebase.database().ref('lecturers');

  $ionicLoading.show({
    template: '<ion-spinner icon="lines"></ion-spinner><br>Loading data...'
  });

  // lecRef.once('value', function(snap){
  //   $scope.lecturers = snap.val();
  //   console.log($scope.lecturers);
  //   $scope.$apply();
  //   $ionicLoading.hide();
  // });

  $scope.lecturers = $firebaseArray(lecRef);

  $ionicLoading.hide();

  $scope.searchText = "";
})

.controller('ChatDetailCtrl', function($scope, $stateParams, $ionicLoading, $window, $location) {
  var uid = $stateParams.lecturerId;
  var ref = firebase.database().ref('lecturers');

  $scope.formData = {};

  $ionicLoading.show({
    template: '<ion-spinner icon="lines"></ion-spinner><br>Loading data...'
  });

  ref.orderByChild("uid").equalTo(uid).on('value', function(snap){
    if(snap.val().length == 1){
      $scope.lecturer = snap.val()[uid];
    }else{
      $scope.lecturer = snap.val()[uid];
    }

    console.log(snap.val());
    console.log($scope.lecturer);
    // $scope.$apply();
    $ionicLoading.hide();
  });

  $scope.requestAppointment = function(){
    console.log('request method called');
    console.log($scope.formData.apptDate);
    console.log($scope.formData.message);

    if($scope.formData.apptDate == undefined || $scope.formData.apptDate == ""){

    }else{
      console.log('else');
      console.log('lecturer', $scope.lecturer);
      var app_ref = firebase.database().ref('appointments').push();
      app_ref.set({
        lecturer: $scope.lecturer,
        date: new Date($scope.formData.apptDate).toJSON().slice(0,19),
        message: $scope.formData.message,
        student_id: $window.sessionStorage.getItem('uid'),
        student: $window.sessionStorage.getItem('uid'), //TODO: set student object
        status: false
      });

      $location.path('/tab/dash');
    }
  };
})

.controller('AccountCtrl', function($scope, $location, $ionicPopup, $window, $firebaseObject) {

  $scope.displayName = $window.sessionStorage.getItem('name');
  $scope.role = $window.sessionStorage.getItem('role');
  $scope.uid = $window.sessionStorage.getItem('uid');

  var lecturers_ref = firebase.database().ref('lecturers');

  $scope.settings = {};

  lecturers_ref.child($scope.uid).child('available').on('value', function(snap){
    $scope.settings.availability = snap.val();
  });

  $scope.toggleAvailability = function(){
    console.log($scope.settings.availability);
    lecturers_ref.child($scope.uid).child('available').set($scope.settings.availability);
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

          var role;
          var name;

          var ref = firebase.database().ref('users/'+user.uid);
          ref.once('value', function(snap){
              role = snap.val().role;
              name = snap.val().name;
              console.log('role',role,snap.val());
            if(user.emailVerified && role == "student"){
              $window.sessionStorage.setItem('uid', user.uid);
              $window.sessionStorage.setItem('name', user.displayName);
              $window.sessionStorage.setItem('emailVerified', user.emailVerified);
              $window.sessionStorage.setItem('role', role);
              goToDashboard();
            }else if(role == "lecturer"){
              $window.sessionStorage.setItem('uid', user.uid);
              $window.sessionStorage.setItem('name', name);
              $window.sessionStorage.setItem('emailVerified', user.emailVerified);
              $window.sessionStorage.setItem('role', role);
              goToDashboard();
            }else{
              $location.path('/verify');
              $scope.$apply();
            }

          });


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

        //add user object
        var user_ref = firebase.database().ref('users/'+user.uid);
        user_ref.push({
          name: $scope.name,
          role: 'student'
        })

      }).catch(function(err){
        console.error(err);
      })
    }
  };
});
