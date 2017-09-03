if(Cluster.MALIBUN_CLUSTER=='simplecluster') {
    var os = Npm.require('os');

    var workerMapping = {};
    var workers = null;

    var _getWorkersCount = function () {
        var workersCount = process.env['CLUSTER_WORKERS_COUNT'];
        if (("" + workersCount).toLowerCase() === "auto") {
            workersCount = os.cpus().length;
            // We don't need to start a worker in this case
            if (workersCount == 1) {
                workersCount = 0;
            }
        }

        // Make sure it's a number
        workersCount = parseInt(workersCount) || 0;

        return workersCount;
    };

    WebApp.onListening(function () {
        var workersCount = _getWorkersCount();
        workers = new WorkerPool(workersCount);
    });
}

