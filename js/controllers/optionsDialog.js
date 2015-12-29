function optionsDialogController(options, $scope, $uibModalInstance) {
    $scope.options = options
    $scope.ok = function () {
        $uibModalInstance.close(options);
    }
}