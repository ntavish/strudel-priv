use web_audio_api::{
    context::{AudioContext, BaseAudioContext},
    AudioBuffer,
    node::{AudioBufferSourceNode, AudioNode, AudioScheduledSourceNode, BiquadFilterNode, BiquadFilterType, GainNode, OscillatorNode, OscillatorType},
    node::BiquadFilterType::{Bandpass, Highpass, Lowpass}
};
use crate::webaudiobridge::WebAudioMessage;

#[derive(Clone, Copy, Debug)]
pub struct Delay {
    pub wet: f32,
    pub delay_time: f32,
    pub feedback: f32,
}

#[derive(Clone, Copy, Debug)]
pub struct Loop {
    pub is_loop: u8,
    pub loop_start: f64,
    pub loop_end: f64,
}

#[derive(Clone, Copy, Debug)]
pub struct LPF {
    pub frequency: f32,
    pub resonance: f32,
}

#[derive(Clone, Copy, Debug)]
pub struct HPF {
    pub frequency: f32,
    pub resonance: f32,
}

#[derive(Clone, Copy, Debug)]
pub struct BPF {
    pub frequency: f32,
    pub resonance: f32,
}

#[derive(Debug, Copy, Clone)]
pub struct ADSR {
    pub attack: Option<f64>,
    pub decay: Option<f64>,
    pub sustain: Option<f32>,
    pub release: Option<f64>,
}

#[derive(Debug, Copy, Clone)]
pub struct FilterADSR {
    pub attack: Option<f64>,
    pub decay: Option<f64>,
    pub sustain: Option<f64>,
    pub release: Option<f64>,
    pub env: Option<f64>,
}


pub trait WebAudioInstrument {
    fn set_adsr(&mut self, t: f64, adsr: &ADSR, velocity: f32, duration: f64);
    fn play(&mut self, t: f64, message: &WebAudioMessage, duration: f64);
    fn set_filters(&mut self, context: &mut AudioContext, message: &WebAudioMessage) -> Vec<BiquadFilterNode>;
}

pub struct Synth {
    pub oscillator: OscillatorNode,
    pub envelope: GainNode,
}

impl Synth {
    pub fn new(context: &mut AudioContext) -> Self {
        let oscillator = context.create_oscillator();
        let envelope = context.create_gain();
        Self { oscillator, envelope }
    }

    pub fn set_frequency(&mut self, frequency: &f32) {
        self.oscillator.frequency().set_value(*frequency);
    }

    pub fn set_waveform(&mut self, waveform: &str) {
        match waveform {
            "sine" => self.oscillator.set_type(OscillatorType::Sine),
            "square" => self.oscillator.set_type(OscillatorType::Square),
            "triangle" => self.oscillator.set_type(OscillatorType::Triangle),
            "saw" | "sawtooth" => self.oscillator.set_type(OscillatorType::Sawtooth),
            _ => {}
        }
    }
}

impl WebAudioInstrument for Synth {
    fn set_adsr(&mut self, t: f64, adsr: &ADSR, velocity: f32, duration: f64) {
        let attack = adsr.attack.unwrap_or(0.001);
        let decay = adsr.decay.unwrap_or(0.05);
        let sustain = adsr.sustain.unwrap_or(0.6);
        let release = adsr.release.unwrap_or(0.01);
        self.envelope.gain()
            .set_value_at_time(0.0, t)
            .linear_ramp_to_value_at_time(velocity, t + attack)
            .exponential_ramp_to_value_at_time((sustain + 0.0001) * velocity, t + attack + decay)
            // .set_value_at_time((sustain + 0.00001) * velocity, t + duration)
            .exponential_ramp_to_value_at_time(0.000001, t + duration + release);
    }


    fn play(&mut self, t: f64, message: &WebAudioMessage, release: f64) {
        self.oscillator.start();
        self.oscillator.stop_at(t + message.duration + release);
    }

    fn set_filters(&mut self, context: &mut AudioContext, message: &WebAudioMessage) -> Vec<BiquadFilterNode> {
        let mut filters = Vec::new();
        if message.bpf.frequency > 0.0 {
            let mut bpf = context.create_biquad_filter();
            bpf.set_type(Bandpass);
            bpf.frequency().set_value(message.bpf.frequency);
            bpf.q().set_value(message.bpf.resonance);
            filters.push(bpf);
        } else if message.lpf.frequency > 0.0 {
            let mut lpf = context.create_biquad_filter();
            lpf.set_type(Lowpass);
            lpf.frequency().set_value(message.lpf.frequency);
            lpf.q().set_value(message.lpf.resonance);
            filters.push(lpf);
        } else if message.hpf.frequency > 0.0 {
            let mut hpf = context.create_biquad_filter();
            hpf.set_type(Highpass);
            hpf.frequency().set_value(message.hpf.frequency);
            hpf.q().set_value(message.hpf.resonance);
            filters.push(hpf);
        }

        if !filters.is_empty() {
            self.oscillator.connect(filters.first().unwrap());
            filters.last().unwrap().connect(&self.envelope);
        } else {
            self.oscillator.connect(&self.envelope);
        };

        filters
    }
}

