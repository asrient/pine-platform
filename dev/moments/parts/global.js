import $ from "jquery";
import React, { Component } from "react";

import "./global.css"

class BarButton extends React.Component {
    /** @props : openPage, param, preview, setBar
     ** 
     **/
    constructor(props) {
        super(props);
        this.state = {}
    }

    render() {
        return(<div className="center bar_butt">A</div>)
    }
}

export {BarButton}