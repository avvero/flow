angular.module('flow').directive('logChart', ['$timeout', 'utils', function ($timeout, utils) {
    return {
        scope: true,
        //restrict: 'CA',
        link: function($scope, element, attrs) {
            $scope.$watch(attrs.logChart,function(value){
                $scope.length = value
            }, true);

            /**
             * Chart
             *
             */
            $scope.CHART_CAPACITY = 200
            $scope.CHART_UPDATE_INTERVAL = 1000
            $scope.CHART_SKIP_ZERO_TICKS = false
            $scope.chartOptions = {
                animation: false,
                datasetStrokeWidth: 0.5,
                pointDot: false,
                showScale: true,
                showTooltips: false,
                scaleShowLabels: true,
                bezierCurve : true
            };
            $scope.chartSeries = ['All'];
            $scope.chartLabels = [0];
            $scope.chartTotal = [0];
            $scope.chartData = [$scope.chartTotal];

            $scope.t = 0;
            $scope.prevVal = 0;
            $scope.updateChart = function() {
                $timeout(function () {
                    if ($scope.t == 0 && $scope.length > 0) {
                        utils.pushToArray($scope.chartTotal, $scope.length, $scope.CHART_CAPACITY)
                        utils.pushToArray($scope.chartLabels, '', $scope.CHART_CAPACITY)
                    } else {
                        var newVal = $scope.length - $scope.t
                        if ($scope.CHART_SKIP_ZERO_TICKS && $scope.prevVal == 0 && newVal == 0) {
                            // skip zero ticks
                            return;
                        } else {
                            utils.pushToArray($scope.chartTotal, newVal, $scope.CHART_CAPACITY)
                            utils.pushToArray($scope.chartLabels, '', $scope.CHART_CAPACITY)
                            //console.warn(newVal)
                            $scope.prevVal = newVal
                        }
                    }
                    $scope.t = $scope.length
                    $scope.updateChart()
                }, $scope.CHART_UPDATE_INTERVAL);
            }
            $scope.updateChart()
        },
        templateUrl: 'views/logChart.html'
    };
}])