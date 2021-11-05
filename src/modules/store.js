import {observable, configure, toJS} from 'mobx'
import {themes} from './themes.js'
import {WAV_ITEM_SIZE} from './constants'
import {clamp} from '../helpers/clamp.js'
import {makeName} from '../helpers/makeName'
import {defaultVoices, defaultPinConfig, defaultMetadata} from '../helpers/makeDefaultStores'
import { parseDirectories } from '../helpers/parseDirectories.js'

configure({
    enforceActions: "never",
})

export const store = observable(
    {
        view:'home',
        theme:themes.dark,

        loading:false,
        setLoading:function(x){this.loading=x},
        loadProgress:0,
        loadingTitle:"",
        configNeedsUpdate:false,

        numWavPerPage:6,
        currentVoice:0,

        wavBoardIndex:40,
        wavBoardSelected:40,
        wavBoardRange:observable([]),
        wavBoardInterpolationTarget:undefined,

        rackBoardIndex:0,
        rackBoardSelected:0,
        rackBoardRange:[],

        pinConfigSelected:0,
        currentFirmwareIndex:-1,
        currentWebsiteIndex:-1,

        voices:defaultVoices(),
        // config:defaultConfig(),
        firmwares:observable([]),
        websites:observable([]),
        pinConfig:observable(defaultPinConfig),
        metadata:observable(defaultMetadata),

        getVoices:function(){
            return toJS(this.voices)
        },
        getMetadata:function(){
            return toJS(this.metadata)
        },

        onConnect:function(data){onConnect(this,data)},
        onProgress:function(p){onProgress(this,p)},
        scrollWavBoard:function(right){scrollWavBoard(this,right)},
        scrollRackBoard:function(right){scrollRackBoard(this,right)},
        handleResize:function(){handleResize(this)},
        setCurrentVoiceProp:function(prop,val){setCurrentVoiceProp(this,prop,val)},
        convertCurrentToRack:function(){convertCurrentToRack(this)},
        convertCurrentToNonRack:function(){convertCurrentToNonRack(this)},
        setBreakPoint:function(i,val){setBreakPoint(this,i,val)},
        setCurrentRackNumLayers:function(x){setCurrentRackNumLayers(this,x)},
        setCurrentRackName:function(x){setCurrentRackName(this,x)},
        getNote:function(voice,note){return getNote(this,voice,note)},
        getCurrentNote:function(){return getCurrentNote(this)},
        getRackBreakPoint:function(i){return getRackBreakPoint(this,i)},
        getRackLayer:function(i){return getRackLayer(this,i)},
        getCurrentRackLayer:function(){return getCurrentRackLayer(this)},
        setCurrentRackFile:function(f){setCurrentRackFile(this,f)},
        setCurrentWavFile:function(f){setCurrentWavFile(this,f)},
        getCurrentPin:function(){return getCurrentPin(this)},
        getPinConfig:function(){return getPinConfig(this)},
        setCurrentPinProp:function(prop,val){setCurrentPinProp(this,prop,val)},
        setCurrentNoteProp:function(prop,val){setCurrentNoteProp(this,prop,val)},
        setMetadataField:function(prop,val){setMetadataField(this,prop,val)},
        noteOn:function(voice, note){noteOn(this,voice,note)},
        noteOff:function(voice, note){noteOff(this,voice,note)},
        wavBoardRangeSelect:function(note){wavBoardRangeSelect(this,note)},
        wavBoardAddToSelection:function(note){wavBoardAddToSelection(this,note)},
        wavBoardsetInterpolationTarget:function(note){wavBoardsetInterpolationTarget(this,note)},
        wavBoardClearRange:function(){this.wavBoardRange.replace([]);this.wavBoardInterpolationTarget=undefined},
        rackBoardRangeSelect:function(note){rackBoardRangeSelect(this,note)},
        rackBoardAddToSelection:function(note){rackBoardAddToSelection(this,note)},
        rackBoardClearRange:function(){this.rackBoardRange.replace([])},
        bulkUploadRacks:function(e){bulkUploadRacks(this,e)}
    }
)

const onConnect = (self,data) => {
    const voices = toJS(self.voices)
    // keep the fx vars by merging the objects
    const newVoices = voices.map((v,i)=>
        v.map((n,ni)=>(
            {
                ...n,
                ...data.voices[i][ni]
            }
        ))
    )
    self.voices.replace(newVoices)
    self.firmwares.replace(data.firmwares)
    self.websites.replace(data.websites)
    self.pinConfig.replace(data.pinConfig)
    self.metadata = data.metadata
    self.currentFirmwareIndex = data.currentFirmwareIndex
    self.currentWebsiteIndex = data.currentWebsiteIndex
}

