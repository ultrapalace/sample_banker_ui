import React, { useState, useRef } from 'react';
import {Text} from '../components/text'
import {observer} from 'mobx-react-lite'
import {forceUploadFirmware} from '../wvr/uploadFirmware'
import {Button} from '../components/button'
import {SelectNum} from '../components/select'
import {store} from '../modules/store'
import { restoreEMMC, resetEMMC } from '../wvr/emmc';
import {initWebMidi} from '../modules/webMidi'
import {fetchLocalIP} from '../wvr/localNetwork'
import {joinLocalNetwork} from '../wvr/localNetwork'
import { handleSFZ } from '../helpers/sfz';
import { toJS } from 'mobx';

export const Global = observer(() => {
    const [firmware,setFirmware] = useState(null)
    const firmwareFileInput = useRef(null)
    const emmcRestoreFileInput = useRef(null)
    const emmcBackupRef = useRef(null)
    const sfzFileInput = useRef(null)
    const sfzFolderInput = useRef(null)
    const metadata = store.getMetadata()
    return(
        <div style={container}>
            <Text>
                GLOBAL SETTINGS
            </Text>
            <SelectNum
                style={{marginTop:20}}
                label="global volume"
                value={metadata.globalVolume}
                onChange={e=>store.setMetadataField('globalVolume',e)}
            >
                {Array(128).fill().map((_,i)=><option key ={i} value={i}>{i}</option>)}
            </SelectNum>
            <SelectNum
                label="check recovery pin"
                value={metadata.shouldCheckStrappingPin}
                onChange={e=>window.confirm("this is dangerous are you sure?") && store.setMetadataField('shouldCheckStrappingPin',e)}
            >
                <option value={1}>true</option>
                <option value={0}>false</option>
            </SelectNum>
            <SelectNum
                label="recovery pin"
                value={metadata.recoveryModeStrappingPin}
                onChange={e=>window.confirm("this is dangerous are you sure?") && store.setMetadataField('recoveryModeStrappingPin',e)}
            >
                {[0,1,2,3,4,5,11,12,13].map(x=><option key ={x} value={x}>{"D"+x}</option>)}
            </SelectNum>
            <SelectNum
                label="wifi log verbosity"
                value={metadata.wLogVerbosity}
                onChange={e=>store.setMetadataField('wLogVerbosity',e)}
            >
                <option value={0}>none</option>
                <option value={1}>error</option>
                <option value={2}>warn</option>
                <option value={3}>info</option>
                <option value={4}>debug</option>
                <option value={5}>verbose</option>
            </SelectNum>
            <SelectNum
                label="wifi on at boot"
                value={metadata.wifiStartsOn}
                onChange={e=>window.confirm("this is dangerous are you sure?") && store.setMetadataField('wifiStartsOn',e)}
            >
                <option value={1}>true</option>
                <option value={0}>false</option>
            </SelectNum>
            <SelectNum
                label="wifi power"
                value={metadata.wifiPower}
                onChange={e=>window.confirm("high wifi power settings will consume more power and create more heat, are you sure?") && store.setMetadataField('wifiPower',e)}
            >
                <option value={8}>8</option>
                <option value={20}>20</option>
                <option value={28}>28</option>
                <option value={34}>34</option>
                <option value={44}>44</option>
                <option value={52}>52</option>
                <option value={60}>60</option>
                <option value={68}>68</option>
                <option value={74}>74</option>
                <option value={76}>76</option>
                <option value={78}>78</option>
            </SelectNum>
            <SelectNum
                label="midi channel"
                value={metadata.midiChannel}
                onChange={e=>store.setMetadataField('midiChannel',e)}  
            >
                <option value={0}>OMNI</option>
                {Array(16).fill().map((x,i)=><option value={i+1} key={i}>{i+1}</option>)}
            </SelectNum>
            <SelectNum
                label="pitch bend up"
                value={metadata.pitchBendSemitonesUp}
                onChange={e=>store.setMetadataField('pitchBendSemitonesUp',e)}  
            >
                {[0, 1, 2].map(x=><option value={x} key={x}>{x}</option>)}
            </SelectNum>
            <SelectNum
                label="pitch bend down"
                value={metadata.pitchBendSemitonesDown}
                onChange={e=>store.setMetadataField('pitchBendSemitonesDown',e)}  
            >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(x=><option value={x} key={x}>{x}</option>)}
            </SelectNum>

            <div style={{display:'flex',flexDirection:'row',alignItems:'center', marginLeft:20, width:400}}>
                <Text primary>WVR wifi network name :</Text>
                <Text warn style={{marginLeft:10}}>{store.metadata.wifiNetworkName}</Text>
                <Button
                    style={{marginLeft:'auto'}}
                    title="change"
                    onClick={()=>{
                        const name = window.prompt("enter new WIFI name")
                        if(name){
                            store.metadata.wifiNetworkName = name
                            store.configNeedsUpdate = true
                        }
                    }}
                />
            </div>
            <div style={{display:'flex',flexDirection:'row',alignItems:'center', marginLeft:20, width:400}}>
                <Text primary>WVR wifi network password :</Text>
                <Text warn style={{marginLeft:10}}>{store.metadata.wifiNetworkPassword}</Text>
                <Button
                    style={{marginLeft:'auto'}}
                    title="change"
                    onClick={()=>{
                        const name = window.prompt("enter new WIFI password of at least 8 characters")
                        if(name && name.length < 8){
                            alert("password too short")
                            return
                        }
                        if(name){
                            store.metadata.wifiNetworkPassword = name
                            store.configNeedsUpdate = true
                        }
                    }}
                />
            </div>
            <div style={{display:'flex',flexDirection:'row',alignItems:'center', marginLeft:20, width:400, marginTop:20}}>
                <Text primary>
                    Rack Slots Remaining:
                </Text>
                <Text warn style={{marginLeft:20}}>
                    {store.getNumRackSlotsOpen()} / 128
                </Text>
            </div>
            <Text 
                style={{marginLeft:20,marginTop:20, marginRight:'auto'}}
                primary
            >
                Manage eMMC :
            </Text>
            <div style={{display:'flex',flexDirection:'row',alignItems:'center', marginLeft:20, width:400, marginTop:5}}>
                <Button
                    style={{marginRight:5}}
                    title="backup eMMC"
                    onClick={()=>{
                        const res = window.confirm("This will download all the contents of the WVR eMMC memory to your computer.\nIt may take a very long time.\nDo you wish to proceed?")
                        if(res){
                            emmcBackupRef.current.click()
                        }
                    }}
                    warn
                />
                <Button
                    style={{marginRight:5}}
                    title="restore eMMC"
                    onClick={()=>{
                        const res = window.confirm("This will overwrite all the data saved on the WVR, and replace it with a backup file from your computer.\nIt may take a very long time\nDo you wish to proceed?\nIf so, please click \"ok\" and choose a WVR backupfile ( .bin ) from your computer")
                        if(res){
                            emmcRestoreFileInput.current.click()
                        }
                    }}
                    warn
                />
                <Button
                    style={{marginRight:'auto'}}
                    title="reset eMMC"
                    onClick={()=>{
                        const res = window.confirm("this will permanently delete all data on the WVR, are you absolutely sure?")
                        if(res){
                            resetEMMC()
                        }
                    }}
                    warn
                />
            </div>
            <Text 
                style={{marginLeft:20,marginTop:20, marginRight:'auto'}}
                primary
            >
                Force firmware directly to flash and boot :
            </Text>
            <div style={{display:'flex',flexDirection:'row',margin:20, marginTop:5}}>
                <Button
                    warn = {firmwareFileInput.current}
                    disabled = {!firmwareFileInput.current}
                    title="force upload"
                    style={{cursor:firmware?'pointer':'default',
                    // width:150
                    }}
                    onClick={()=>{
                        if(!firmware) return
                        if(!window.confirm("upload this firmware to WVR and boot it?")) return
                        forceUploadFirmware({fileHandle:firmware})
                    }}
                />
                <Button
                    style={{width:228}}
                    title={firmware ? firmware.name : "select firmware"}
                    onClick={()=>{firmwareFileInput.current.click()}}
                />
            </div>
            <Text 
                style={{marginLeft:20, marginRight:'auto'}}
                primary
            >
                MIDI data sources :
            </Text>
            <div style={{display:'flex',flexDirection:'row',margin:20, marginTop:5, marginBottom:5}}>
                <Button
                    title="refresh"
                    onClick={()=>initWebMidi()}
                />
                {
                    store.midiInputs.map(x=>
                        <Button 
                            key={x}
                            style={{width:200}}
                            title={x}
                            disabled
                        />    
                    )
                }
            </div>
            <Text 
                style={{marginLeft:20, marginRight:'auto'}}
                primary
            >
                Upload an .sfz :
            </Text>
            <div style={{display:'flex',flexDirection:'row',margin:20, marginTop:5}}>
                <Button
                    title="files"
                    onClick={()=>sfzFileInput.current.click()}
                />
                <Button
                    title="folder"
                    onClick={()=>sfzFolderInput.current.click()}
                />
            </div>
            <div style={{marginBottom:20}}>
                <SelectNum
                    style={{width:350, marginTop:20}}
                    label="join external wifi network"
                    value={metadata.doStationMode}
                    onChange={e=>store.setMetadataField('doStationMode',e)}
                >
                    <option value={1}>yes</option>
                    <option value={0}>no</option>
                </SelectNum>
                {store.metadata.doStationMode &&
                    <div style={{display:'flex',flexDirection:'row',alignItems:'center', marginLeft:20, width:400}}>
                        <Text primary>join network name :</Text>
                        <Text warn style={{marginLeft:10}}>{store.metadata.stationWifiNetworkName}</Text>
                        <Button
                            style={{marginLeft:'auto'}}
                            title="change"
                            onClick={()=>{
                                const name = window.prompt("enter the WIFI network name")
                                if(name){
                                    store.metadata.stationWifiNetworkName = name
                                }
                            }}
                        />
                    </div>
                }
                {store.metadata.doStationMode &&
                    <div style={{display:'flex',flexDirection:'row',alignItems:'center', marginLeft:20, width:400}}>
                        <Text primary>join network password :</Text>
                        <Text warn style={{marginLeft:10}}>{store.metadata.stationWifiNetworkPassword}</Text>
                        <Button
                            style={{marginLeft:'auto'}}
                            title="change"
                            onClick={()=>{
                                const name = window.prompt("enter the WIFI password")
                                if(name){
                                    store.metadata.stationWifiNetworkPassword = name
                                }
                            }}
                        />
                    </div>
                }
                {store.metadata.doStationMode &&
                    <div style={{display:'flex',flexDirection:'row',alignItems:'center', marginLeft:20, width:400}}>
                        <Text primary>
                            {"local IP Address : "}
                        </Text>
                        <Text warn style={{userSelect:"default", marginLeft:10}}>
                            {store.localIP || "unknown"}
                        </Text>
                        <Button
                            style={{marginLeft:'auto'}}
                            title="get IP Address"
                            onClick={()=>fetchLocalIP()}
                        />
                    </div>
                }
                {store.metadata.doStationMode &&
                    <Button
                        style={{marginLeft:20, width:350}}
                        title="try new network and password"
                        onClick={()=>joinLocalNetwork()}
                    />
                } 
            </div>           
            <input 
                ref={firmwareFileInput}
                type="file" 
                onChange={e=>e.target.files.length && setFirmware(e.target.files[0])}
                style={{display:'none'}}
                accept=".bin"
            />
            <input 
                ref={emmcRestoreFileInput}
                type="file" 
                onChange={e=>e.target.files.length && restoreEMMC(e.target.files[0])}
                style={{display:'none'}}
                accept=".bin"
            />
            <input 
                ref={sfzFolderInput}
                multiple
                type="file" 
                onChange={async e=>{
                    if(!e.target.files.length) return
                    e.persist()
                    store.setLoading(true)
                    await handleSFZ(e).catch(alert)
                    e.target.value = null
                    store.setLoading(false)
                    store.view="home"
                }}
                style={{display:'none'}}
                directory="" 
                webkitdirectory=""
            />
            <input 
                ref={sfzFileInput}
                multiple
                type="file" 
                onChange={async e=>{
                    if(!e.target.files.length) return
                    e.persist()
                    store.setLoading(true)
                    await handleSFZ(e).catch(alert)
                    e.target.value = null
                    store.setLoading(false)
                    store.view="home"
                }}
                style={{display:'none'}}
            />
            <a 
                href='/wvr_emmc_backup.bin' 
                download
                ref={emmcBackupRef}
                style={{display:'none'}}
            />
        </div>
    )
})

const container = {
    flex:1,
    display:'flex',
    flexDirection:'column'
}
