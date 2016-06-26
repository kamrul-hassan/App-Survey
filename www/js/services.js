angular.module('starter.services', [])

.factory('UserFactory', function($http,config){  
    return {
        login: function(model) {  
            var header = { headers: {'Content-Type': 'application/json'}}         
            return $http.post(config.serviceUrl + 'Login/Index', model, header);
        },
        getCurrentUser: function() {
            var currentUser = localStorage.getItem("CurrentUser");
            if(currentUser == null)
                return null;
            else{
                return JSON.parse(currentUser);
            }
        }
    }
})
.factory('SurveyList', function($http,config){  
    return {
        get: function(model) {
            return $http.get(config.serviceUrl + 'SurveyApp/GetSurveyList');
        }
    }
})
.factory('SurveyFactory', function($http,config){    
    var services = {        
        get: function(id) {           
            return $http.get(config.serviceUrl + 'SurveyApp/Get?typeId='+id);
        },
        login: function(model){
            return $http.post(config.serviceUrl + 'Login/Index', model);
        },
        saveSurveys:function(model) {
            return $http.post(config.serviceUrl + 'SurveyApp/Save', model);
        },
        getSureveyType: function() {           
            return $http.get(config.serviceUrl + 'SurveyApp/GetSurveyTypes');
        },
        getSurveys: function(userId, typeId) {
            return $http.get(config.serviceUrl + 'SurveyApp/GetSurveyList?userId='+ userId+'&typeId='+typeId);
        }, 
        getSelectedType: function () {
            var type = localStorage.getItem('SelectedSurveyType');
            if (type == null)
                return null;
             return JSON.parse(type);       
        }
    }
    return services;  
});