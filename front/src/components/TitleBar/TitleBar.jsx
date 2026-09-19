import './TitleBar.css';

export default function TitleBar({ title, tag, action }) {
  return (
    <div className="titlebar">
      <div className="ctrls">
        <div className="ctrlDot" />
        <div className="ctrlDot" />
        <div className="ctrlDot" />
      </div>
      <div className="titleText">{title}</div>
      {action}
      <div className="tag">{tag}</div>
    </div>
  );
}
