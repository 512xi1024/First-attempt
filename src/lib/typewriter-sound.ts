// ============================================================
// 打字机按键音：Web Audio 实时合成，不引入任何音频文件
// 一个字符一下「嗒」+ 一声极轻的闷响（键落到纸上）
// 音量压得很低，音高/音量带随机，免得听起来像电子节拍器
// 开关跟随左下角「环境音」按钮：关掉环境音 = 全站静音
// ============================================================

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffers: AudioBuffer[] = [];
let enabled = true;

// 总音量：觉得吵就调小这里（0 ~ 1）
const MASTER_VOLUME = 0.16;

export function setTypeSoundEnabled(v: boolean) {
  enabled = v;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }
  try {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(ctx.destination);

    // 预生成 8 段 30ms 噪声，每次随机取一段复用，避免逐个字符新建 buffer
    const len = Math.max(64, Math.floor(ctx.sampleRate * 0.03));
    for (let n = 0; n < 8; n++) {
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const k = 1 - i / len;
        d[i] = (Math.random() * 2 - 1) * k * k * k;
      }
      noiseBuffers.push(buf);
    }
    return ctx;
  } catch {
    return null;
  }
}

export function playKeySound() {
  if (!enabled) return;
  const c = getCtx();
  if (!c || !master || c.state !== "running") return;

  const t = c.currentTime + 0.001;

  // ① 高频「嗒」：极短噪声 + 带通，衰减飞快
  const src = c.createBufferSource();
  src.buffer = noiseBuffers[Math.floor(Math.random() * noiseBuffers.length)];
  src.playbackRate.value = 0.85 + Math.random() * 0.4;

  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1500 + Math.random() * 1200;
  bp.Q.value = 1.5;

  const g = c.createGain();
  g.gain.value = 0.55 + Math.random() * 0.25;

  src.connect(bp).connect(g).connect(master);
  src.start(t);
  src.stop(t + 0.05);

  // ② 低频「哚」：键落到纸上的那点闷响
  const osc = c.createOscillator();
  osc.type = "triangle";
  const f0 = 145 + Math.random() * 45;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(f0 * 0.6, t + 0.035);

  const og = c.createGain();
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(0.22, t + 0.004);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

  osc.connect(og).connect(master);
  osc.start(t);
  osc.stop(t + 0.06);
}
