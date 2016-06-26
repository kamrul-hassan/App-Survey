angular.module('starter.controllers', [])
    .controller('LoginCtrl', function ($scope, $state, $ionicPopup, UserFactory) {
        localStorage.setItem("EditItemId", 0);
        var currentUser = UserFactory.getCurrentUser();
        if (currentUser) {
            $state.go('tab.download');
        }
        $scope.login = function (user) {
            UserFactory.login(user).then(function (res) {
                if (res.data) {
                    localStorage.setItem("CurrentUser", JSON.stringify(res.data));
                    $state.go('tab.download');
                }
                else {
                    $ionicPopup.alert({
                        title: 'Login failed!',
                        template: 'Please check your credentials!'
                    });
                }
            })
        };
    })

    .controller('HomeCtrl', function ($scope, $state, $ionicPopup, SurveyFactory, DAL, UserFactory) {
        var user = UserFactory.getCurrentUser();
        if (user == null) {
            $state.go('login')
        }
        $scope.showSaveButton = false;
        var type = {};
        var itemId = parseInt(localStorage.getItem("EditItemId"));
        $scope.index = 0;
        $scope.surveyId = 0;
        if (itemId > 0) {
            $scope.surveyId = itemId
            DAL.getServeyById(itemId).then(function (res) {
                type.Id = res.TypeId;
                type.Name = res.TypeName;
                $scope.serveyQuestions = JSON.parse(res.Servey);
                PopulateModel();
            });
        }
        else {
            var SurveyType = localStorage.getItem('SelectedSurveyType');
            if (SurveyType == null || !user.Id) {
                $state.go('tab.download');
            }
            else {
                type = JSON.parse(SurveyType);
            }
            if (user == null)
                user = UserFactory.getCurrentUser();
            DAL.getQuestion(type.Id, user.Id).then(function (res) {
                $scope.serveyQuestions = JSON.parse(res);
                PopulateModel();
            });
        }
        function PopulateModel() {
            if (!$scope.serveyQuestions) {
                var myPopup = $ionicPopup.alert({
                    title: 'Survey Download',
                    template: 'Please download your servey!'
                });
                myPopup.then(function (res) {
                    $state.go('tab.download');
                });
            }
            else {

                $scope.increaseIndex = function () {
                    $scope.index = $scope.index + 1;
                }
                $scope.completeIndex = function () {
                    DAL.completeSurvey($scope.surveyId);
                    $state.go('tab.list');
                }
                $scope.decreaseIndex = function () {
                    $scope.index = $scope.index - 1;
                    if ($scope.index <= 0) $scope.showSaveButton = false;
                }
                $scope.isLastIndex = function () {
                    if ($scope.serveyQuestions.length - 1 == $scope.index) {
                        return true;
                    }
                    return false;
                }
                $scope.hasNext = function () {
                    if ($scope.serveyQuestions.length - 1 == $scope.index) return false;
                    return $scope.serveyQuestions.length > $scope.index;
                }
                $scope.hasPrevious = function () {
                    if ($scope.index == 0) return false;
                    return true;
                }
                $scope.save = function () {
                    if ($scope.surveyId > 0) {
                        DAL.updateSurvey($scope.surveyId, type.Id, type.Name, user.Id, 0, JSON.stringify($scope.serveyQuestions));
                    }
                    else {
                        DAL.saveServey(type.Id, type.Name, user.Id, 0, JSON.stringify($scope.serveyQuestions)).then(function (res) {
                            $scope.surveyId = res;
                        })
                    }
                }
            }
        }

    })

    .controller('ListCtrl', function ($scope, $state, $ionicPopup, SurveyFactory, DAL) {
        localStorage.setItem("EditItemId", 0);
        var currentUser = localStorage.getItem("CurrentUser");
        if (currentUser == null) {
            $state.go('login')
        }
        var user = JSON.parse(currentUser);
        var surveyType = localStorage.getItem('SelectedSurveyType');
        var type;
        if (surveyType == null || !user.Id) {
            $state.go('tab.download');
        }
        else {
            type = JSON.parse(surveyType);
        }
        $scope.isServer = { checked: false };
        DAL.getSurveyList(type.Id, user.Id).then(function (res) {
            $scope.surveyList = res;
        });
        $scope.isServerChange = function () {
            if ($scope.isServer.checked) {
                SurveyFactory.getSurveys(user.Id, type.Id).then(function (res) {
                    $scope.surveyList = res.data;
                });
            }
            else {
                DAL.getSurveyList(type.Id, user.Id).then(function (res) {
                    $scope.surveyList = res;
                });
            }
        };
        $scope.editSurvey = function (id) {
            localStorage.setItem("EditItemId", id);
            $state.go('tab.home');
        }
    })
    .controller('DownloadCtrl', function ($scope, $state, $ionicPopup, SurveyFactory, DAL, UserFactory) {
        localStorage.setItem("EditItemId", 0);
        var user = UserFactory.getCurrentUser();
        if (user == null) {
            $state.go('login')
        }
        SurveyFactory.getSureveyType().then(function (res) {
            $scope.items = res.data;
            localStorage.setItem('SureveyType', JSON.stringify(res.data))
        });
        $scope.addToPlaylist = function (data) {
            if (user == null)
                user = UserFactory.getCurrentUser();
            localStorage.setItem('SelectedSurveyType', JSON.stringify(data));
            DAL.deleteQuestions(data.Id, user.Id).then(function (respon) {
                SurveyFactory.get(data.Id).then(
                    function (res) {
                        DAL.saveQuestion(data.Id, user.Id, res).then(function (result) {
                            $state.go('tab.home');
                        }, function (error) {
                            alert('Error saving Questions to local!');
                        });
                    },
                    function (error) {
                        alert(error.statusText);
                    });
            }, function (error) {
                alert(error);
            });
        };

    })

    .controller('SyncCtrl', function ($scope, $state, $ionicPopup, $ionicLoading, SurveyFactory, DAL, UserFactory) {
        var user = UserFactory.getCurrentUser();
        if (user == null) {
            $state.go('login');
        }
        var surveyType = SurveyFactory.getSelectedType();
        if (surveyType == null) {
            $state.go('tab.download');
        }
        localStorage.setItem("EditItemId", 0);
        $scope.submitSurvey = function () {
            if (user == null) {
                user = UserFactory.getCurrentUser();
            }
            if (surveyType == null) {
                surveyType = SurveyFactory.getSelectedType();
            }
            $ionicLoading.show({
                template: '<p>Loading...</p><ion-spinner></ion-spinner>'
            });
            DAL.getComplateSurvey(user.Id, surveyType.Id).then(function (res) {
                SurveyFactory.saveSurveys(res).then(function (response) {
                    if (response.data) {
                        DAL.deleteServeys(user.Id, surveyType.Id).then(function (resp) {

                        }, function (reason) {
                            alert(reason);
                        });
                    }
                    $ionicLoading.hide();
                }, function (error) {
                    $ionicLoading.hide();
                    alert(error);
                });
            }, function (reason) {
                $ionicLoading.hide();
                alert(reason);
            });
        }
    });
