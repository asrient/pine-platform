import $ from "jquery";
import React, { Component } from "react";

import {BarButton} from "./global.js";
import {ThumbsGrid} from "./thumbs.js";

import "./timeline.css"
import "./global.css"

class Timeline extends React.Component {
    /** @props : openPage, param, preview, setBar
     ** 
     **/
    constructor(props) {
        super(props);
        this.state = {}
    }
    componentDidMount=()=>{
        this.props.setBar(
        <div id="tl_bar">
        <div></div>
        <div className="center tl_bar_opts">
            <BarButton/><BarButton/><BarButton/>
        </div>
        </div>)

    }
    render() {
        return(<ThumbsGrid/>)
    }
}

export default Timeline