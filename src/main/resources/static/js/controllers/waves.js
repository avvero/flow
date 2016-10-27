function wavesController($scope, page, context, $stateParams) {
    $scope.waves = context.waves
    page.setTitle(context.instance.name)
}

wavesController.resolve = {
    context: function ($q, $http, $stateParams) {
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: 'data/context',
            headers: {'Content-Type': 'application/json;charset=UTF-8'}
        })
            .success(function (data) {
                deferred.resolve(data)
            })
            .error(function (data) {
                deferred.reject("error value");
            });

        return deferred.promise;
    }
}