import $ from "jquery";
import React, { Component } from "react";


import "./thumbs.css"
import "./global.css"

class Thumb extends React.Component {
    /** @props : src onClick
     ** 
     **/
    constructor(props) {
        super(props);
        this.state = {}
    }
    componentDidMount=()=>{
    }
    render() {
        return(
            <div className="thumb" style={{"backgroundImage":'url('+this.props.src+')'}}></div>
        )
    }
}

class ThumbsGrid extends React.Component {
    /** @props : src onClick
     ** 
     **/
    constructor(props) {
        super(props);
        this.state = {list:null}
    }
    componentDidMount=()=>{
        var state=this.state;
        state.list=[];
       /* for(var i=1;i<=15;i++){
            state.list.push("files://media/sample/"+i+".jpg");
        }*/
        this.setState(state);
    }
    showThumbs=()=>{
        var html=[];
        if(this.state.list!=null){
             this.state.list.forEach((elem,key)=>{
                html.push(<Thumb key={key} src={elem} />)
             })
        }
    return(html);
    }
    render() {
        return(
          <div className="center">
              <div className="thumbs_grid">  {this.showThumbs()} </div>
              </div> 
            )
    }
}

export {Thumb,ThumbsGrid}