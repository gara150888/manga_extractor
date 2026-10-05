export function loadVoiceStyle(voiceStylePaths: string[], verbose?: boolean): any;
export function loadTextToSpeech(onnxDir: string, useGpu?: boolean): Promise<any>;
export function writeWavFile(filename: string, audioData: number[] | Float32Array, sampleRate: number): void;
export function timer<T>(name: string, fn: () => Promise<T>): Promise<T>;
export function sanitizeFilename(text: string, maxLen: number): string;