pub struct Sampler {
    pub sample: AudioBufferSourceNode,
    pub envelope: GainNode,
}

impl Sampler {
    pub fn new(context: &mut AudioContext, audio_buffer: AudioBuffer) -> Self {
        let mut sample = context.create_buffer_source();
        sample.set_buffer(audio_buffer);
        let envelope = context.create_gain();
        Self { sample, envelope }
    }
}

impl WebAudioInstrument for Sampler {
    fn set_adsr(&mut self, t: f64, adsr: &ADSR, velocity: f32, duration: f64) {
        let attack = adsr.attack.unwrap_or(0.001);
        let decay = adsr.decay.unwrap_or(0.001);
        let sustain = adsr.sustain.unwrap_or(1.0);
        let release = adsr.release.unwrap_or(0.01);
        self.envelope.gain()
            .set_value_at_time(0.0, t)
            .linear_ramp_to_value_at_time(velocity, t + attack)
            .linear_ramp_to_value_at_time((sustain + 0.00001) * velocity, t + attack + decay)
            .set_value_at_time((sustain + 0.00001) * velocity, t + duration)
            .linear_ramp_to_value_at_time(0.0, t + duration + release);
    }

    fn play(&mut self, t: f64, message: &WebAudioMessage, release: f64) {
        let buffer_duration = release;
        let (start_at, stop_at) = if message.speed < 0.0 {
            (buffer_duration, t + message.duration + 0.2)
        } else {
            (message.begin * buffer_duration, t + message.duration + message.adsr.release.unwrap_or(0.01))
        };
        if message.looper.is_loop > 0 {
            self.sample.set_loop(true);
            self.sample.set_loop_start(message.looper.loop_start);
            self.sample.set_loop_end(message.looper.loop_end);
            self.sample.start_at_with_offset(
                t,
                self.sample.loop_start(),
            );
            self.sample.stop_at(t + message.duration + message.adsr.release.unwrap_or(0.01));
        } else {
            self.sample.start_at_with_offset(
                t,
                start_at,
            );
            self.sample.stop_at(stop_at);
        }
    }

    fn set_filters(&mut self, context: &mut AudioContext, message: &WebAudioMessage) -> Vec<BiquadFilterNode> {
        let mut filters = Vec::new();
        if message.bpf.frequency > 0.0 {
            let mut bpf = context.create_biquad_filter();
            bpf.set_type(Bandpass);
            bpf.frequency().set_value(message.bpf.frequency);
            bpf.q().set_value(message.bpf.resonance);
            filters.push(bpf);
        } else if message.lpf.frequency > 0.0 {
            let mut lpf = context.create_biquad_filter();
            lpf.set_type(Lowpass);
            lpf.frequency().set_value(message.lpf.frequency);
            lpf.q().set_value(message.lpf.resonance);
            filters.push(lpf);
        } else if message.hpf.frequency > 0.0 {
            let mut hpf = context.create_biquad_filter();
            hpf.set_type(Highpass);
            hpf.frequency().set_value(message.hpf.frequency);
            hpf.q().set_value(message.hpf.resonance);
            filters.push(hpf);
        }

        if !filters.is_empty() {
            self.sample.connect(filters.first().unwrap());
            filters.last().unwrap().connect(&self.envelope);
        } else {
            self.sample.connect(&self.envelope);
        };
        filters
    }
}

pub fn apply_filter_adsr(filter_node: &BiquadFilterNode, message: &WebAudioMessage, filter: &BiquadFilterType, now: f64) {
    let env = match filter {
        Lowpass => message.lpenv,
        Highpass => message.hpenv,
        Bandpass => message.bpenv,
        _ => message.lpenv,
    };

    let freq = match filter {
        Lowpass => message.lpf.frequency,
        Highpass => message.hpf.frequency,
        Bandpass => message.bpf.frequency,
        _ => 8000.0,
    };

    let offset = env.env.unwrap_or(1.0) * 0.5;
    let min = (2f32.powf(-offset as f32) * freq).clamp(0.0, 20000.0);
    let max = (2f32.powf((env.env.unwrap_or(1.0) - offset) as f32) * freq).clamp(0.0, 20000.0);
    let range = max - min;
    let peak = min + range;
    let sustain_level = min + env.sustain.unwrap_or(1.0) as f32 * range;

    filter_node.frequency().set_value_at_time(min, now)
        .linear_ramp_to_value_at_time(peak, now + env.attack.unwrap_or(0.01))
        .linear_ramp_to_value_at_time(sustain_level, now + env.attack.unwrap_or(0.01) + env.decay.unwrap_or(0.01))
        // .set_value_at_time(sustain_level, now + message.duration)
        .linear_ramp_to_value_at_time(min, now + message.duration + env.release.unwrap_or(0.01));
}
