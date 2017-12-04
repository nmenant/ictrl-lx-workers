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
  if (DEBUG) {
    logger.info(WorkerName + " - onStart()");
  }
  success();
};

my_interface.prototype.onGet = function (restOperation) {
  var uriValue = restOperation.getUri();
  var serviceName = uriValue.path.toString().split("/")[3];
  athis = this;

  if (DEBUG) {
    logger.info("DEBUG: " + WorkerName + " - onGet - uri is " + serviceName);
  }
  aThis.completeRestOperation(restOperation);
};

my_interface.prototype.onPost = function(restOperation) {
  var newState = restOperation.getBody();
  var templateName = newState.template;
  var connectorName = newState.clustername;
  var serviceName = newState.name;
  var varsList = newState["app-data"];
  var tablesList = newState["servers-data"];

  if (DEBUG) {
    logger.info(WorkerName + " - onPost()");
  }

  if ( templateName ) {
    athis = this;

    if (DEBUG) {
      logger.info(WorkerName + " - onPost() - calling IPAM worker with name: " + serviceName + " and subnet: " + subnet);
    }
    var IPAMQuery = new AppInterfaceIPAMFunc(serviceName, subnet);
    IPAMQuery.GetVSIP()
      .then (function(myIP) {
        logger.info("DEBUG: " + WorkerName + " - onPost, GetVSIP - my retrieved IP is: " + myIP);
        athis.completeRestOperation(restOperation);
      })
      .catch (function (err) {
        logger.info("DEBUG: " + WorkerName + " - onPost, IPAMQuery - something went wrong: " + JSON.stringify(err));
        responseBody = "{ \"name\": \"" + serviceName + "\", \"value\": \"" + err + "\"}";
        restOperation.setBody(responseBody);
        athis.completeRestOperation(restOperation);
      });
  }
};

my_interface.prototype.onPut = function(restOperation) {
  var newState = restOperation.getBody();

  if (DEBUG) {
    logger.info(WorkerName + " - onPut()");
  }
  this.completeRestOperation(restOperation);
};

my_interface.prototype.onPatch = function(restOperation) {
  var newState = restOperation.getBody();

  if (DEBUG) {
    logger.info(WorkerName + " - onPatch()");
  }
  this.completeRestOperation(restOperation);
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