const onProgress = (self,p) => {
    const percent = (p * 100).toFixed(0)
    self.loadProgress = percent
}

const scrollWavBoard = (self,right) =>
    self.wavBoardIndex = right ?
        Math.min(128 - self.numWavPerPage,self.wavBoardIndex + self.numWavPerPage) :
        Math.max(0,self.wavBoardIndex - self.numWavPerPage)

const scrollRackBoard = (self,right) => {
    const { num_layers } = self.voices.slice()[self.currentVoice][self.wavBoardIndex].rack
    self.rackBoardIndex = right ?
        clamp(self.rackBoardIndex + self.numWavPerPage, 0, num_layers - self.numWavPerPage) :
        clamp(self.rackBoardIndex - self.numWavPerPage, 0, num_layers - self.numWavPerPage)
}

const handleResize = self => 
    self.numWavPerPage = Math.floor((window.innerWidth-120) / WAV_ITEM_SIZE)

const setCurrentVoiceProp = (self,prop,val) => {
    const voices = self.voices.slice()
    voices[self.currentVoice][self.wavBoardSelected][prop] = val
    self.voices.replace(voices)
    self.configNeedsUpdate = true
}

const convertCurrentToRack = self => {
    convertToRack(self,self.wavBoardSelected)
}

const convertToRack = (self, note) => {
    const voices = self.voices.slice()
    voices[self.currentVoice][note].isRack = -2 
    voices[self.currentVoice][note].rack = {
        num_layers : 2,
        break_points : observable([0,50,127]),
        layers : observable([{name:'',size:0},{name:'',size:0}])
    }
    self.voices.replace(voices)
    self.configNeedsUpdate = true
}

const convertCurrentToNonRack = self => {
    const voices = self.voices.slice()
    voices[self.currentVoice][self.wavBoardSelected].isRack = -1
    self.voices.replace(voices)
    self.configNeedsUpdate = true
}

const setBreakPoint = (self,i,val) => {
    const voices = self.voices.slice()
    var break_points = voices[self.currentVoice][self.wavBoardSelected].rack.break_points.slice()
    break_points[i+1] = val
    voices[self.currentVoice][self.wavBoardSelected].rack.break_points.replace(break_points)
    self.configNeedsUpdate = true
}

const setCurrentRackNumLayers = (self,numLayers) => {
    setRackNumLayers(self,self.wavBoardSelected,numLayers)
}

const setRackNumLayers = (self,note,numLayers) => {
    const voices = self.voices.slice()
    const layers = (Array(numLayers).fill().map(()=>({
        file:undefined,
        name:"",
        size:0
    })))
    const break_points = Array(numLayers+1).fill().map((_,b)=>
        b == 0 ? 0 : b==numLayers ? 128 : Math.floor(b * (128 / numLayers))
    )
    voices[self.currentVoice][note].rack.layers.replace(layers)
    voices[self.currentVoice][note].rack.break_points.replace(break_points)
    voices[self.currentVoice][note].rack.num_layers = numLayers
    self.voices.replace(voices)
    self.configNeedsUpdate = true
}

const setCurrentRackName = (self, name) =>{
    setRackName(self, self.wavBoardSelected, name)
}

const setRackName = (self,note,name) =>{
    const voices = self.voices.slice()
    voices[self.currentVoice][note].rack.name = name
    self.voices.replace(voices)
    self.configNeedsUpdate = true
}

const getNote = (self,voice,note) => self.voices.slice()[voice][note]

const getCurrentNote = self => self.voices.slice()[self.currentVoice][self.wavBoardSelected]

const getRackBreakPoint = (self,i) => {
    const voices = self.voices.slice()
    if(
        !voices[self.currentVoice][self.wavBoardSelected].rack ||
        !voices[self.currentVoice][self.wavBoardSelected].rack.break_points
    ){
        return undefined
    }
    const num = voices[self.currentVoice][self.wavBoardSelected].rack.num_layers || 0
    if(i<0 || i > num) return undefined
    return voices[self.currentVoice][self.wavBoardSelected].rack.break_points.slice()[i] ||
    0
}

const getRackLayer = (self,i) => {
    const voices = self.voices.slice()
    if(
        !voices[self.currentVoice][self.wavBoardSelected].rack ||
        !voices[self.currentVoice][self.wavBoardSelected].rack.layers ||
        !voices[self.currentVoice][self.wavBoardSelected].rack.layers.slice()[i]
    ){
        // rackBoardSelected is too high for this notes layers
        self.rackBoardSelected = 0
        return ({name:"empty",size:0})
    } 
    return voices[self.currentVoice][self.wavBoardSelected].rack.layers.slice()[i]
}

