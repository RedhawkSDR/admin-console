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

The REDHAWK Admin Console is a frontend interface and requires a backend REST service to run. It has been built to 
support the REDHAWK REST Python project and can be used by downloading that project and placing the contents 
(or symbolic link) of this repository in a directory `apps/admin` of the REST Python project. Follow the steps listed 
in REST Python to run both parts of the application.

The admin console can then be viewed by going to `http://<location:port>/apps/admin/`.

Dependencies for this project can be downloaded using `npm` with the following commands:

    npm install
    node_modules/bower/bin/bower install
    
Distribution versions of this project by running:

    node_modules/grunt/bin/grunt dist
    
