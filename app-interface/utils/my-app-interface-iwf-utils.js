/*
* This file contains the different function that will be used to
* deploy services on iWF
* here we have the following functions:
*     - Deploy a service on iWF
*     - Contact another iControl LX extension to communicate with infoblox
*/

// to allow connection to services that have self signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var logger = require('f5-logger').getInstance();
var request = require("/usr/share/rest/node/node_modules/request");
var promise = require("/usr/share/rest/node/node_modules/promise");
var DEBUG = true;

function MyAppInterfaceIWFUtils () {

  /*
  * iWorkflow related parameters
  */
  var IWF_IP = "10.100.60.70";
  var tenantName = "student";

};

module.exports = MyAppInterfaceIWFUtils;
