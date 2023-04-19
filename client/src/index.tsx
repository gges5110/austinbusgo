import React from "react";
import ReactDOM from "react-dom";
import { App } from "./App";
import "./index.css";
import * as serviceWorker from "./serviceWorker";
import mapboxgl from "mapbox-gl";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
mapboxgl.workerClass = require("worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker").default; // eslint-disable-line @typescript-eslint/no-var-requires

ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