const getCurrentRackLayer = self => {
    const voices = self.voices.slice()
    if(
        !voices[self.currentVoice][self.wavBoardSelected].rack ||
        !voices[self.currentVoice][self.wavBoardSelected].rack.layers ||
        !voices[self.currentVoice][self.wavBoardSelected].rack.layers.slice()[self.rackBoardSelected]
    ){
        self.rackBoardSelected = 0
        return ({name:"empty",size:0})
    } 
    return voices[self.currentVoice][self.wavBoardSelected].rack.layers.slice()[self.rackBoardSelected]
}

const setCurrentRackFile = (self,files) => {
    if(self.rackBoardRange.length > 1){
        // there is a range
        if(files.length > 1){
            // multiple files selected
            let len = Math.min(files.length, self.rackBoardRange.length)
            if(!window.confirm(`${files.length} files, ${self.rackBoardRange.length} notes, will allocate ${len} files.`))return
            for(let i=0;i<len;i++){
                self.voices[self.currentVoice][self.wavBoardSelected].rack.layers[self.rackBoardRange[i]].filehandle = files[i]
                self.voices[self.currentVoice][self.wavBoardSelected].rack.layers[self.rackBoardRange[i]].name = makeName(files[i].name)
                self.voices[self.currentVoice][self.wavBoardSelected].rack.layers[self.rackBoardRange[i]].size = files[i].size
            }
        } else {
            // only one file selected, copy to all
            if(!window.confirm(`copy to ${self.wavBoardRange.length} notes selected?`))return
            for(let i=0;i<self.rackBoardRange.length;i++){
                self.voices[self.currentVoice][self.wavBoardSelected].rack.layers[self.rackBoardRange[i]].filehandle = files[0]
                self.voices[self.currentVoice][self.wavBoardSelected].rack.layers[self.rackBoardRange[i]].name = makeName(files[0].name)
                self.voices[self.currentVoice][self.wavBoardSelected].rack.layers[self.rackBoardRange[i]].size = files[0].size
            }
        }
    } else {
        // no range
        self.voices[self.currentVoice][self.wavBoardSelected].rack.layers[self.rackBoardSelected].filehandle = files[0]
        self.voices[self.currentVoice][self.wavBoardSelected].rack.layers[self.rackBoardSelected].name = makeName(files[0].name)
        self.voices[self.currentVoice][self.wavBoardSelected].rack.layers[self.rackBoardSelected].size = files[0].size
    }
    self.configNeedsUpdate = true
}

const setCurrentWavFile = (self,files) => {
    if(self.wavBoardRange.length > 1){
        // there is a range
        if(files.length > 1){
            // multiple files selected
            let len = Math.min(files.length, self.wavBoardRange.length)
            if(!window.confirm(`${files.length} files, ${self.wavBoardRange.length} notes, will allocate ${len} files.`))return
            for(let i=0;i<len;i++){
                self.voices[self.currentVoice][self.wavBoardRange[i]].filehandle = files[i]
                self.voices[self.currentVoice][self.wavBoardRange[i]].name = makeName(files[i].name)
                self.voices[self.currentVoice][self.wavBoardRange[i]].size = files[i].size
            }
        } else {
            // only one file selected
            if(self.wavBoardInterpolationTarget != undefined){
                // interpolate
                if(!window.confirm(`interpolate pitch across ${self.wavBoardRange.length} notes?`))return
                for(let i=0;i<self.wavBoardRange.length;i++){
                    let pitch = self.wavBoardRange[i] - self.wavBoardInterpolationTarget
                    self.voices[self.currentVoice][self.wavBoardRange[i]].filehandle = files[0]
                    self.voices[self.currentVoice][self.wavBoardRange[i]].name = makeName(files[0].name)
                    self.voices[self.currentVoice][self.wavBoardRange[i]].size = files[0].size
                    setNoteProp(self, self.wavBoardRange[i], "pitch", pitch)
                }
            } else {
                // copy to all
                if(!window.confirm(`copy to ${self.wavBoardRange.length} notes selected?`))return
                for(let i=0;i<self.wavBoardRange.length;i++){
                    self.voices[self.currentVoice][self.wavBoardRange[i]].filehandle = files[0]
                    self.voices[self.currentVoice][self.wavBoardRange[i]].name = makeName(files[0].name)
                    self.voices[self.currentVoice][self.wavBoardRange[i]].size = files[0].size
                }
            }
        }
    } else {
        // no range
        self.voices[self.currentVoice][self.wavBoardSelected].filehandle = files[0]
        self.voices[self.currentVoice][self.wavBoardSelected].name = makeName(files[0].name)
        self.voices[self.currentVoice][self.wavBoardSelected].size = files[0].size
    }
    self.configNeedsUpdate = true
}

