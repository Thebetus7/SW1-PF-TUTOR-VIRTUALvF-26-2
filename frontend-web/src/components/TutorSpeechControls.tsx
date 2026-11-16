import type { ReturnTypeOfSpeech } from "./tutorSpeechTypes";
export function TutorSpeechControls({
  speech,
  showCaption = true,
  showActions = true,
}: {
  speech: ReturnTypeOfSpeech;
  showCaption?: boolean;
  showActions?: boolean;
}) {
  return (
    <div className="tutor-speech-controls">
      <label>
        Perfil de voz{" "}
        <select
          value={speech.gender}
          onChange={(e) => {
            speech.stop();
            speech.setVoiceName("");
            speech.setGender(e.target.value === "female" ? "female" : "male");
          }}
        >
          <option value="male">Docente</option>
          <option value="female">Docente femenina</option>
        </select>
      </label>
      <label>
        Velocidad{" "}
        <select
          value={speech.rate}
          onChange={(e) => speech.setRate(Number(e.target.value))}
        >
          {[0.8, 1, 1.2].map((rate) => (
            <option key={rate} value={rate}>
              {rate}×
            </option>
          ))}
        </select>
      </label>
      <label>
        Voz del dispositivo{" "}
        <select
          value={speech.voiceName}
          onChange={(e) => speech.setVoiceName(e.target.value)}
        >
          <option value="">Automática</option>
          {speech.voices.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name}
            </option>
          ))}
        </select>
      </label>
      {showActions && (
        <>
          <button
            className="btn-secondary"
            onClick={speech.repeat}
            type="button"
          >
            Repetir
          </button>
          <button
            className="btn-secondary"
            onClick={speech.stop}
            type="button"
            disabled={!speech.speaking}
          >
            Detener
          </button>
        </>
      )}
      <small>{speech.provider}</small>
      {speech.error && <p role="status">{speech.error}</p>}
      {showCaption && speech.text && (
        <p
          className="tutor-live-caption"
          aria-label="Transcripción del docente"
        >
          {speech.text.slice(0, speech.range.start)}
          <strong className="tutor-current-word">
            {speech.text.slice(
              speech.range.start,
              speech.range.start + speech.range.length,
            )}
          </strong>
          {speech.text.slice(speech.range.start + speech.range.length)}
        </p>
      )}
    </div>
  );
}
