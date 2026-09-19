import { useRef, useState } from 'react';
import './MessageInput.css';

export default function MessageInput({ draft, onDraftChange, onSend, onSendImage, onSendRich }) {
  const fileRef = useRef(null);
  const recorderRef = useRef(null);
  const startRef = useRef(0);
  const [recording, setRecording] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  /* [+] — slika ide na backend (upload + socket), ostali fajlovi zasad lokalno */
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      onSendImage(file); // prosledi pravi fajl da App uploaduje
    } else {
      const src = URL.createObjectURL(file);
      onSendRich({ type: 'file', src, name: file.name, size: file.size });
    }
    e.target.value = '';
  };

  /* REC — MediaRecorder start/stop; na stop poruka ide u thread */
  const toggleRecording = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const duration = Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
        onSendRich({ type: 'voice', src: URL.createObjectURL(blob), duration });
        setRecording(false);
      };
      recorder.start();
      recorderRef.current = recorder;
      startRef.current = Date.now();
      setRecording(true);
    } catch {
      setRecording(false); // mikrofon odbijen/nedostupan
    }
  };

  return (
    <div className="inputRow">
      <button
        className="iconBtn"
        title="send image or file"
        onClick={() => fileRef.current?.click()}
      >
        [+]
      </button>
      <input ref={fileRef} type="file" hidden onChange={handleFile} />

      <input
        className="textInput"
        placeholder="type_message..."
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <button
        className={`iconBtn${recording ? ' iconBtn-rec' : ''}`}
        title={recording ? 'stop recording' : 'record voice message'}
        onClick={toggleRecording}
      >
        {recording ? 'STOP' : 'REC'}
      </button>

      <button className="sendBtn" onClick={onSend}>
        SEND
      </button>
    </div>
  );
}
