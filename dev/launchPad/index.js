import $ from "jquery";
import React, { Component } from "react";
import ReactDOM from "react-dom";

import "./styles.css"



function TryClose(){
    pine.destroy();
}

class AppLink extends React.Component {
    constructor(props) {
        super(props);
        this.state = {}
    }
    open=()=>{
    console.log('open:',this.props);
    pine.appService.send('open-app',this.props.id);
    pine.minimize();
    }
    render() {
        return (
            <div className="center-col appLink">
                <div className="center" onClick={this.open}>
                    <img className="appIcon" src={this.props.icon} />
                </div>
                <div className="appLabel center base-regular ink-black">{this.props.label}</div>
            </div>
        )
    }
}

var appsdb=pine.store('showCase.txt');


class ShowCase extends React.Component {
    constructor(props) {
        super(props);
        this.state = { isLoading: true, apps: [], isError: false }
    }
    componentDidMount = () => {
        appsdb.open((err,r)=>{
            console.log('db opened',err,r);
        appsdb.find({}, (err, data) => {
            var state = this.state;
            state.isLoading = false;
            if (data == null) {
                state.isError = true;
            }
            else {
                state.apps = [];
                data.forEach(rec => {
                    state.apps.push(<AppLink key={rec.id} id={rec.id} icon={'files://appIcons/'+rec.icon} label={rec.name}/>)
                });
            }
            this.setState(state);
        })

            });

    }
    render() {
        if (this.state.isLoading) {
            return (
                <div className="center maxHt">LOADING</div>
            )
        }
        else {
            if (this.state.isError) {
                return (<div className="center maxHt">Something went wrong.</div>)
            }
            else {
                return (
                    <div className="appsGrid">
                        {this.state.apps}
                    </div>
                );
            }

        }

    }
}

ReactDOM.render(
    <div className="frame">
    <div id="bar">
        <div></div>
        <div id="handle1" className="handle center">
            <div id="dp_icon"></div>
        </div>
        <div className="handle"></div>
    </div>
    <div id="head">
        <div className="center-col">
            <div id="dp"></div>
            <div id="greeting" className=" ink-black">Good evening, Aritra.</div>
        </div>
    </div>
         <div>
         <ShowCase />
    </div>
    </div>
   
   , document.getElementById('root')
);

var isDPiconVisible=false

function show(){
    if(!isDPiconVisible){
         isDPiconVisible=true;
    $('#dp_icon').css({display:'block'})
    }
}

function hide(){
    if(isDPiconVisible){
          isDPiconVisible=false;
    $('#dp_icon').css({display:'none'})
    }
}


$(window).on('scroll',()=>{
    var curPos = $("#head").offset();
    var curTop = curPos.top;
    var scrollTop = $(window).scrollTop();
    if (curTop+$("#head").height() < scrollTop) {
       // console.log('show')
        show();
    }
    else{
      // console.log('hide')
       hide();
    }
})
