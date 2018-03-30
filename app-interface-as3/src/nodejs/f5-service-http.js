/**
* This iControl LX extension will create a declarative REST my_interface
* to deploy services. In this example, we will use an IPAM solution called
* infoblox to retrieve the service external IP
*/

var logger = require('f5-logger').getInstance();
var AppInterfaceIPAMFunc = require("../utils/my-app-interface-ipam-utils.js");
var serviceHTTPAS3Func = require("../utils/service-http-as3-utils.js");
var DEBUG = true;
var WorkerName = "f5_service_http";

// specify whether you want infoblox to handle the VS IP or if it will be provided by the consumer
var useInfoblox = false;
// subnet is used with infoblox to specify in which subnet you need an IP
var subnet = "10.100.60.0/24";


function f5_service_http() {
}

//we define our worker path
f5_service_http.prototype.WORKER_URI_PATH = "/shared/workers/my-service-catalog/f5-service-http";

f5_service_http.prototype.isPublic = true;

// Enable worker URL routing as passthrough.
f5_service_http.prototype.isPassThrough = true;

//triggered when our worker is loaded
f5_service_http.prototype.onStart = function (success) {
  success();
};

/*
* Handle GET requests
*/
f5_service_http.prototype.onGet = function (restOperation) {

};

/*
* Handle POSTrequests
*/
f5_service_http.prototype.onPost = function(restOperation) {
  var newState = restOperation.getBody();
  var BIGIPIP = newState.clustername;
  var serviceName = newState.name;
  var tenantName = newState.tenant;
  var poolData = newState["app-data"];
  var serviceIP;


  if (DEBUG) {
    logger.info(WorkerName + " - onPost()");
  }

  athis = this;

  if (DEBUG) {
    logger.info("DEBUG: " + WorkerName + " - onPost() - calling HTTP app interface worker with name: " + serviceName);
  }

  var serviceHTTPAS3Interface = new serviceHTTPAS3Func();

  if (useInfoblox) {
    var IPAMQuery = new AppInterfaceIPAMFunc(serviceName, subnet);
  } else {
    serviceIP = newState["service-ip"];

    if (DEBUG) {
      logger.info("DEBUG: " + WorkerName + " - onPost, the service IP is: " + serviceIP);
    }
    serviceHTTPAS3Interface.DeployService(BIGIPIP, serviceName, tenantName, poolData, serviceIP)
    .then (function() {
      athis.completeRestOperation(restOperation);
    })
    .catch (function (err) {
      logger.info("DEBUG: " + WorkerName + " - onPost, CreateService - something went wrong: " + JSON.stringify(err));
      responseBody = "{ \"name\": \"" + serviceName + "\", \"value\": \"" + err + "\"}";
      restOperation.setBody(responseBody);
      restOperation.setStatusCode(400);
      athis.completeRestOperation(restOperation);
    });
  }
};

/*
* Handle PUT requests
*/
f5_service_http.prototype.onPut = function(restOperation) {

};

/*
* Handle PATCH requests
*/
f5_service_http.prototype.onPatch = function(restOperation) {
  var newState = restOperation.getBody();

  if (DEBUG) {
    logger.info(WorkerName + " - onPatch()");
  }
  this.completeRestOperation(restOperation);
};

/*
* Handle DELETE requests
*/
f5_service_http.prototype.onDelete = function(restOperation) {

};
/**
* handle /example HTTP request
*/
f5_service_http.prototype.getExampleState = function () {

  if (useInfoblox) {
    return {
      "name": "my_http_service",
      "clustername": "localhost",
      "tenant" : "tenant_Nicolas",
      "app-data": {
    	"monitors": [
        	"http"
        ],
        "members": [
        	{
            	"servicePort": 80,
            	"serverAddresses": [
                	"192.0.1.10",
                	"192.0.1.11"
                ]
            }
        ]
      }
    };
  } else {
    return {
      "name": "my_http_service",
      "clustername": "localhost",
      "service-ip": "10.1.0.80",
      "tenant" : "tenant_Nicolas",
      "app-data": {
    	"monitors": [
        	"http"
        ],
        "members": [
        	{
            	"servicePort": 80,
            	"serverAddresses": [
                	"192.0.1.10",
                	"192.0.1.11"
                ]
            }
        ]
      }
    };
  }
};

module.exports = f5_service_http;
