/**
 * This iControl LX extension will create a declarative REST my_interface
 * to deploy services. In this example, we will use an IPAM solution called
 * infoblox to retrieve the service external IP
*/

var logger = require('f5-logger').getInstance();
var AppInterfaceIWFFunc = require("../utils/my-app-interface-iwf-utils.js");
var AppInterfaceIPAMFunc = require("../utils/my-app-interface-ipam-utils.js");
var DEBUG = true;
var WorkerName = "my-app-interface";
var subnet = "10.100.60.0/24";

function my_interface() {
}

//we define our worker path
my_interface.prototype.WORKER_URI_PATH = "/shared/workers/my-app-interface";

my_interface.prototype.isPublic = true;

// Enable worker URL routing as passthrough.
my_interface.prototype.isPassThrough = true;

//triggered when our worker is loaded
my_interface.prototype.onStart = function (success) {
  success();
};

/*
* Handle GET requests
*/my_interface.prototype.onGet = function (restOperation) {
  var uriValue = restOperation.getUri();
  var serviceName = uriValue.path.toString().split("/")[3];
  athis = this;

  if (DEBUG) {
    logger.info("DEBUG: " + WorkerName + " - onGet - uri is " + serviceName);
  }
  athis.completeRestOperation(restOperation);
};

/*
* Handle POSTrequests
*/
my_interface.prototype.onPost = function(restOperation) {
  var newState = restOperation.getBody();
  var templateName = newState.template;
  var connectorName = newState.clustername;
  var serviceName = newState.name;
  var varsList = newState["app-data"];
  var tablesList = newState["servers-data"];
  var vsIP;
  var connectorID;

  if (DEBUG) {
    logger.info(WorkerName + " - onPost()");
  }

  if ( templateName ) {
    athis = this;

    if (DEBUG) {
      logger.info(WorkerName + " - onPost() - calling IPAM worker with name: " + serviceName + " and subnet: " + subnet);
    }
    var IPAMQuery = new AppInterfaceIPAMFunc(serviceName, subnet);
    var IWFInterface = new AppInterfaceIWFFunc();

    IWFInterface.GetConnectorID(connectorName)
      .then (function(myConnectorId) {
        if (DEBUG) {
          logger.info("DEBUG: " + WorkerName + " - onPost, GetConnectorID - the connector ID is: " + myConnectorId);
        }
        connectorId = myConnectorId;
        return IPAMQuery.GetVSIP();
      })
      .then (function (myIP) {

        if (DEBUG) {
          logger.info("DEBUG: " + WorkerName + " - onPost, GetVSIP - my retrieved IP is: " + myIP);
        }
        vsIP = myIP;
        return IWFInterface.DeployService(serviceName, templateName, connectorId, vsIP, varsList, tablesList);
      })
      .then (function() {
        athis.completeRestOperation(restOperation);
      })
      .catch (function (err) {
        logger.info("DEBUG: " + WorkerName + " - onPost, IPAMQuery - something went wrong: " + JSON.stringify(err));
        responseBody = "{ \"name\": \"" + serviceName + "\", \"value\": \"" + err + "\"}";
        restOperation.setBody(responseBody);
        restOperation.setStatusCode(400);
        athis.completeRestOperation(restOperation);
      });
  } else {
    this.completeRestOperation(restOperation);
  }
};

/*
* Handle PUT requests
*/
my_interface.prototype.onPut = function(restOperation) {
  var newState = restOperation.getBody();

  if (DEBUG) {
    logger.info(WorkerName + " - onPut()");
  }
  this.completeRestOperation(restOperation);
};

/*
* Handle PATCH requests
*/
my_interface.prototype.onPatch = function(restOperation) {
  var newState = restOperation.getBody();

  if (DEBUG) {
    logger.info(WorkerName + " - onPatch()");
  }
  this.completeRestOperation(restOperation);
};

/*
* Handle DELETE requests
*/
my_interface.prototype.onDelete = function(restOperation) {
  var uriValue = restOperation.getUri();
  var serviceName = uriValue.path.toString().split("/")[4];
  aThis = this;

  if (DEBUG) {
    logger.info(WorkerName + " - onDelete()");
  }
  if (DEBUG) {
    logger.info("DEBUG: " + WorkerName + " - onDelete - service is: " + serviceName);
  }

  var IPAMQuery = new AppInterfaceIPAMFunc(serviceName, subnet);
  var IWFInterface = new AppInterfaceIWFFunc();

  IWFInterface.DeleteService(serviceName)
    .then (function () {
      if (DEBUG) {
        logger.info("DEBUG: " + WorkerName + " - onDelete - service has been removed from iWF");
      }
      return IPAMQuery.ReleaseIP(serviceName);
    })
    .then (function () {
      if (DEBUG) {
        logger.info("DEBUG: " + WorkerName + " - onDelete - released IP from IPAM");
      }
      athis.completeRestOperation(restOperation);
    })
    .catch (function (err) {
      logger.info("DEBUG: " + WorkerName + " - onDelete, something went wrong: " + JSON.stringify(err));
      responseBody = "{ \"name\": \"" + serviceName + "\", \"value\": \"" + err + "\"}";
      restOperation.setBody(responseBody);
      restOperation.setStatusCode(400);
      athis.completeRestOperation(restOperation);
    });
};
/**
* handle /example HTTP request
*/
my_interface.prototype.getExampleState = function () {
  return {
        "name": "my-app-name",
        "template": "f5-http-lb",
        "clustername": "BIG-IP-student",
        "app-data": [
                    {
                        "name": "pool__port",
                        "value": "80"
                    }
        ],
        "servers-data": [{
            "name": "pool__Members",
            "columns": [
                "IPAddress",
                "State"
            ],
            "rows": [
                [
                    "10.1.10.10",
                    "enabled"
                ], [
                    "10.1.10.11",
                    "enabled"
                ]
            ]
        }]
  };
};

module.exports = my_interface;
