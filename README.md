# REDHAWK Web Admin Console

## Description

Contains the REDHAWK Web Admin Console

## REDHAWK Documentation

REDHAWK Website: [www.redhawksdr.org](http://www.redhawksdr.org)

## Copyrights

This work is protected by Copyright. Please refer to the [Copyright File](src/COPYRIGHT) for updated copyright information.

## License
The REDHAWK Web Admin Console is licensed under the GNU Lesser General Public License (LGPL).

## Running
The REDHAWK Admin Console is a lightweigh web based application that runs on an HTML-5 compliant browser.  Admin Console requires a REDHAWK RESTful backend and web hosting. One such REDHAWK RESTful backend implementation is the [REDHAWk REST Python ](https://git.vsi-corp.com/redhawk-web-ui/rest-python).  The other REDHAWK RESTful back-end is built on top of RedBus.

## Standalone Admin Console
To install and run the Standalone REDHAWK Web Admin Console from RPMs:

    yum install redhawk-admin-console redhawk-rest-python redhawk-rest-doc
    
To run the standalone version of admin console:

    /var/redhawk/web/admin-console/bin/admin-console 
  
The standalone Admin Console URL is http://localhost:8888/ 

## Building

### Setting up your environment
You will need Node Package Manager `npm` installed on your system:

    yum install npm
    
To install grunt and bower on your system:

    sudo npm install -g grunt-cli
    sudo npm install -g bower

(Note that grunt and bower can be installed without sudo by skipping the -g option, however without the global (-g) option you need to include the full path to the executable in the node_modules directory (e.g. `path/to/admin-console/node_modules/bower/bin/bower`))

### Building Admin Console
    cd path/to/admin-console
    npm install
    bower install
    grunt default dist

The files are built in the `dist` directory
