import { describe, expect, it } from 'vitest';
import { CameraTrackingPolicy, DEFAULT_CAMERA_TRACKING } from './camera-tracking';

const policy = new CameraTrackingPolicy();

describe('CameraTrackingPolicy — the framing each state asks for', () => {
  it('does not move the camera when tracking is off', () => {
    expect(policy.framing('off', { zoomIn: false })).toBeNull();
  });

  it('moves only when the record left the visible area while following', () => {
    expect(policy.framing('follow', { zoomIn: false })).toEqual({
      onlyIfOutside: true,
      zoomIn: false,
    });
  });

  it('moves at every step while keeping the record centred', () => {
    expect(policy.framing('center', { zoomIn: false })).toEqual({
      onlyIfOutside: false,
      zoomIn: false,
    });
  });

  it('carries the zoom choice through, because zooming is orthogonal to moving', () => {
    expect(policy.framing('follow', { zoomIn: true })).toEqual({
      onlyIfOutside: true,
      zoomIn: true,
    });
    expect(policy.framing('off', { zoomIn: true })).toBeNull();
  });
});

describe('CameraTrackingPolicy — the single control that cycles', () => {
  it('walks off, follow, centre and back', () => {
    expect(policy.cycle('off')).toBe('follow');
    expect(policy.cycle('follow')).toBe('center');
    expect(policy.cycle('center')).toBe('off');
  });
});

describe('CameraTrackingPolicy — what the preset gives back', () => {
  it('follows by default, so the map does something out of the box', () => {
    expect(DEFAULT_CAMERA_TRACKING).toBe('follow');
    expect(policy.from(undefined)).toBe('follow');
  });

  it('keeps a state that was saved', () => {
    expect(policy.from('center')).toBe('center');
    expect(policy.from('off')).toBe('off');
  });

  it('falls back when the preset holds something else', () => {
    expect(policy.from('autofocus')).toBe('follow');
    expect(policy.from(3)).toBe('follow');
    expect(policy.from(null)).toBe('follow');
  });
});
