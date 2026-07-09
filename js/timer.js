import { WARMUP_SECONDS, COOLDOWN_SECONDS, formatDuration } from './program.js';
import * as audio from './audio.js';

const PHASE = {
  IDLE: 'idle',
  WARMUP: 'warmup',
  INTERVAL: 'interval',
  COOLDOWN: 'cooldown',
  COMPLETE: 'complete',
  PAUSED: 'paused',
};

export class WorkoutTimer {
  constructor(workout, callbacks = {}) {
    this.workout = workout;
    this.callbacks = callbacks;
    this.phase = PHASE.IDLE;
    this.intervalIndex = 0;
    this.remainingSeconds = 0;
    this.elapsedSeconds = 0;
    this.tickInterval = null;
    this.halfwayAnnounced = false;
    this._pausedPhase = null;
  }

  getState() {
    const interval = this.getCurrentInterval();
    return {
      phase: this.phase,
      intervalIndex: this.intervalIndex,
      remainingSeconds: this.remainingSeconds,
      elapsedSeconds: this.elapsedSeconds,
      currentType: interval?.type ?? null,
      totalIntervals: this.workout.intervals.length,
      phaseLabel: this.getPhaseLabel(),
      progress: this.getProgress(),
    };
  }

  getCurrentInterval() {
    if (this.phase === PHASE.INTERVAL) {
      return this.workout.intervals[this.intervalIndex];
    }
    if (this.phase === PHASE.WARMUP || this.phase === PHASE.COOLDOWN) {
      return { type: 'walk', seconds: this.remainingSeconds };
    }
    return null;
  }

  getPhaseLabel() {
    switch (this.phase) {
      case PHASE.WARMUP:
        return 'Warm Up';
      case PHASE.COOLDOWN:
        return 'Cool Down';
      case PHASE.INTERVAL: {
        const interval = this.workout.intervals[this.intervalIndex];
        return interval.type === 'run' ? 'Run' : 'Walk';
      }
      case PHASE.COMPLETE:
        return 'Complete!';
      case PHASE.PAUSED:
        return 'Paused';
      default:
        return 'Ready';
    }
  }

  getProgress() {
    const total =
      WARMUP_SECONDS +
      this.workout.intervals.reduce((s, i) => s + i.seconds, 0) +
      COOLDOWN_SECONDS;
    return Math.min(1, this.elapsedSeconds / total);
  }

  start() {
    if (this.phase !== PHASE.IDLE && this.phase !== PHASE.PAUSED) return;
    audio.resumeAudioContext();

    if (this.phase === PHASE.PAUSED) {
      this.phase = this._pausedPhase;
      this._startTicking();
      this.callbacks.onStateChange?.(this.getState());
      return;
    }

    this.phase = PHASE.WARMUP;
    this.remainingSeconds = WARMUP_SECONDS;
    this.intervalIndex = 0;
    this.elapsedSeconds = 0;
    this.halfwayAnnounced = false;
    audio.announceWarmup();
    this._startTicking();
    this.callbacks.onStateChange?.(this.getState());
  }

  pause() {
    if (this.phase === PHASE.IDLE || this.phase === PHASE.COMPLETE || this.phase === PHASE.PAUSED) {
      return;
    }
    this._pausedPhase = this.phase;
    this.phase = PHASE.PAUSED;
    this._stopTicking();
    this.callbacks.onStateChange?.(this.getState());
  }

  stop() {
    this._stopTicking();
    this.phase = PHASE.IDLE;
    this.remainingSeconds = 0;
    this.intervalIndex = 0;
    this.elapsedSeconds = 0;
    this.callbacks.onStateChange?.(this.getState());
  }

  _startTicking() {
    this._stopTicking();
    this.tickInterval = setInterval(() => this._tick(), 1000);
  }

  _stopTicking() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  _tick() {
    this.elapsedSeconds += 1;
    this.remainingSeconds -= 1;

    const interval = this.getCurrentInterval();
    if (interval && this.phase === PHASE.INTERVAL) {
      const halfway = Math.floor(interval.seconds / 2);
      const elapsedInInterval = interval.seconds - this.remainingSeconds;
      if (!this.halfwayAnnounced && elapsedInInterval === halfway && halfway > 10) {
        this.halfwayAnnounced = true;
        audio.announceHalfway();
      }
    }

    if (this.remainingSeconds <= 3 && this.remainingSeconds > 0) {
      audio.announceCountdown();
    }

    if (this.remainingSeconds <= 0) {
      this._advancePhase();
    }

    this.callbacks.onStateChange?.(this.getState());
  }

  _advancePhase() {
    this.halfwayAnnounced = false;

    if (this.phase === PHASE.WARMUP) {
      this.phase = PHASE.INTERVAL;
      this.intervalIndex = 0;
      const interval = this.workout.intervals[0];
      this.remainingSeconds = interval.seconds;
      if (interval.type === 'run') audio.announceRun();
      else audio.announceWalk();
      return;
    }

    if (this.phase === PHASE.INTERVAL) {
      const current = this.workout.intervals[this.intervalIndex];
      if (this.intervalIndex < this.workout.intervals.length - 1) {
        this.intervalIndex += 1;
        const next = this.workout.intervals[this.intervalIndex];
        this.remainingSeconds = next.seconds;
        if (next.type === 'run') audio.announceRun();
        else audio.announceWalk();
      } else {
        this.phase = PHASE.COOLDOWN;
        this.remainingSeconds = COOLDOWN_SECONDS;
        audio.announceCooldown();
      }
      return;
    }

    if (this.phase === PHASE.COOLDOWN) {
      this.phase = PHASE.COMPLETE;
      this.remainingSeconds = 0;
      this._stopTicking();
      audio.announceComplete();
      this.callbacks.onComplete?.(this.getState());
    }
  }

  isRunning() {
    return this.phase !== PHASE.IDLE && this.phase !== PHASE.COMPLETE && this.phase !== PHASE.PAUSED;
  }

  isComplete() {
    return this.phase === PHASE.COMPLETE;
  }
}

export { formatDuration, PHASE };
