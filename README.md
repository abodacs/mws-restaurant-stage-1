# Mobile Web Specialist Certification Course

---

#### _Three Stage Course Material Project - Restaurant Reviews_

# Restaurant Reviews Stage 2

An offline-first, PWA, Restaurant Reviews app. Part of a Udacity Mobile Web Specialist Nanodegree program, 3-parts project.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [GitHub - abodacs/mws-restaurant-stage-2-server](https://github.com/abodacs/mws-restaurant-stage-2)

### Installing

1.  Download the [server](https://github.com/abodacs/mws-restaurant-stage-2)

2.  Download this repo.

3.  Run the command `cd dist` to change into the `dist` folder and run a local http server.

4.  In this folder, start up a simple HTTP server to serve up the site files on your local computer. Python has some simple tools to do this, and you don't even need to know Python. For most people, it's already installed on your computer.

In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use.) For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

5.  Navigate to `localhost:8000` to view the app.

## Leaflet.js and Mapbox:

This repository uses [leafletjs](https://leafletjs.com/) with [Mapbox](https://www.mapbox.com/). You need to replace `<your MAPBOX API KEY HERE>` with a token from [Mapbox](https://www.mapbox.com/). Mapbox is free to use, and does not require any payment information

### Note about ES6

Most of the code in this project has been written to the ES6 JavaScript specification for compatibility with modern web browsers and future proofing JavaScript code. As much as possible, try to maintain use of ES6 in any additional JavaScript you write.