const getCurrentPin = self => self.pinConfig.slice()[self.pinConfigSelected]

const getPinConfig = self => toJS(self.pinConfig)

const setCurrentPinProp = (self,prop,val) => {
    const pins = self.pinConfig.slice()
    pins[self.pinConfigSelected][prop] = val
    self.pinConfig.replace(pins)
    self.configNeedsUpdate = true
}

const setCurrentNoteProp = (self,prop,val) => {
    let range = toJS(self.wavBoardRange)
    if(range.length > 0){
        console.log("range")
        for(let note of range){
            setNoteProp(self,note,prop,val)
        }
    } else {
        setNoteProp(self,self.wavBoardSelected,prop,val)
    }
}

const setNoteProp = (self,note,prop,val) => {
    self.voices[self.currentVoice][note][prop] = val
    self.configNeedsUpdate = true
}

const noteOn = (self, voice, note) => {
    self.voices[voice][note].playing = true
}

const noteOff = (self, voice, note) => {
    self.voices[voice][note].playing = false
}

const setMetadataField = (self, prop, val) => {
    self.metadata[prop] = val
    self.configNeedsUpdate = true
}

const wavBoardRangeSelect = (self,note) => {
    let len = Math.abs(note - self.wavBoardSelected)
    let first = Math.min(note, self.wavBoardSelected)
    let selected = Array(len + 1).fill().map((_,i)=>i + first)
    self.wavBoardRange.replace(selected.sort())
    // console.log(toJS(self.wavBoardRange))
}

const wavBoardAddToSelection = (self,note) => {
    let selected = toJS(self.wavBoardRange)
    let i = selected.indexOf(note)
    if(i == -1){
        // not in array
        selected.push(note)
    } else {
        selected.splice(i,1)
    }
    // make sure the selected note is in the array too
    if(!selected.includes(self.wavBoardSelected)){
        selected.push(self.wavBoardSelected)
    }
    self.wavBoardRange.replace(selected.sort())
    // console.log(toJS(self.wavBoardRange))
}

const wavBoardsetInterpolationTarget = (self,note) => {
    if(self.wavBoardInterpolationTarget != note){
        self.wavBoardInterpolationTarget = note
    } else {
        self.wavBoardInterpolationTarget = undefined
    }
}

const rackBoardRangeSelect = (self,note) => {
    let len = Math.abs(note - self.rackBoardSelected)
    let first = Math.min(note, self.rackBoardSelected)
    let selected = Array(len + 1).fill().map((_,i)=>i + first)
    self.rackBoardRange.replace(selected.sort())
    // console.log(toJS(self.rackBoardRange))
}

const rackBoardAddToSelection = (self,note) => {
    let selected = toJS(self.rackBoardRange)
    let i = selected.indexOf(note)
    if(i == -1){
        // not in array
        selected.push(note)
    } else {
        selected.splice(i,1)
    }
    // make sure the selected note is int eh array too
    if(!selected.includes(self.rackBoardSelected)){
        selected.push(self.rackBoardSelected)
    }
    self.rackBoardRange.replace(selected.sort())
    // console.log(toJS(self.rackBoardRange))
}

const bulkUploadRacks = (self,e) => {
    let tree = parseDirectories(e)
    if(!tree){
        window.alert("error in drectory parse")
        return
    }
    let dirs = Object.keys(tree).sort()

    let numNotes = Math.min(self.wavBoardRange.length, dirs.length)
    if(!window.confirm(`${dirs.length} racks, ${self.wavBoardRange.length} notes, will allocate ${numNotes} racks.`))return
    for(let i=0;i<numNotes;i++){
        let files = tree[dirs[i]]
            // remove hidden files like .DSstore
            .filter(x=>!x.webkitRelativePath.split("/")[2].startsWith("."))
            .sort((a,b)=>a.name < b.name ? -1 : 1)
        let note = self.wavBoardRange[i]
        convertToRack(self, note)
        setRackNumLayers(self, note, files.length)
        setRackName(self, note, dirs[i])
        for(let j=0;j<files.length;j++){
            self.voices[self.currentVoice][note].rack.layers[j].filehandle = files[j]
            self.voices[self.currentVoice][note].rack.layers[j].name = makeName(files[j].name)
            self.voices[self.currentVoice][note].rack.layers[j].size = files[j].size
        }
    }
    self.configNeedsUpdate = true
}