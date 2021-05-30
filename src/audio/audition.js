import {RPCOut} from '../wvr/rpc'
import {store} from '../modules/store.js'
import {makeDistortionCurve,make_verb_array_buffer} from '../helpers/toPcm'

export const auditionDisk = async() => {
    const voice = store.currentVoice
    const note = store.wavBoardSelected
    var velocity = 127
    if(store.getCurrentNote().isRack > -1){
        velocity = store.getCurrentNote().rack.break_points.slice()[store.rackBoardSelected + 1] -1
    }
    const data = {
        procedure:0,
        voice,
        note,
        velocity
    }
    RPCOut(data)
}

export const auditionLocal = async(f) => new Promise(async(res)=>{
    if(!f){
        console.log("no file to audition local")
        res()
        return
    }
    console.log("file to audition")
    console.log(f)
    const voice = store.currentVoice
    const note = store.wavBoardSelected
    const {dist,verb,pitch} = store.getVoices()[voice][note]
    var playbackRate = semitones_to_float(pitch)
    var input_reader = new FileReader();
    input_reader.onload = async(e) => {
        // store.noteOn(voice,note)
        var ctx = new AudioContext({sampleRate:44100});
        var src = ctx.createBufferSource()

        var distortion = ctx.createWaveShaper()
        distortion.curve = makeDistortionCurve(dist/10)
        distortion.oversample=('4x')
        var reverb = ctx.createConvolver()
        var reverb_data_buffer = make_verb_array_buffer({ctx})
        reverb.buffer = reverb_data_buffer
        var reverb_gain = ctx.createGain()
        reverb_gain.gain.value = verb / 100
        src.buffer = await ctx.decodeAudioData(e.target.result);
        src.connect(reverb)
        src.connect(distortion)
        reverb.connect(reverb_gain)
        reverb_gain.connect(ctx.destination)
        distortion.connect(ctx.destination)
        src.playbackRate.value = playbackRate
        src.onended=()=>{
            // console.log('done')
            // store.noteOff(voice,note)
        }
        src.start()
        res(src)
    }
    input_reader.readAsArrayBuffer(f);
})

var semitones_to_float = semitones => {
    const semitone_ratio = Math.pow(2,1/12)
    return Math.pow(semitone_ratio, semitones)
}
