import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const TRANSCRIPT = path.join(__dirname, 'test-transcript.txt');
export const CAPTIONS_VTT = path.join(__dirname, 'test-captions.vtt');
export const CAPTIONS_SRT = path.join(__dirname, 'test-captions.srt');
export const VIDEO = path.join(__dirname, 'test-video.mp4');
