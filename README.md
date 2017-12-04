#iControl LX workers

This repo will give you access to a group of workers you can leverage to deploy
services.

2 workers are available here:
  * an app interface worker (app-interface). This worker give you a declarative
    interface to deploy services in a way that no F5 specific knowledge is required
  * an ipam worker (ipam-infoblox). This worker will let you communicate with an
    infoblox platform to retrieve the virtual server IP automatically.

#Requirements

iControl LX extension is available on:
  * iWorkflow 2.3.0
  * BIG-IP 13.1
