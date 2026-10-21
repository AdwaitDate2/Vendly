// A simple drawing of an admin screen. Numbered pins match the numbered explanations beside it.
export default function HelpSketch({ layout = 'list', parts = [] }) {
  const pin = (n) => (parts[n - 1] ? <i className="hs-pin" aria-hidden="true">{n}</i> : null);
  return (
    <div className="hs" role="img" aria-label="Drawing of the screen, with numbered parts">
      <div className="hs-bar"><span /><span /><span /></div>
      <div className="hs-body">
        <div className="hs-title"><b /><s /></div>
        {layout === 'list' ? (
          <>
            <div className="hs-toolbar"><em className="hs-grow" />{pin(1)}<em /><em /><u /></div>
            <div className="hs-table">{pin(2)}
              <div className="hs-th"><b /><b /><b /><b /></div>
              {[0, 1, 2, 3].map((i) => <div className="hs-tr" key={i}><b /><b /><b /><span className="hs-chip" />{i === 0 ? <span className="hs-act">Open{pin(3)}</span> : <span className="hs-act">Open</span>}</div>)}
            </div>
            <div className="hs-foot">{pin(4)}<b /><span><i>←</i><i>→</i></span></div>
          </>
        ) : null}
        {layout === 'form' ? (
          <div className="hs-split">
            <div className="hs-stack">
              <div className="hs-card">{pin(1)}<b /><em /><em /><em className="hs-tall" /></div>
              <div className="hs-card">{pin(2)}<b /><em /><em /></div>
            </div>
            <div className="hs-stack">
              <div className="hs-card">{pin(3)}<b /><em /><em /></div>
              <div className="hs-save">{pin(4)}<u /></div>
            </div>
          </div>
        ) : null}
        {layout === 'cards' ? (
          <>
            <div className="hs-toolbar"><em className="hs-grow" /><u>{pin(1)}</u></div>
            <div className="hs-grid">{pin(2)}
              {[0, 1, 2, 3, 4, 5].map((i) => <div className="hs-card hs-card--thumb" key={i}><div className="hs-photo" /><b /><em />{i === 0 ? <span className="hs-act">Edit{pin(3)}</span> : null}</div>)}
            </div>
          </>
        ) : null}
        {layout === 'settings' ? (
          <div className="hs-stack">
            <div className="hs-card">{pin(1)}<b /><div className="hs-days">{[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} className={i % 6 ? 'on' : ''} />)}</div><em /></div>
            <div className="hs-card">{pin(2)}<b /><div className="hs-two"><em /><em /><em /><em /></div></div>
            <div className="hs-card">{pin(3)}<b /><em /><em /></div>
            <div className="hs-save">{pin(4)}<u /></div>
          </div>
        ) : null}
        {layout === 'dashboard' ? (
          <>
            <div className="hs-tiles">{pin(1)}{[0, 1, 2, 3].map((i) => <div className="hs-card" key={i}><em /><b /></div>)}</div>
            <div className="hs-split">
              <div className="hs-card hs-chart">{pin(2)}<svg viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true"><polyline points="0,32 20,26 40,28 60,16 80,20 100,8 120,12" fill="none" stroke="currentColor" strokeWidth="2" /></svg></div>
              <div className="hs-card">{pin(3)}<b /><em /><em /><em /></div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
