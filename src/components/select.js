import React from 'react';
import {store} from '../modules/store.js'

export const SelectNum = props => 
<div style={container}>
    <label>{props.label}</label>
    <select {...props}
        onChange={e=>props.onChange(parseInt(e.target.value))}
        style={select_style}
    />
</div>

const container = {
    width:300,
    display:'flex',
    flexDirection:'row',
    alignItems:'center',
    marginLeft:20,
    color:store.theme.primary
}

const select_style = {
    width:120,
    height:25,
    margin:2,
    marginLeft:'auto',
    marginRight:30,
    color:store.theme.primary,
    backgroundColor:store.theme.backgroundColor
}

